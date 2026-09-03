package com.wandr.dto;

import com.wandr.domain.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

public class PlaceDtos {

  public record PlaceUpsertRequest(
      String name,
      String category,
      String type,
      String locationType,
      String description,
      String address,
      String city,
      String exactAddressPrivate,
      String serviceArea,
      String image,
      String phone,
      String whatsapp,
      String website,
      String instagram,
      String hours,
      Double lat,
      Double lng,
      Integer priceLevel,
      Integer avgCostForTwo,
      List<String> tags,
      List<String> bestFor,
      LocalDate openingDate
  ) {}

  public record CommunitySubmitRequest(
      String name,
      String category,
      String locationType,
      String description,
      String address,
      String city,
      String image,
      String instagram,
      Integer priceLevel,
      List<String> tags,
      Double lat,
      Double lng
  ) {}

  public record PlaceResponse(
      Long id,
      String name,
      String category,
      String type,
      String locationType,
      String description,
      String address,
      String city,
      String serviceArea,
      String image,
      String phone,
      String whatsapp,
      String website,
      String instagram,
      String hours,
      Double lat,
      Double lng,
      Double rating,
      Integer reviewCount,
      Integer savedCount,
      Integer priceLevel,
      Integer avgCostForTwo,
      String badge,
      Integer openedDaysAgo,
      Integer savesThisWeek,
      Integer savesLastWeek,
      List<String> tags,
      List<String> bestFor,
      String status,
      String ownershipStatus,
      String operatingStatus,
      Boolean temporarilyClosed,
      Boolean verified,
      List<String> verifiedDetails,
      Boolean phoneVerified,
      Boolean locationVerified,
      Boolean businessDocVerified,
      Boolean fssaiVerified,
      Boolean socialVerified,
      Boolean communityConfirmed,
      Integer communityConfirmCount,
      Instant claimedAt,
      Instant verifiedAt,
      Instant lastVerifiedAt,
      Instant lastInformationCheck,
      LocalDate openingDate,
      String needsInfoReasons,
      String adminNote,
      String ownerDisplayName,
      Double distance,
      Boolean sponsored,
      String sponsoredHeadline,
      Long boostCampaignId,
      Instant boostEndsAt
  ) {
    public static PlaceResponse from(Place p, Double distanceKm) {
      return from(p, distanceKm, false, null, null, null);
    }

    public static PlaceResponse from(
        Place p,
        Double distanceKm,
        boolean sponsored,
        String sponsoredHeadline,
        Long boostCampaignId,
        Instant boostEndsAt
    ) {
      boolean ownerVerified = p.getOwnershipStatus() == OwnershipStatus.OWNER_VERIFIED;
      return new PlaceResponse(
          p.getId(),
          p.getName(),
          p.getCategory(),
          p.getType(),
          p.getLocationType() != null ? p.getLocationType().name() : null,
          p.getDescription(),
          p.getAddress(),
          p.getCity(),
          p.getServiceArea(),
          p.getImageUrl(),
          p.getPhone(),
          p.getWhatsapp(),
          p.getWebsite(),
          p.getInstagram(),
          p.getHours(),
          p.getLat(),
          p.getLng(),
          p.getRating(),
          p.getReviewCount(),
          p.getSavedCount(),
          p.getPriceLevel(),
          p.getAvgCostForTwo(),
          p.getBadge(),
          p.getOpenedDaysAgo(),
          p.getSavesThisWeek() == null ? 0 : p.getSavesThisWeek(),
          p.getSavesLastWeek() == null ? 0 : p.getSavesLastWeek(),
          split(p.getTags()),
          split(p.getBestFor()),
          p.getStatus() != null ? p.getStatus().name() : null,
          p.getOwnershipStatus() != null ? p.getOwnershipStatus().name() : null,
          p.getOperatingStatus() != null ? p.getOperatingStatus().name() : null,
          Boolean.TRUE.equals(p.getTemporarilyClosed()),
          ownerVerified,
          trustDetails(p, ownerVerified),
          Boolean.TRUE.equals(p.getPhoneVerified()),
          Boolean.TRUE.equals(p.getLocationVerified()),
          Boolean.TRUE.equals(p.getBusinessDocVerified()),
          Boolean.TRUE.equals(p.getFssaiVerified()),
          Boolean.TRUE.equals(p.getSocialVerified()),
          Boolean.TRUE.equals(p.getCommunityConfirmed()),
          p.getCommunityConfirmCount() == null ? 0 : p.getCommunityConfirmCount(),
          p.getClaimedAt(),
          p.getVerifiedAt(),
          p.getLastVerifiedAt(),
          p.getLastInformationCheck(),
          p.getOpeningDate(),
          p.getNeedsInfoReasons(),
          p.getAdminNote(),
          p.getOwner() != null ? p.getOwner().getDisplayName() : null,
          distanceKm,
          sponsored,
          sponsoredHeadline,
          boostCampaignId,
          boostEndsAt
      );
    }

    private static List<String> trustDetails(Place p, boolean ownerVerified) {
      java.util.ArrayList<String> list = new java.util.ArrayList<>();
      if (ownerVerified) list.add("Owner verified");
      if (Boolean.TRUE.equals(p.getPhoneVerified())) list.add("Phone verified");
      if (Boolean.TRUE.equals(p.getLocationVerified())) list.add("Location confirmed");
      if (Boolean.TRUE.equals(p.getBusinessDocVerified())) list.add("Business credentials");
      if (Boolean.TRUE.equals(p.getFssaiVerified())) list.add("FSSAI on file");
      if (Boolean.TRUE.equals(p.getSocialVerified())) list.add("Social matched");
      if (Boolean.TRUE.equals(p.getCommunityConfirmed())) list.add("Community confirmed");
      if (p.getOwnershipStatus() == OwnershipStatus.UNCLAIMED) list.add("Community listing · unclaimed");
      return list;
    }

    private static List<String> split(String csv) {
      if (csv == null || csv.isBlank()) return List.of();
      return Arrays.stream(csv.split(","))
          .map(String::trim)
          .filter(s -> !s.isEmpty())
          .toList();
    }
  }
}
