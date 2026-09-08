package com.wandr.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * SMS delivery for business phone OTP. Without a provider key, codes are logged
 * (same pattern as EmailService in dev) so local/staging can still verify claims.
 */
@Service
@Slf4j
public class SmsService {

  private final String provider;

  public SmsService(@Value("${wandr.sms.provider:log}") String provider) {
    this.provider = provider == null ? "log" : provider.trim().toLowerCase();
  }

  public void sendOtp(String phoneE164ish, String code) {
    if ("log".equals(provider) || provider.isBlank()) {
      log.info("SMS OTP (dev/log provider) to={} code={}", phoneE164ish, code);
      return;
    }
    // Hook for Twilio/MSG91 later — fail closed to log so claims stay testable.
    log.warn("SMS provider '{}' not wired; logging OTP for {}", provider, phoneE164ish);
    log.info("SMS OTP to={} code={}", phoneE164ish, code);
  }
}
