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

  @Transactional
  public NotificationDtos.NotificationResponse create(
      Long userId, String type, String title, String message, String data
  ) {
    Notification n = notificationRepository.save(Notification.builder()
        .userId(userId)
        .type(type)
        .title(title)
        .message(message)
        .data(data)
        .build());
    return NotificationDtos.NotificationResponse.from(n);
  }

  @Transactional(readOnly = true)
  public List<NotificationDtos.NotificationResponse> list(Long userId) {
    return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
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
    List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .filter(n -> n.getReadAt() == null)
        .toList();
    Instant now = Instant.now();
    for (Notification n : unread) {
      n.setReadAt(now);
    }
    notificationRepository.saveAll(unread);
    return unread.size();
  }

  @Transactional(readOnly = true)
  public long unreadCount(Long userId) {
    return notificationRepository.countByUserIdAndReadAtIsNull(userId);
  }
}
