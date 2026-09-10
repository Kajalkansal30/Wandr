package com.wandr.service;

import com.wandr.domain.OwnershipStatus;
import com.wandr.domain.Place;
import com.wandr.domain.User;
import com.wandr.repo.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class OwnerListingVerificationService {

  private final PlaceService placeService;
  private final PlaceRepository placeRepository;
  private final SmsService smsService;
  private final SecureRandom secureRandom = new SecureRandom();

  private final ConcurrentHashMap<Long, PendingOtp> pending = new ConcurrentHashMap<>();

  @Transactional
  public Map<String, Object> startPhoneOtp(User owner, Long placeId, String phoneOverride) {
    Place place = placeService.requireOwned(owner, placeId);
    String phone = phoneOverride != null && !phoneOverride.isBlank()
        ? phoneOverride.trim()
        : place.getPhone();
    if (phone == null || phone.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Business phone is required");
    }
    place.setPhone(phone);
    place.setPhoneVerified(false);
    placeRepository.save(place);

    String code = String.format("%06d", secureRandom.nextInt(1_000_000));
    pending.put(placeId, new PendingOtp(code, Instant.now().plusSeconds(15 * 60), 0));
    smsService.sendOtp(phone, code);
    return Map.of("sent", true, "phone", mask(phone), "expiresInSec", 900);
  }

  @Transactional
  public Map<String, Object> verifyPhoneOtp(User owner, Long placeId, String code) {
    Place place = placeService.requireOwned(owner, placeId);
    PendingOtp otp = pending.get(placeId);
    if (otp == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start phone OTP first");
    }
    if (otp.expiresAt().isBefore(Instant.now())) {
      pending.remove(placeId);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired. Request a new code.");
    }
    if (otp.attempts() >= 5) {
      pending.remove(placeId);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many attempts. Request a new code.");
    }
    if (code == null || !otp.code().equals(code.trim())) {
      pending.put(placeId, new PendingOtp(otp.code(), otp.expiresAt(), otp.attempts() + 1));
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
    }
    pending.remove(placeId);
    place.setPhoneVerified(true);
    place.setVerificationLevel("PHONE");
    if (place.getOwnershipStatus() == OwnershipStatus.OWNER_CLAIMED) {
      place.setOwnershipStatus(OwnershipStatus.OWNER_VERIFIED);
      place.setVerifiedAt(Instant.now());
      place.setNeedsReverification(false);
    }
    placeRepository.save(place);
    return Map.of("verified", true, "phoneVerified", true);
  }

  private static String mask(String phone) {
    String digits = phone.replaceAll("\\D", "");
    if (digits.length() < 4) return "****";
    return "******" + digits.substring(digits.length() - 4);
  }

  private record PendingOtp(String code, Instant expiresAt, int attempts) {}
}
