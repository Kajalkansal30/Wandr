package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "business_members", indexes = {
    @Index(name = "idx_business_members_place", columnList = "placeId"),
    @Index(name = "idx_business_members_user", columnList = "userId")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_business_member_place_user", columnNames = {"placeId", "userId"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessMember {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long placeId;

  @Column(nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  private BusinessMemberRole role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private BusinessMemberStatus status;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) createdAt = now;
    updatedAt = now;
    if (status == null) status = BusinessMemberStatus.ACTIVE;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}
