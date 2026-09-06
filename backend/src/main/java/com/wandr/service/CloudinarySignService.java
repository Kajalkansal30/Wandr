package com.wandr.service;

import com.wandr.config.CloudinaryProperties;
import com.wandr.domain.User;
import com.wandr.dto.CloudinaryDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.TreeMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinarySignService {

  private final CloudinaryProperties cloudinary;

  public CloudinaryDtos.SignResponse signUpload(User user, String purpose) {
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
    }
    if (!cloudinary.isConfigured()) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Cloudinary is not configured on the server"
      );
    }

    String kind = purpose == null || purpose.isBlank() ? "spotted" : purpose.trim().toLowerCase(Locale.ROOT);
    String folder;
    String resourceType;
    switch (kind) {
      case "spotted" -> {
        folder = "spotted/" + user.getId();
        resourceType = "video";
      }
      case "place-cover", "cover", "image" -> {
        folder = "places/" + user.getId();
        resourceType = "image";
      }
      default -> throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "purpose must be spotted or place-cover"
      );
    }

    long timestamp = System.currentTimeMillis() / 1000L;
    String publicId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);

    TreeMap<String, String> params = new TreeMap<>();
    params.put("folder", folder);
    params.put("public_id", publicId);
    params.put("timestamp", String.valueOf(timestamp));

    String signature = sha1Hex(toSignString(params) + cloudinary.apiSecret());

    return new CloudinaryDtos.SignResponse(
        cloudinary.cloudName().trim(),
        cloudinary.apiKey().trim(),
        timestamp,
        signature,
        folder,
        publicId,
        resourceType
    );
  }

  private static String toSignString(TreeMap<String, String> params) {
    StringBuilder sb = new StringBuilder();
    for (var e : params.entrySet()) {
      if (sb.length() > 0) sb.append('&');
      sb.append(e.getKey()).append('=').append(e.getValue());
    }
    return sb.toString();
  }

  private static String sha1Hex(String input) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-1");
      byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-1 not available", e);
    }
  }
}
