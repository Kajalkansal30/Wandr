package com.wandr.repo;

import com.wandr.domain.BusinessMember;
import com.wandr.domain.BusinessMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BusinessMemberRepository extends JpaRepository<BusinessMember, Long> {
  List<BusinessMember> findByPlaceIdAndStatus(Long placeId, BusinessMemberStatus status);
  List<BusinessMember> findByUserIdAndStatus(Long userId, BusinessMemberStatus status);
  Optional<BusinessMember> findByPlaceIdAndUserId(Long placeId, Long userId);
  boolean existsByPlaceIdAndStatus(Long placeId, BusinessMemberStatus status);
  long countByPlaceIdAndStatus(Long placeId, BusinessMemberStatus status);
}
