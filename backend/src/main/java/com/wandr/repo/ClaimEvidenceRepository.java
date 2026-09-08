package com.wandr.repo;

import com.wandr.domain.ClaimEvidence;
import com.wandr.domain.ClaimEvidenceMethod;
import com.wandr.domain.ClaimEvidenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClaimEvidenceRepository extends JpaRepository<ClaimEvidence, Long> {
  List<ClaimEvidence> findByClaimIdOrderByCreatedAtDesc(Long claimId);
  Optional<ClaimEvidence> findFirstByClaimIdAndMethodOrderByCreatedAtDesc(Long claimId, ClaimEvidenceMethod method);
  List<ClaimEvidence> findByClaimIdAndStatus(Long claimId, ClaimEvidenceStatus status);
}
