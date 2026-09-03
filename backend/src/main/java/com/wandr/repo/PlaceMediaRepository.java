package com.wandr.repo;

import com.wandr.domain.MediaStatus;
import com.wandr.domain.PlaceMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaceMediaRepository extends JpaRepository<PlaceMedia, Long> {
  List<PlaceMedia> findByPlaceIdAndStatusOrderByCreatedAtDesc(Long placeId, MediaStatus status);
  List<PlaceMedia> findByStatusOrderByCreatedAtDesc(MediaStatus status);
  long countByStatus(MediaStatus status);
}
