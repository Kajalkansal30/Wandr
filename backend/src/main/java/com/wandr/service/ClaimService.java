package com.wandr.service;

import com.wandr.domain.*;
import com.wandr.dto.ClaimDtos;
import com.wandr.dto.ModerationDtos;
import com.wandr.repo.BusinessMemberRepository;
import com.wandr.repo.ClaimEvidenceRepository;
import com.wandr.repo.PlaceClaimRepository;
import com.wandr.repo.UserRepository;
import com.wandr.security.VerifiedEmailGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaimService {

  private final PlaceClaimRepository placeClaimRepository;
  private final ClaimEvidenceRepository claimEvidenceRepository;
  private final BusinessMemberRepository businessMemberRepository;
  private final PlaceService placeService;
  private final ModerationService moderationService;
  private final UserRepository userRepository;
  private final NotificationService notificationService;
  private final ClaimRiskService claimRiskService;
  private final SmsService smsService;
  private final EmailService emailService;
  private final DomainVerificationService domainVerificationService;

  @org.springframework.beans.factory.annotation.Value("${wandr.app.web-base-url:https://www.wandrhere.com}")
  private String webBaseUrl;

  private final SecureRandom secureRandom = new SecureRandom();

  public List<ClaimDtos.ClaimResponse> listPending() {
    return placeClaimRepository.findByStatusInOrderByCreatedAtDesc(
            List.of(ClaimStatus.PENDING, ClaimStatus.NEED_INFO))
        .stream()
        .map(this::toResponse)
        .toList();
  }

  public List<ClaimDtos.ClaimResponse> listMine(User user) {
    return placeClaimRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
        .map(this::toResponse)
        .toList();
  }

  public ClaimDtos.AvailableMethodsResponse availableMethods(Long placeId) {
    Place place = placeService.requirePlace(placeId);
    boolean managed = businessMemberRepository.existsByPlaceIdAndStatus(place.getId(), BusinessMemberStatus.ACTIVE)
        || (place.getOwner() != null && (place.getOwnershipStatus() == OwnershipStatus.OWNER_CLAIMED
        || place.getOwnershipStatus() == OwnershipStatus.OWNER_VERIFIED));
    boolean unclaimed = place.getOwnershipStatus() == OwnershipStatus.UNCLAIMED
        || place.getOwnershipStatus() == OwnershipStatus.CLAIM_PENDING;

    java.util.ArrayList<String> recommended = new java.util.ArrayList<>();
    java.util.ArrayList<String> other = new java.util.ArrayList<>();
    boolean hasPhone = place.getPhone() != null && !place.getPhone().isBlank();
    boolean hasWebsite = place.getWebsite() != null && !place.getWebsite().isBlank();
    // Only expose usable contact methods — hide phone/DNS/email when listing lacks phone/website.
    if (hasPhone) {
      recommended.add("PHONE_OTP");
    }
    if (hasWebsite) {
      recommended.add("DOMAIN_TXT");
      recommended.add("BUSINESS_EMAIL");
    }
    other.add("VIDEO");
    other.add("DOCUMENT");

    return new ClaimDtos.AvailableMethodsResponse(
        placeId,
        place.getOwnershipStatus() != null ? place.getOwnershipStatus().name() : null,
        managed,
        unclaimed && !managed,
        managed,
        recommended,
        other,
        maskPhone(place.getPhone()),
        place.getWebsite()
    );
  }

  @Transactional(readOnly = true)
  public ClaimDtos.ClaimResponse findMinePending(User user, Long placeId) {
    VerifiedEmailGuard.requireVerified(user);
    return placeClaimRepository.findByPlaceIdOrderByCreatedAtDesc(placeId).stream()
        .filter(c -> c.getUserId().equals(user.getId()))
        .filter(c -> c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.NEED_INFO)
        .findFirst()
        .map(c -> toResponse(c, "Resume your claim verification."))
        .orElse(null);
  }

  @Transactional
  public ClaimDtos.ClaimResponse create(User user, Long placeId, ClaimDtos.CreateClaimRequest req) {
    VerifiedEmailGuard.requireVerified(user);
    Place place = placeService.requirePlace(placeId);

    ClaimKind kind = parseKind(req);
    BusinessMemberRole role = parseRole(req != null ? req.requestedRole() : null);

    // Resume existing open claim instead of creating duplicates
    var existing = placeClaimRepository.findByPlaceIdOrderByCreatedAtDesc(placeId).stream()
        .filter(c -> c.getUserId().equals(user.getId()))
        .filter(c -> c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.NEED_INFO)
        .findFirst();
    if (existing.isPresent() && (kind == ClaimKind.CLAIM || kind == ClaimKind.VERIFICATION_UPGRADE)) {
      PlaceClaim open = existing.get();
      if (role != null) {
        open.setRequestedRole(role);
        placeClaimRepository.save(open);
      }
      return toResponse(open, "Resuming your open claim. Choose a verification method.");
    }

    if (kind == ClaimKind.ACCESS_REQUEST || kind == ClaimKind.DISPUTE) {
      if (!hasActiveManager(place)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Place is not managed yet — claim it instead");
      }
    } else if (kind == ClaimKind.CLAIM) {
      if (hasActiveManager(place) && (place.getOwner() == null || !place.getOwner().getId().equals(user.getId()))) {
        throw new ResponseStatusException(HttpStatus.CONFLICT,
            "This business is already managed by another account. Request access instead.");
      }
      if (place.getOwnershipStatus() != OwnershipStatus.UNCLAIMED
          && place.getOwnershipStatus() != OwnershipStatus.CLAIM_PENDING) {
        if (place.getOwner() == null || !place.getOwner().getId().equals(user.getId())) {
          throw new ResponseStatusException(HttpStatus.CONFLICT, "Place is not available to claim");
        }
      }
    } else if (kind == ClaimKind.VERIFICATION_UPGRADE) {
      requireMemberOrOwner(user, place);
    }

    if (req != null && req.businessModel() != null && !req.businessModel().isBlank()) {
      try {
        place.setBusinessModel(BusinessModel.valueOf(req.businessModel().trim().toUpperCase(Locale.ROOT)));
      } catch (Exception ignored) { /* ignore bad enum */ }
    }
    if (req != null && req.businessSize() != null && !req.businessSize().isBlank()) {
      try {
        place.setBusinessSize(BusinessSize.valueOf(req.businessSize().trim().toUpperCase(Locale.ROOT)));
      } catch (Exception ignored) { /* ignore */ }
    }

    ClaimRiskService.RiskResult risk = claimRiskService.assess(user, place, kind);

    PlaceClaim claim = PlaceClaim.builder()
        .placeId(placeId)
        .userId(user.getId())
        .status(kind == ClaimKind.DISPUTE ? ClaimStatus.NEED_INFO : ClaimStatus.PENDING)
        .phone(req != null ? req.phone() : null)
        .evidence(req != null ? req.evidence() : null)
        .verificationRequest(kind == ClaimKind.VERIFICATION_UPGRADE)
        .requestedRole(role)
        .claimKind(kind)
        .riskScore(risk.score())
        .riskReasons(String.join(",", risk.reasons()))
        .decision(risk.isHigh() || kind == ClaimKind.DISPUTE || kind == ClaimKind.ACCESS_REQUEST
            ? "QUEUED_ADMIN" : null)
        .build();
    placeClaimRepository.save(claim);

    if (kind == ClaimKind.CLAIM) {
      place.setOwnershipStatus(OwnershipStatus.CLAIM_PENDING);
      placeService.save(place);
    }

    if (kind == ClaimKind.ACCESS_REQUEST || kind == ClaimKind.DISPUTE) {
      notifyManagers(place, kind, user);
      return toResponse(claim, "Submitted for review. Existing managers were notified.");
    }

    return toResponse(claim, "Claim started. Choose a verification method.");
  }

  @Transactional
  public ClaimDtos.ClaimResponse startPhoneOtp(User user, Long claimId) {
    PlaceClaim claim = requireClaimant(user, claimId);
    Place place = placeService.requirePlace(claim.getPlaceId());
    String phone = place.getPhone();
    if (phone == null || phone.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing has no business phone for OTP");
    }
    // Invalidate prior phone OTP challenges
    claimEvidenceRepository.findByClaimIdOrderByCreatedAtDesc(claim.getId()).stream()
        .filter(e -> e.getMethod() == ClaimEvidenceMethod.PHONE_OTP)
        .filter(e -> e.getStatus() == ClaimEvidenceStatus.SENT || e.getStatus() == ClaimEvidenceStatus.PENDING)
        .forEach(e -> {
          e.setStatus(ClaimEvidenceStatus.EXPIRED);
          claimEvidenceRepository.save(e);
        });
    String code = String.format("%06d", secureRandom.nextInt(1_000_000));
    ClaimEvidence ev = ClaimEvidence.builder()
        .claimId(claim.getId())
        .placeId(place.getId())
        .userId(user.getId())
        .method(ClaimEvidenceMethod.PHONE_OTP)
        .status(ClaimEvidenceStatus.SENT)
        .targetValue(phone)
        .secretHash(hash(code))
        .metadata("{\"attempts\":0}")
        .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
        .build();
    claimEvidenceRepository.save(ev);
    smsService.sendOtp(phone, code);
    return toResponse(claim, "OTP sent to the business phone on the listing.");
  }

  @Transactional
  public ClaimDtos.ClaimResponse verifyPhoneOtp(User user, Long claimId, String code) {
    PlaceClaim claim = requireClaimant(user, claimId);
    ClaimEvidence ev = claimEvidenceRepository
        .findFirstByClaimIdAndMethodOrderByCreatedAtDesc(claimId, ClaimEvidenceMethod.PHONE_OTP)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start phone OTP first"));
    if (ev.getStatus() == ClaimEvidenceStatus.EXPIRED || ev.getStatus() == ClaimEvidenceStatus.FAILED) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired or locked. Request a new code.");
    }
    assertNotExpired(ev);
    int attempts = readAttempts(ev);
    if (attempts >= 5) {
      ev.setStatus(ClaimEvidenceStatus.FAILED);
      claimEvidenceRepository.save(ev);
      throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many invalid OTP attempts. Request a new code.");
    }
    if (!hash(code == null ? "" : code.trim()).equals(ev.getSecretHash())) {
      writeAttempts(ev, attempts + 1);
      if (attempts + 1 >= 5) {
        ev.setStatus(ClaimEvidenceStatus.FAILED);
      }
      claimEvidenceRepository.save(ev);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
    }
    markEvidenceVerified(ev);
    Place place = placeService.requirePlace(claim.getPlaceId());
    place.setPhoneVerified(true);
    placeService.save(place);
    claim.setVerificationScore(scoreFor(claim) + 40);
    claim.setVerificationMethod("PHONE_OTP");
    claim.setVerificationLevel("CONTACT");
    placeClaimRepository.save(claim);
    return maybeAutoApprove(user, claim, place, "PHONE_OTP", "CONTACT",
        "Business phone verified. Contact control confirmed.");
  }

  @Transactional
  public ClaimDtos.ClaimResponse startBusinessEmail(User user, Long claimId, String email) {
    PlaceClaim claim = requireClaimant(user, claimId);
    Place place = placeService.requirePlace(claim.getPlaceId());
    if (email == null || email.isBlank() || !email.contains("@")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid business email required");
    }
    String normalized = email.trim().toLowerCase(Locale.ROOT);
    if (place.getWebsite() != null && !place.getWebsite().isBlank()
        && !domainVerificationService.emailMatchesWebsite(normalized, place.getWebsite())) {
      // Still allow, but raise risk — prefer matching domain
      claim.setRiskScore((claim.getRiskScore() == null ? 0 : claim.getRiskScore()) + 15);
      claim.setRiskReasons((claim.getRiskReasons() == null ? "" : claim.getRiskReasons() + ",") + "email_domain_mismatch");
      placeClaimRepository.save(claim);
    }
    String token = UUID.randomUUID().toString().replace("-", "");
    ClaimEvidence ev = ClaimEvidence.builder()
        .claimId(claim.getId())
        .placeId(place.getId())
        .userId(user.getId())
        .method(ClaimEvidenceMethod.BUSINESS_EMAIL)
        .status(ClaimEvidenceStatus.SENT)
        .targetValue(normalized)
        .challengeToken(token)
        .secretHash(hash(token))
        .metadata("{\"attempts\":0}")
        .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
        .build();
    claimEvidenceRepository.save(ev);
    String html = """
        <p>Confirm this business email for Wandr claim verification.</p>
        <p>Your code: <strong>%s</strong></p>
        <p>Web: %s/claim-verify?token=%s&amp;claimId=%d</p>
        <p>App: wandr://claim-verify?token=%s&amp;claimId=%d</p>
        """.formatted(token, emailServiceWebBaseFallback(), token, claimId, token, claimId);
    emailService.sendSimple(normalized, "Verify business email for Wandr", html);
    place.setBusinessEmail(normalized);
    placeService.save(place);
    return toResponse(claim, "Verification email sent to " + normalized);
  }

  @Transactional
  public ClaimDtos.ClaimResponse verifyBusinessEmail(User user, Long claimId, String token) {
    PlaceClaim claim = requireClaimant(user, claimId);
    ClaimEvidence ev = claimEvidenceRepository
        .findFirstByClaimIdAndMethodOrderByCreatedAtDesc(claimId, ClaimEvidenceMethod.BUSINESS_EMAIL)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start business email first"));
    if (ev.getStatus() == ClaimEvidenceStatus.EXPIRED || ev.getStatus() == ClaimEvidenceStatus.FAILED) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email code expired or locked. Request a new email.");
    }
    assertNotExpired(ev);
    int attempts = readAttempts(ev);
    if (attempts >= 5) {
      ev.setStatus(ClaimEvidenceStatus.FAILED);
      claimEvidenceRepository.save(ev);
      throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many invalid attempts. Request a new email.");
    }
    if (token == null || !token.trim().equals(ev.getChallengeToken())) {
      writeAttempts(ev, attempts + 1);
      if (attempts + 1 >= 5) {
        ev.setStatus(ClaimEvidenceStatus.FAILED);
      }
      claimEvidenceRepository.save(ev);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email verification token");
    }
    markEvidenceVerified(ev);
    claim.setVerificationScore(scoreFor(claim) + 40);
    claim.setVerificationMethod("BUSINESS_EMAIL");
    claim.setVerificationLevel("CONTACT");
    placeClaimRepository.save(claim);
    Place place = placeService.requirePlace(claim.getPlaceId());
    return maybeAutoApprove(user, claim, place, "BUSINESS_EMAIL", "CONTACT",
        "Business email verified.");
  }

  @Transactional
  public ClaimDtos.ClaimResponse startDomain(User user, Long claimId) {
    PlaceClaim claim = requireClaimant(user, claimId);
    Place place = placeService.requirePlace(claim.getPlaceId());
    String host = domainVerificationService.extractHost(place.getWebsite());
    if (host == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing needs a valid website for domain verification");
    }
    String token = "wandr-verification=" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
    ClaimEvidence ev = ClaimEvidence.builder()
        .claimId(claim.getId())
        .placeId(place.getId())
        .userId(user.getId())
        .method(ClaimEvidenceMethod.DOMAIN_TXT)
        .status(ClaimEvidenceStatus.PENDING)
        .targetValue(host)
        .challengeToken(token)
        .expiresAt(Instant.now().plus(14, ChronoUnit.DAYS))
        .build();
    claimEvidenceRepository.save(ev);
    return ClaimDtos.ClaimResponse.from(claim, place.getName(), evidenceList(claim.getId()),
        "Add this TXT record to " + host + ", then verify.", token, host, false);
  }

  @Transactional
  public ClaimDtos.ClaimResponse checkDomain(User user, Long claimId) {
    PlaceClaim claim = requireClaimant(user, claimId);
    ClaimEvidence ev = claimEvidenceRepository
        .findFirstByClaimIdAndMethodOrderByCreatedAtDesc(claimId, ClaimEvidenceMethod.DOMAIN_TXT)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start domain verification first"));
    assertNotExpired(ev);
    boolean ok = domainVerificationService.hasTxtRecord(ev.getTargetValue(), ev.getChallengeToken());
    if (!ok) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TXT record not found yet. DNS can take time to propagate.");
    }
    markEvidenceVerified(ev);
    claim.setVerificationScore(scoreFor(claim) + 60);
    claim.setVerificationMethod("DOMAIN_TXT");
    claim.setVerificationLevel("DOMAIN");
    placeClaimRepository.save(claim);
    Place place = placeService.requirePlace(claim.getPlaceId());
    return maybeAutoApprove(user, claim, place, "DOMAIN_TXT", "DOMAIN",
        "Website ownership verified via DNS.");
  }

  @Transactional
  public ClaimDtos.ClaimResponse submitVideo(User user, Long claimId, String url, String note) {
    return submitManualMedia(user, claimId, url, note, ClaimEvidenceMethod.VIDEO);
  }

  @Transactional
  public ClaimDtos.ClaimResponse submitDocument(User user, Long claimId, String url, String note) {
    return submitManualMedia(user, claimId, url, note, ClaimEvidenceMethod.DOCUMENT);
  }

  private ClaimDtos.ClaimResponse submitManualMedia(
      User user, Long claimId, String url, String note, ClaimEvidenceMethod method
  ) {
    PlaceClaim claim = requireClaimant(user, claimId);
    if (url == null || url.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload URL required");
    }
    ClaimEvidence ev = ClaimEvidence.builder()
        .claimId(claim.getId())
        .placeId(claim.getPlaceId())
        .userId(user.getId())
        .method(method)
        .status(ClaimEvidenceStatus.SUBMITTED)
        .mediaUrl(url.trim())
        .metadata(note)
        .build();
    claimEvidenceRepository.save(ev);
    claim.setStatus(ClaimStatus.PENDING);
    claim.setDecision("QUEUED_ADMIN");
    claim.setVerificationMethod(method.name());
    claim.setVerificationLevel("MANUAL");
    claim.setEvidence((claim.getEvidence() == null ? "" : claim.getEvidence() + "\n") + method + ": " + url);
    placeClaimRepository.save(claim);
    return toResponse(claim, method == ClaimEvidenceMethod.VIDEO
        ? "Verification video submitted for admin review."
        : "Documents submitted for admin review. They stay private.");
  }

  @Transactional
  public ClaimDtos.ClaimResponse approve(User admin, Long claimId, ModerationDtos.DecisionRequest req) {
    PlaceClaim claim = placeClaimRepository.findById(claimId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    if (claim.getStatus() == ClaimStatus.APPROVED || claim.getStatus() == ClaimStatus.REJECTED) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Claim already resolved");
    }
    Place place = placeService.requirePlace(claim.getPlaceId());
    User claimant = userRepository.findById(claim.getUserId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (claim.getClaimKind() == ClaimKind.CLAIM
        && place.getOwner() != null
        && !place.getOwner().getId().equals(claimant.getId())
        && (place.getOwnershipStatus() == OwnershipStatus.OWNER_CLAIMED
            || place.getOwnershipStatus() == OwnershipStatus.OWNER_VERIFIED)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "Place already has a different owner. Use DISPUTE flow or reject this claim.");
    }

    grantAccess(claim, place, claimant, claim.getVerificationMethod(),
        claim.getVerificationLevel() != null ? claim.getVerificationLevel() : "MANUAL", false);
    claim.setDecision("MANUAL_APPROVED");
    claim.setAdminNote(req != null ? req.note() : claim.getAdminNote());
    placeClaimRepository.save(claim);

    // Close other open claims on this place when transferring/approving ownership
    if (claim.getClaimKind() == ClaimKind.CLAIM || claim.getClaimKind() == ClaimKind.DISPUTE) {
      placeClaimRepository.findByPlaceIdOrderByCreatedAtDesc(place.getId()).stream()
          .filter(c -> !c.getId().equals(claimId))
          .filter(c -> c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.NEED_INFO)
          .forEach(c -> {
            c.setStatus(ClaimStatus.REJECTED);
            c.setResolvedAt(Instant.now());
            c.setAdminNote("Closed — another claim was approved");
            c.setDecision("REJECTED");
            placeClaimRepository.save(c);
          });
    }

    moderationService.log(admin, place.getId(), claimId, null,
        Boolean.TRUE.equals(claim.getVerificationRequest())
            ? ModerationActionType.APPROVE_VERIFICATION
            : ModerationActionType.APPROVE_CLAIM,
        req);
    return toResponse(claim, "Approved");
  }

  @Transactional
  public ClaimDtos.ClaimResponse reject(User admin, Long claimId, ModerationDtos.DecisionRequest req) {
    PlaceClaim claim = placeClaimRepository.findById(claimId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    Place place = placeService.requirePlace(claim.getPlaceId());
    claim.setStatus(ClaimStatus.REJECTED);
    claim.setResolvedAt(Instant.now());
    claim.setDecision("REJECTED");
    if (req != null && req.note() != null) claim.setAdminNote(req.note());
    placeClaimRepository.save(claim);

    if (claim.getClaimKind() == ClaimKind.CLAIM
        && place.getOwnershipStatus() == OwnershipStatus.CLAIM_PENDING
        && !hasActiveManager(place)) {
      place.setOwnershipStatus(OwnershipStatus.UNCLAIMED);
      placeService.save(place);
    }
    moderationService.log(admin, place.getId(), claimId, null,
        Boolean.TRUE.equals(claim.getVerificationRequest())
            ? ModerationActionType.REJECT_VERIFICATION
            : ModerationActionType.REJECT_CLAIM,
        req);
    notificationService.create(
        claim.getUserId(),
        "CLAIM_REJECTED",
        "Claim not approved",
        "Your claim for " + place.getName() + " was rejected.",
        "PLACE",
        place.getId(),
        "{\"claimId\":" + claimId + "}",
        "claim-rejected:" + claimId
    );
    return toResponse(claim);
  }

  @Transactional
  public ClaimDtos.ClaimResponse requestInfo(User admin, Long claimId, ModerationDtos.DecisionRequest req) {
    PlaceClaim claim = placeClaimRepository.findById(claimId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    claim.setStatus(ClaimStatus.NEED_INFO);
    claim.setDecision("QUEUED_ADMIN");
    if (req != null) {
      if (req.reasons() != null) {
        claim.setNeedsInfoReasons(String.join(",", req.reasons()));
      }
      if (req.note() != null) claim.setAdminNote(req.note());
    }
    placeClaimRepository.save(claim);
    moderationService.log(admin, claim.getPlaceId(), claimId, null, ModerationActionType.REQUEST_CLAIM_INFO, req);
    notificationService.create(
        claim.getUserId(),
        "CLAIM_NEED_INFO",
        "More info needed",
        "Admins need more information for your claim.",
        "PLACE",
        claim.getPlaceId(),
        "{\"claimId\":" + claimId + "}",
        "claim-need-info:" + claimId
    );
    return toResponse(claim);
  }

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

  @Transactional
  public void ensureOwnerMember(Place place, User owner) {
    if (place == null || owner == null) return;
    businessMemberRepository.findByPlaceIdAndUserId(place.getId(), owner.getId())
        .orElseGet(() -> businessMemberRepository.save(BusinessMember.builder()
            .placeId(place.getId())
            .userId(owner.getId())
            .role(BusinessMemberRole.OWNER)
            .status(BusinessMemberStatus.ACTIVE)
            .build()));
  }

  private ClaimDtos.ClaimResponse maybeAutoApprove(
      User user, PlaceClaim claim, Place place, String method, String level, String message
  ) {
    ClaimRiskService.RiskResult risk = claimRiskService.assess(user, place, claim.getClaimKind(), claim.getId());
    claim.setRiskScore(risk.score());
    claim.setRiskReasons(String.join(",", risk.reasons()));

    boolean manualOnly = claim.getClaimKind() == ClaimKind.DISPUTE
        || claim.getClaimKind() == ClaimKind.ACCESS_REQUEST
        || "VIDEO".equals(method)
        || "DOCUMENT".equals(method);

    boolean canAuto = !manualOnly && risk.isLow() && !hasCompetingOtherPending(place.getId(), claim.getId());
    if (claim.getClaimKind() == ClaimKind.CLAIM && hasActiveManager(place)
        && (place.getOwner() == null || !place.getOwner().getId().equals(user.getId()))) {
      canAuto = false;
    }

    if (!canAuto) {
      claim.setDecision("QUEUED_ADMIN");
      placeClaimRepository.save(claim);
      return toResponse(claim, message + " Pending admin review due to risk or conflicts.");
    }

    grantAccess(claim, place, user, method, level, true);
    claim.setDecision("AUTO_APPROVED");
    placeClaimRepository.save(claim);
    return toResponse(claim, message + " Verified business — claim auto-approved.", true);
  }

  private void grantAccess(
      PlaceClaim claim, Place place, User claimant, String method, String level, boolean auto
  ) {
    claim.setStatus(ClaimStatus.APPROVED);
    claim.setResolvedAt(Instant.now());
    claim.setVerificationMethod(method);
    claim.setVerificationLevel(level);

    BusinessMemberRole role = claim.getRequestedRole() != null
        ? claim.getRequestedRole()
        : BusinessMemberRole.OWNER;

    if (claim.getClaimKind() == ClaimKind.ACCESS_REQUEST && role == BusinessMemberRole.OWNER) {
      role = BusinessMemberRole.MANAGER;
    }

    BusinessMember member = businessMemberRepository.findByPlaceIdAndUserId(place.getId(), claimant.getId())
        .orElse(BusinessMember.builder()
            .placeId(place.getId())
            .userId(claimant.getId())
            .build());
    member.setRole(role);
    member.setStatus(BusinessMemberStatus.ACTIVE);
    businessMemberRepository.save(member);

    if (role == BusinessMemberRole.OWNER || place.getOwner() == null) {
      place.setOwner(claimant);
      place.setClaimedAt(Instant.now());
    }

    if (claimant.getRole() == Role.USER) {
      claimant.setRole(Role.OWNER);
      userRepository.save(claimant);
    }

    boolean strong = "DOMAIN".equals(level) || "MANUAL".equals(level)
        || Boolean.TRUE.equals(claim.getVerificationRequest())
        || scoreFor(claim) >= 40;
    if (strong || auto) {
      place.setOwnershipStatus(OwnershipStatus.OWNER_VERIFIED);
      place.setVerifiedAt(Instant.now());
      place.setLastVerifiedAt(Instant.now());
      place.setNeedsReverification(false);
      if ("PHONE_OTP".equals(method)) place.setPhoneVerified(true);
      if ("DOMAIN_TXT".equals(method)) place.setLocationVerified(false);
      if ("DOCUMENT".equals(method)) place.setBusinessDocVerified(true);
      if ("VIDEO".equals(method)) place.setLocationVerified(true);
    } else {
      place.setOwnershipStatus(OwnershipStatus.OWNER_CLAIMED);
    }
    place.setVerificationMethod(method);
    place.setVerificationLevel(level);
    placeService.save(place);

    notificationService.create(
        claimant.getId(),
        "CLAIM_APPROVED",
        auto ? "Business contact verified" : "Claim approved",
        "Your claim for " + place.getName() + " was approved. You are verified as an authorized "
            + role.name().toLowerCase(Locale.ROOT).replace('_', ' ') + ".",
        "PLACE",
        place.getId(),
        "{\"claimId\":" + claim.getId() + ",\"auto\":" + auto + "}",
        "claim-approved:" + claim.getId()
    );
  }

  private boolean hasCompetingOtherPending(Long placeId, Long claimId) {
    return placeClaimRepository.findByPlaceIdOrderByCreatedAtDesc(placeId).stream()
        .anyMatch(c -> !c.getId().equals(claimId)
            && (c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.NEED_INFO));
  }

  private int readAttempts(ClaimEvidence ev) {
    try {
      String m = ev.getMetadata();
      if (m == null || !m.contains("attempts")) return 0;
      int i = m.indexOf("attempts");
      int colon = m.indexOf(':', i);
      if (colon < 0) return 0;
      StringBuilder num = new StringBuilder();
      for (int p = colon + 1; p < m.length(); p++) {
        char ch = m.charAt(p);
        if (Character.isDigit(ch)) num.append(ch);
        else if (num.length() > 0) break;
      }
      return num.length() == 0 ? 0 : Integer.parseInt(num.toString());
    } catch (Exception e) {
      return 0;
    }
  }

  private void writeAttempts(ClaimEvidence ev, int attempts) {
    ev.setMetadata("{\"attempts\":" + attempts + "}");
  }

  private boolean hasActiveManager(Place place) {
    return businessMemberRepository.existsByPlaceIdAndStatus(place.getId(), BusinessMemberStatus.ACTIVE)
        || (place.getOwner() != null && (place.getOwnershipStatus() == OwnershipStatus.OWNER_CLAIMED
        || place.getOwnershipStatus() == OwnershipStatus.OWNER_VERIFIED));
  }

  private void requireMemberOrOwner(User user, Place place) {
    boolean ok = place.getOwner() != null && place.getOwner().getId().equals(user.getId());
    if (!ok) {
      ok = businessMemberRepository.findByPlaceIdAndUserId(place.getId(), user.getId())
          .filter(m -> m.getStatus() == BusinessMemberStatus.ACTIVE)
          .isPresent();
    }
    if (!ok) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only managers can request verification upgrade");
    }
  }

  private void notifyManagers(Place place, ClaimKind kind, User requester) {
    java.util.HashSet<Long> notified = new java.util.HashSet<>();
    if (place.getOwner() != null) {
      notified.add(place.getOwner().getId());
      notificationService.create(
          place.getOwner().getId(),
          kind == ClaimKind.DISPUTE ? "OWNERSHIP_DISPUTE" : "ACCESS_REQUEST",
          kind == ClaimKind.DISPUTE ? "Ownership dispute" : "Access request",
          requester.getDisplayName() + " requested " + kind.name().toLowerCase(Locale.ROOT)
              + " for " + place.getName(),
          "PLACE",
          place.getId(),
          null,
          kind.name().toLowerCase(Locale.ROOT) + ":" + place.getId() + ":" + requester.getId()
      );
    }
    businessMemberRepository.findByPlaceIdAndStatus(place.getId(), BusinessMemberStatus.ACTIVE).forEach(m -> {
      if (!notified.add(m.getUserId())) return;
      notificationService.create(
          m.getUserId(),
          kind == ClaimKind.DISPUTE ? "OWNERSHIP_DISPUTE" : "ACCESS_REQUEST",
          kind == ClaimKind.DISPUTE ? "Ownership dispute" : "Access request",
          requester.getDisplayName() + " requested " + kind.name().toLowerCase(Locale.ROOT)
              + " for " + place.getName(),
          "PLACE",
          place.getId(),
          null,
          kind.name().toLowerCase(Locale.ROOT) + ":" + place.getId() + ":" + requester.getId() + ":" + m.getUserId()
      );
    });
  }

  private PlaceClaim requireClaimant(User user, Long claimId) {
    PlaceClaim claim = placeClaimRepository.findById(claimId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    if (!claim.getUserId().equals(user.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your claim");
    }
    if (claim.getStatus() == ClaimStatus.APPROVED || claim.getStatus() == ClaimStatus.REJECTED) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Claim already resolved");
    }
    return claim;
  }

  private void markEvidenceVerified(ClaimEvidence ev) {
    ev.setStatus(ClaimEvidenceStatus.VERIFIED);
    ev.setVerifiedAt(Instant.now());
    claimEvidenceRepository.save(ev);
  }

  private void assertNotExpired(ClaimEvidence ev) {
    if (ev.getExpiresAt() != null && ev.getExpiresAt().isBefore(Instant.now())) {
      ev.setStatus(ClaimEvidenceStatus.EXPIRED);
      claimEvidenceRepository.save(ev);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification challenge expired");
    }
  }

  private int scoreFor(PlaceClaim claim) {
    return claim.getVerificationScore() == null ? 0 : claim.getVerificationScore();
  }

  private ClaimKind parseKind(ClaimDtos.CreateClaimRequest req) {
    if (req != null && Boolean.TRUE.equals(req.verificationRequest())) {
      return ClaimKind.VERIFICATION_UPGRADE;
    }
    if (req != null && req.claimKind() != null && !req.claimKind().isBlank()) {
      try {
        return ClaimKind.valueOf(req.claimKind().trim().toUpperCase(Locale.ROOT));
      } catch (Exception ignored) { /* fallthrough */ }
    }
    return ClaimKind.CLAIM;
  }

  private BusinessMemberRole parseRole(String raw) {
    if (raw == null || raw.isBlank()) return BusinessMemberRole.OWNER;
    try {
      return BusinessMemberRole.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    } catch (Exception e) {
      return BusinessMemberRole.OWNER;
    }
  }

  private String maskPhone(String phone) {
    if (phone == null || phone.length() < 4) return null;
    return "•••" + phone.substring(phone.length() - 4);
  }

  private String hash(String value) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] dig = md.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(dig);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private String emailServiceWebBaseFallback() {
    if (webBaseUrl == null || webBaseUrl.isBlank()) return "https://www.wandrhere.com";
    return webBaseUrl.endsWith("/") ? webBaseUrl.substring(0, webBaseUrl.length() - 1) : webBaseUrl;
  }

  private List<ClaimDtos.EvidenceResponse> evidenceList(Long claimId) {
    return claimEvidenceRepository.findByClaimIdOrderByCreatedAtDesc(claimId).stream()
        .map(e -> new ClaimDtos.EvidenceResponse(
            e.getId(),
            e.getMethod().name(),
            e.getStatus().name(),
            e.getTargetValue(),
            // Never expose document/video URLs publicly in list for non-admin — still OK for claimant
            e.getMediaUrl(),
            e.getVerifiedAt(),
            e.getExpiresAt()
        ))
        .collect(Collectors.toList());
  }

  private ClaimDtos.ClaimResponse toResponse(PlaceClaim claim) {
    return toResponse(claim, null, null);
  }

  private ClaimDtos.ClaimResponse toResponse(PlaceClaim claim, String message) {
    return toResponse(claim, message, null);
  }

  private ClaimDtos.ClaimResponse toResponse(PlaceClaim claim, String message, Boolean auto) {
    return ClaimDtos.ClaimResponse.from(
        claim,
        placeName(claim.getPlaceId()),
        evidenceList(claim.getId()),
        message,
        null,
        null,
        auto
    );
  }

  private String placeName(Long id) {
    try {
      return placeService.requirePlace(id).getName();
    } catch (Exception e) {
      return "Place";
    }
  }
}
