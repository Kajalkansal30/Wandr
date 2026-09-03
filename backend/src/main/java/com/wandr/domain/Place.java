package com.wandr.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "places")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Place {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  private String category;

  private String type;

  @Enumerated(EnumType.STRING)
  private LocationType locationType;

  @Column(length = 2000)
  private String description;

  private String address;

  private String city;

  /** Private address for home bakeries — never shown publicly. */
  private String exactAddressPrivate;

  private String serviceArea;

  private String imageUrl;

  private String phone;

  private String whatsapp;

  private String website;

  private String instagram;

  private String hours;

  private Double lat;

  private Double lng;

  private Double rating;

  private Integer reviewCount;

  private Integer savedCount;

  private Integer priceLevel;

  private Integer avgCostForTwo;

  private String badge;

  private Integer openedDaysAgo;

  private Integer savesThisWeek;

  private Integer savesLastWeek;

  /** Comma-separated tags */
  private String tags;

  /** Comma-separated bestFor values */
  private String bestFor;

  @Enumerated(EnumType.STRING)
  private PlaceStatus status;

  @Enumerated(EnumType.STRING)
  private OwnershipStatus ownershipStatus;

  @Enumerated(EnumType.STRING)
  private OperatingStatus operatingStatus;

  private Boolean temporarilyClosed;

  private Instant claimedAt;

  private Instant verifiedAt;

  private Instant lastVerifiedAt;

  private Instant closedAt;

  private LocalDate openingDate;

  private Instant lastInformationCheck;

  private Boolean phoneVerified;

  private Boolean locationVerified;

  private Boolean businessDocVerified;

  private Boolean fssaiVerified;

  private Boolean socialVerified;

  private Boolean communityConfirmed;

  private Integer communityConfirmCount;

  /** Comma-separated reasons when admin requests more info */
  @Column(length = 1000)
  private String needsInfoReasons;

  @Column(length = 2000)
  private String adminNote;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "owner_id")
  private User owner;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = Instant.now();
    if (status == null) status = PlaceStatus.PENDING_REVIEW;
    if (ownershipStatus == null) ownershipStatus = OwnershipStatus.UNCLAIMED;
    if (operatingStatus == null) operatingStatus = OperatingStatus.OPEN;
    if (temporarilyClosed == null) temporarilyClosed = false;
    if (rating == null) rating = 0.0;
    if (reviewCount == null) reviewCount = 0;
    if (savedCount == null) savedCount = 0;
    if (savesThisWeek == null) savesThisWeek = 0;
    if (savesLastWeek == null) savesLastWeek = 0;
    if (priceLevel == null) priceLevel = 1;
    if (phoneVerified == null) phoneVerified = false;
    if (locationVerified == null) locationVerified = false;
    if (businessDocVerified == null) businessDocVerified = false;
    if (fssaiVerified == null) fssaiVerified = false;
    if (socialVerified == null) socialVerified = false;
    if (communityConfirmed == null) communityConfirmed = false;
    if (communityConfirmCount == null) communityConfirmCount = 0;
    if (locationType == null) locationType = LocationType.CAFE;
  }
}
