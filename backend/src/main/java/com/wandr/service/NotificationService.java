package com.wandr.service;

import com.wandr.domain.Notification;
import com.wandr.dto.NotificationDtos;
import com.wandr.repo.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

  private final NotificationRepository notificationRepository;

  /**
   * Idempotent create when {@code sourceEventId} is set: same user+type+event skips duplicates.
   */
  @Transactional
  public NotificationDtos.NotificationResponse create(
      Long userId,
      String type,
      String title,
      String message,
      String entityType,
      Long entityId,
      String metadata,
      String sourceEventId
  ) {
    if (sourceEventId != null && !sourceEventId.isBlank()) {
      var existing = notificationRepository.findByUserIdAndTypeAndSourceEventId(userId, type, sourceEventId);
      if (existing.isPresent()) {
        return NotificationDtos.NotificationResponse.from(existing.get());
      }
    }

    String legacyData = entityId == null ? null : String.valueOf(entityId);
    Notification n = notificationRepository.save(Notification.builder()
        .userId(userId)
        .type(type)
        .title(title)
        .message(message)
        .data(legacyData)
        .entityType(entityType)
        .entityId(entityId)
        .metadata(metadata)
        .sourceEventId(sourceEventId)
        .build());
    return NotificationDtos.NotificationResponse.from(n);
  }

  @Transactional(readOnly = true)
  public List<NotificationDtos.NotificationResponse> list(Long userId) {
    return list(userId, 0, 50);
  }

  @Transactional(readOnly = true)
  public List<NotificationDtos.NotificationResponse> list(Long userId, int page, int size) {
    int safeSize = Math.min(Math.max(size, 1), 100);
    int safePage = Math.max(page, 0);
    var pageable = org.springframework.data.domain.PageRequest.of(safePage, safeSize);
    return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).stream()
        .map(NotificationDtos.NotificationResponse::from)
        .toList();
  }

  @Transactional
  public NotificationDtos.NotificationResponse markRead(Long userId, Long id) {
    Notification n = notificationRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
    if (!n.getUserId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your notification");
    }
    if (n.getReadAt() == null) {
      n.setReadAt(Instant.now());
      notificationRepository.save(n);
    }
    return NotificationDtos.NotificationResponse.from(n);
  }

  @Transactional
  public int markAllRead(Long userId) {
    return notificationRepository.markAllRead(userId, Instant.now());
  }

  @Transactional(readOnly = true)
  public long unreadCount(Long userId) {
    return notificationRepository.countByUserIdAndReadAtIsNull(userId);
  }
}
