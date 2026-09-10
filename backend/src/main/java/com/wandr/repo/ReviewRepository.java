package com.wandr.repo;

import com.wandr.domain.Review;
import com.wandr.domain.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

  List<Review> findByPlaceIdAndStatusOrderByCreatedAtDesc(Long placeId, ReviewStatus status);

  org.springframework.data.domain.Page<Review> findByPlaceIdAndStatusOrderByCreatedAtDesc(
      Long placeId, ReviewStatus status, org.springframework.data.domain.Pageable pageable);

  Optional<Review> findByUserIdAndPlaceId(Long userId, Long placeId);

  List<Review> findByUserId(Long userId);

  @Query("SELECT AVG(r.rating) FROM Review r WHERE r.placeId = :placeId AND r.status = :status")
  Double averageRating(@Param("placeId") Long placeId, @Param("status") ReviewStatus status);

  long countByPlaceIdAndStatus(Long placeId, ReviewStatus status);

  @Modifying
  @Query("DELETE FROM Review r WHERE r.userId = :userId")
  int deleteByUserId(@Param("userId") Long userId);
}
