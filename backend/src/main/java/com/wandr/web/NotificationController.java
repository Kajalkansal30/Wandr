package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.dto.AuthDtos;
import com.wandr.dto.NotificationDtos;
import com.wandr.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

  private final NotificationService notificationService;

  @GetMapping
  public List<NotificationDtos.NotificationResponse> list(
      @AuthenticationPrincipal User user,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size
  ) {
    requireUser(user);
    return notificationService.list(user.getId(), page, size);
  }

  @GetMapping("/unread-count")
  public NotificationDtos.UnreadCountResponse unreadCount(@AuthenticationPrincipal User user) {
    requireUser(user);
    return new NotificationDtos.UnreadCountResponse(notificationService.unreadCount(user.getId()));
  }

  @PostMapping("/{id}/read")
  public NotificationDtos.NotificationResponse markRead(
      @AuthenticationPrincipal User user,
      @PathVariable Long id
  ) {
    requireUser(user);
    return notificationService.markRead(user.getId(), id);
  }

  @PostMapping("/read-all")
  public AuthDtos.MessageResponse markAllRead(@AuthenticationPrincipal User user) {
    requireUser(user);
    int marked = notificationService.markAllRead(user.getId());
    return new AuthDtos.MessageResponse("Marked " + marked + " as read");
  }

  @PostMapping("/push-token")
  public NotificationDtos.PushTokenResponse registerPushToken(
      @AuthenticationPrincipal User user,
      @RequestBody NotificationDtos.RegisterPushTokenRequest body
  ) {
    requireUser(user);
    return notificationService.registerPushToken(user.getId(), body == null ? null : body.token(), body == null ? null : body.platform());
  }

  @DeleteMapping("/push-token")
  public AuthDtos.MessageResponse unregisterPushToken(
      @AuthenticationPrincipal User user,
      @RequestBody NotificationDtos.RegisterPushTokenRequest body
  ) {
    requireUser(user);
    notificationService.unregisterPushToken(user.getId(), body == null ? null : body.token());
    return new AuthDtos.MessageResponse("unregistered");
  }

  private static void requireUser(User user) {
    if (user == null) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.UNAUTHORIZED, "Login required");
    }
  }
}
