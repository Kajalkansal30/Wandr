package com.wandr.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wandr.cloudinary")
public record CloudinaryProperties(
    String cloudName,
    String apiKey,
    String apiSecret
) {
  public boolean isConfigured() {
    return notBlank(cloudName) && notBlank(apiKey) && notBlank(apiSecret);
  }

  private static boolean notBlank(String s) {
    return s != null && !s.isBlank();
  }
}
