package com.wandr.repo;

import com.wandr.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

  List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

  org.springframework.data.domain.Page<Notification> findByUserIdOrderByCreatedAtDesc(
      Long userId, org.springframework.data.domain.Pageable pageable);

  long countByUserIdAndReadAtIsNull(Long userId);

  Optional<Notification> findByUserIdAndTypeAndSourceEventId(Long userId, String type, String sourceEventId);

  @Modifying(clearAutomatically = true)
  @Query("UPDATE Notification n SET n.readAt = :now WHERE n.userId = :userId AND n.readAt IS NULL")
  int markAllRead(@Param("userId") Long userId, @Param("now") java.time.Instant now);

  @Modifying
  @Query("DELETE FROM Notification n WHERE n.userId = :userId")
  int deleteByUserId(@Param("userId") Long userId);
}
