package com.wandr.service;

import com.wandr.domain.*;
import com.wandr.dto.ClaimDtos;
import com.wandr.dto.ModerationDtos;
import com.wandr.repo.PlaceClaimRepository;
import com.wandr.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClaimService {

  private final PlaceClaimRepository placeClaimRepository;
  private final PlaceService placeService;
  private final ModerationService moderationService;
  private final UserRepository userRepository;

  public List<ClaimDtos.ClaimResponse> listPending() {
    return placeClaimRepository.findByStatusOrderByCreatedAtDesc(ClaimStatus.PENDING).stream()
        .map(c -> ClaimDtos.ClaimResponse.from(c, placeName(c.getPlaceId())))
        .toList();
  }

  public List<ClaimDtos.ClaimResponse> listMine(User user) {
    return placeClaimRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
        .map(c -> ClaimDtos.ClaimResponse.from(c, placeName(c.getPlaceId())))
        .toList();
  }

  @Transactional
  public ClaimDtos.ClaimResponse create(User user, Long placeId, ClaimDtos.CreateClaimRequest req) {
    Place place = placeService.requirePlace(placeId);
    if (place.getOwnershipStatus() == OwnershipStatus.OWNER_VERIFIED
        || place.getOwnershipStatus() == OwnershipStatus.OWNER_CLAIMED) {
      if (place.getOwner() != null && !place.getOwner().getId().equals(user.getId())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "This place already has an owner");
      }
    }
    boolean verifyReq = req != null && Boolean.TRUE.equals(req.verificationRequest());
    if (!verifyReq && place.getOwnershipStatus() != OwnershipStatus.UNCLAIMED
        && place.getOwnershipStatus() != OwnershipStatus.CLAIM_PENDING) {
      if (place.getOwner() == null || !place.getOwner().getId().equals(user.getId())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Place is not available to claim");
      }
    }

    PlaceClaim claim = PlaceClaim.builder()
        .placeId(placeId)
        .userId(user.getId())
        .status(ClaimStatus.PENDING)
        .phone(req != null ? req.phone() : null)
        .evidence(req != null ? req.evidence() : null)
        .verificationRequest(verifyReq)
        .build();
    placeClaimRepository.save(claim);

    if (!verifyReq) {
      place.setOwnershipStatus(OwnershipStatus.CLAIM_PENDING);
      placeService.save(place);
    }

    return ClaimDtos.ClaimResponse.from(claim, place.getName());
  }

  @Transactional
  public ClaimDtos.ClaimResponse approve(User admin, Long claimId, ModerationDtos.DecisionRequest req) {
    PlaceClaim claim = placeClaimRepository.findById(claimId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    Place place = placeService.requirePlace(claim.getPlaceId());
    User claimant = userRepository.findById(claim.getUserId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    claim.setStatus(ClaimStatus.APPROVED);
    claim.setResolvedAt(Instant.now());
    if (req != null && req.note() != null) claim.setAdminNote(req.note());
    placeClaimRepository.save(claim);

    place.setOwner(claimant);
    place.setClaimedAt(Instant.now());

    if (Boolean.TRUE.equals(claim.getVerificationRequest())) {
      place.setOwnershipStatus(OwnershipStatus.OWNER_VERIFIED);
      place.setVerifiedAt(Instant.now());
      place.setLastVerifiedAt(Instant.now());
      place.setPhoneVerified(true);
      place.setLocationVerified(true);
      moderationService.log(admin, place.getId(), claimId, null, ModerationActionType.APPROVE_VERIFICATION, req);
    } else {
      place.setOwnershipStatus(OwnershipStatus.OWNER_CLAIMED);
      moderationService.log(admin, place.getId(), claimId, null, ModerationActionType.APPROVE_CLAIM, req);
    }
    placeService.save(place);
    return ClaimDtos.ClaimResponse.from(claim, place.getName());
  }

  @Transactional
  public ClaimDtos.ClaimResponse reject(User admin, Long claimId, ModerationDtos.DecisionRequest req) {
    PlaceClaim claim = placeClaimRepository.findById(claimId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    Place place = placeService.requirePlace(claim.getPlaceId());
    claim.setStatus(ClaimStatus.REJECTED);
    claim.setResolvedAt(Instant.now());
    if (req != null && req.note() != null) claim.setAdminNote(req.note());
    placeClaimRepository.save(claim);

    if (!Boolean.TRUE.equals(claim.getVerificationRequest())
        && place.getOwnershipStatus() == OwnershipStatus.CLAIM_PENDING) {
      place.setOwnershipStatus(OwnershipStatus.UNCLAIMED);
      placeService.save(place);
    }
    moderationService.log(admin, place.getId(), claimId, null,
        Boolean.TRUE.equals(claim.getVerificationRequest())
            ? ModerationActionType.REJECT_VERIFICATION
            : ModerationActionType.REJECT_CLAIM,
        req);
    return ClaimDtos.ClaimResponse.from(claim, place.getName());
  }

  @Transactional
  public ClaimDtos.ClaimResponse requestInfo(User admin, Long claimId, ModerationDtos.DecisionRequest req) {
    PlaceClaim claim = placeClaimRepository.findById(claimId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    claim.setStatus(ClaimStatus.NEED_INFO);
    if (req != null) {
      if (req.reasons() != null) {
        claim.setNeedsInfoReasons(String.join(",", req.reasons()));
      }
      if (req.note() != null) claim.setAdminNote(req.note());
    }
    placeClaimRepository.save(claim);
    moderationService.log(admin, claim.getPlaceId(), claimId, null, ModerationActionType.REQUEST_CLAIM_INFO, req);
    return ClaimDtos.ClaimResponse.from(claim, placeName(claim.getPlaceId()));
  }

  /** Trust profile progress for owner dashboard. */
  public MapTrust trustProfile(Place place) {
    int identity = 0;
    if (place.getOwner() != null) identity += 40;
    if (Boolean.TRUE.equals(place.getPhoneVerified())) identity += 40;
    if (place.getOwnershipStatus() == OwnershipStatus.OWNER_VERIFIED) identity += 20;

    int business = 0;
    if (place.getDescription() != null && !place.getDescription().isBlank()) business += 20;
    if (place.getHours() != null && !place.getHours().isBlank()) business += 20;
    if (place.getImageUrl() != null) business += 15;
    if (Boolean.TRUE.equals(place.getBusinessDocVerified())) business += 25;
    if (Boolean.TRUE.equals(place.getFssaiVerified())) business += 20;

    int location = 0;
    if (place.getAddress() != null && !place.getAddress().isBlank()) location += 40;
    if (place.getLat() != null && place.getLng() != null) location += 30;
    if (Boolean.TRUE.equals(place.getLocationVerified())) location += 30;

    String level = "LOW";
    int avg = (identity + business + location) / 3;
    if (avg >= 75) level = "HIGH";
    else if (avg >= 45) level = "MEDIUM";

    return new MapTrust(identity, business, location, level, place.getOwnershipStatus().name());
  }

  public record MapTrust(int identityPct, int businessPct, int locationPct, String trustLevel, String ownershipStatus) {}

  private String placeName(Long id) {
    try {
      return placeService.requirePlace(id).getName();
    } catch (Exception e) {
      return "Place";
    }
  }
}
