package com.wandr.dto;

import com.wandr.domain.Notification;

import java.time.Instant;

public class NotificationDtos {

  public record NotificationResponse(
      Long id,
      String type,
      String title,
      String message,
      String data,
      String entityType,
      Long entityId,
      String metadata,
      Instant readAt,
      Instant createdAt
  ) {
    public static NotificationResponse from(Notification n) {
      return new NotificationResponse(
          n.getId(),
          n.getType(),
          n.getTitle(),
          n.getMessage(),
          n.getData(),
          n.getEntityType(),
          n.getEntityId(),
          n.getMetadata(),
          n.getReadAt(),
          n.getCreatedAt()
      );
    }
  }

  public record UnreadCountResponse(long unread) {}

  public record RegisterPushTokenRequest(String token, String platform) {}

  public record PushTokenResponse(String status) {}
}
