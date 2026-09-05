package com.wandr.service;

import com.wandr.domain.*;
import com.wandr.dto.MediaDtos;
import com.wandr.dto.ModerationDtos;
import com.wandr.repo.PlaceMediaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MediaService {

  private final PlaceMediaRepository placeMediaRepository;
  private final PlaceService placeService;
  private final ModerationService moderationService;

  public List<MediaDtos.MediaResponse> listApproved(Long placeId) {
    return placeMediaRepository.findByPlaceIdAndStatusOrderByCreatedAtDesc(placeId, MediaStatus.APPROVED)
        .stream().map(MediaDtos.MediaResponse::from).toList();
  }

  public List<MediaDtos.MediaResponse> listPending() {
    return placeMediaRepository.findByStatusOrderByCreatedAtDesc(MediaStatus.PENDING)
        .stream().map(MediaDtos.MediaResponse::from).toList();
  }

  @Transactional
  public MediaDtos.MediaResponse submit(User user, Long placeId, MediaDtos.CreateRequest req, boolean ownerUpload) {
    if (req == null || req.url() == null || req.url().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "url is required");
    }
    placeService.requirePlace(placeId);
    PlaceMedia media = placeMediaRepository.save(PlaceMedia.builder()
        .placeId(placeId)
        .userId(user != null ? user.getId() : null)
        .url(req.url().trim())
        .mediaType(MediaType.PHOTO)
        .likeCount(0)
        .source(ownerUpload ? MediaSource.OWNER : MediaSource.COMMUNITY)
        .status(ownerUpload ? MediaStatus.APPROVED : MediaStatus.PENDING)
        .build());
    return MediaDtos.MediaResponse.from(media);
  }

  @Transactional
  public MediaDtos.MediaResponse approve(User admin, Long mediaId, ModerationDtos.DecisionRequest req) {
    PlaceMedia media = placeMediaRepository.findById(mediaId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Media not found"));
    media.setStatus(MediaStatus.APPROVED);
    placeMediaRepository.save(media);
    moderationService.log(admin, media.getPlaceId(), null, mediaId, ModerationActionType.APPROVE_MEDIA, req);
    return MediaDtos.MediaResponse.from(media);
  }

  @Transactional
  public MediaDtos.MediaResponse reject(User admin, Long mediaId, ModerationDtos.DecisionRequest req) {
    PlaceMedia media = placeMediaRepository.findById(mediaId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Media not found"));
    media.setStatus(MediaStatus.REJECTED);
    if (req != null && req.note() != null) media.setRejectReason(req.note());
    placeMediaRepository.save(media);
    moderationService.log(admin, media.getPlaceId(), null, mediaId, ModerationActionType.REJECT_MEDIA, req);
    return MediaDtos.MediaResponse.from(media);
  }
}
