package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/owner/billing")
@RequiredArgsConstructor
public class OwnerBillingController {

  private final PaymentService paymentService;

  @GetMapping("/status")
  public Map<String, Object> status(@AuthenticationPrincipal User user) {
    return paymentService.listingFeeStatus(user);
  }

  @PostMapping("/listing-fee/order")
  public Map<String, Object> createOrder(@AuthenticationPrincipal User user) {
    return paymentService.createListingFeeOrder(user);
  }

  @PostMapping("/listing-fee/verify")
  public Map<String, Object> verify(
      @AuthenticationPrincipal User user,
      @RequestBody VerifyBody body
  ) {
    return paymentService.verifyListingFee(
        user,
        body != null ? body.orderId() : null,
        body != null ? body.paymentId() : null,
        body != null ? body.signature() : null
    );
  }

  public record VerifyBody(String orderId, String paymentId, String signature) {}
}
