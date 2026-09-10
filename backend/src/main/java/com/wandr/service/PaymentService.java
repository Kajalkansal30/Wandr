package com.wandr.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.wandr.domain.Role;
import com.wandr.domain.User;
import com.wandr.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

  private final UserRepository userRepository;

  @Value("${wandr.razorpay.key-id:}")
  private String keyId;

  @Value("${wandr.razorpay.key-secret:}")
  private String keySecret;

  @Value("${wandr.billing.listing-fee-paise:10000}")
  private int listingFeePaise;

  @Value("${wandr.billing.allow-mock-when-unconfigured:true}")
  private boolean allowMockWhenUnconfigured;

  public Map<String, Object> listingFeeStatus(User user) {
    User fresh = requireOwner(user);
    return Map.of(
        "listingFeePaid", fresh.isListingFeePaid(),
        "amountInr", listingFeePaise / 100,
        "amountPaise", listingFeePaise,
        "razorpayConfigured", isConfigured(),
        "mockAllowed", !isConfigured() && allowMockWhenUnconfigured
    );
  }

  @Transactional
  public Map<String, Object> createListingFeeOrder(User user) {
    User fresh = requireOwner(user);
    if (fresh.isListingFeePaid()) {
      return Map.of(
          "alreadyPaid", true,
          "listingFeePaid", true,
          "amountInr", listingFeePaise / 100
      );
    }

    if (!isConfigured()) {
      if (!allowMockWhenUnconfigured) {
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay is not configured");
      }
      return Map.of(
          "mock", true,
          "amountInr", listingFeePaise / 100,
          "amountPaise", listingFeePaise,
          "keyId", "",
          "orderId", "mock_order_" + fresh.getId()
      );
    }

    try {
      RazorpayClient client = new RazorpayClient(keyId, keySecret);
      JSONObject options = new JSONObject();
      options.put("amount", listingFeePaise);
      options.put("currency", "INR");
      options.put("receipt", "listing_" + fresh.getId() + "_" + Instant.now().getEpochSecond());
      JSONObject notes = new JSONObject();
      notes.put("userId", String.valueOf(fresh.getId()));
      notes.put("purpose", "listing_fee");
      options.put("notes", notes);
      Order order = client.orders.create(options);
      return Map.of(
          "mock", false,
          "orderId", order.get("id"),
          "amountPaise", listingFeePaise,
          "amountInr", listingFeePaise / 100,
          "currency", "INR",
          "keyId", keyId
      );
    } catch (RazorpayException e) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not create payment order");
    }
  }

  @Transactional
  public Map<String, Object> verifyListingFee(User user, String orderId, String paymentId, String signature) {
    User fresh = requireOwner(user);
    if (fresh.isListingFeePaid()) {
      return Map.of("listingFeePaid", true, "alreadyPaid", true);
    }

    if (!isConfigured()) {
      if (!allowMockWhenUnconfigured) {
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay is not configured");
      }
      // Simulated unlock for local/dev when keys are absent
      fresh.setListingFeePaid(true);
      fresh.setListingFeePaidAt(Instant.now());
      fresh.setRazorpayPaymentId(paymentId != null && !paymentId.isBlank() ? paymentId : "mock_pay_" + fresh.getId());
      userRepository.save(fresh);
      return Map.of("listingFeePaid", true, "mock", true);
    }

    if (orderId == null || paymentId == null || signature == null
        || orderId.isBlank() || paymentId.isBlank() || signature.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId, paymentId and signature are required");
    }

    String payload = orderId + "|" + paymentId;
    if (!hmacSha256Hex(payload, keySecret).equals(signature)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment signature");
    }

    fresh.setListingFeePaid(true);
    fresh.setListingFeePaidAt(Instant.now());
    fresh.setRazorpayPaymentId(paymentId.trim());
    userRepository.save(fresh);
    return Map.of("listingFeePaid", true, "mock", false);
  }

  public void requireListingFeePaid(User user) {
    User fresh = requireOwner(user);
    if (!fresh.isListingFeePaid() && fresh.getRole() != Role.ADMIN) {
      throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Pay ₹100 once to unlock café listings");
    }
  }

  private User requireOwner(User user) {
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
    }
    User fresh = userRepository.findById(user.getId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required"));
    if (fresh.getRole() != Role.OWNER && fresh.getRole() != Role.ADMIN) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Café owner account required");
    }
    return fresh;
  }

  private boolean isConfigured() {
    return keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank();
  }

  private static String hmacSha256Hex(String data, String secret) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(raw);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Signature check failed");
    }
  }
}
