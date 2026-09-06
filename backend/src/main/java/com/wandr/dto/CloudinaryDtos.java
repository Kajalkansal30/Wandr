package com.wandr.dto;

public final class CloudinaryDtos {
  private CloudinaryDtos() {}

  public record SignResponse(
      String cloudName,
      String apiKey,
      long timestamp,
      String signature,
      String folder,
      String publicId,
      String resourceType
  ) {}
}
