package com.wandr.repo;

import com.wandr.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
  List<Review> findByPlaceIdOrderByCreatedAtDesc(Long placeId);

  @Query("SELECT AVG(r.rating) FROM Review r WHERE r.placeId = :placeId")
  Double averageRating(@Param("placeId") Long placeId);

  long countByPlaceId(Long placeId);
}
