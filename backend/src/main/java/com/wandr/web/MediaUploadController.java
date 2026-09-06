package com.wandr.web;

import com.wandr.domain.User;
import com.wandr.dto.CloudinaryDtos;
import com.wandr.service.CloudinarySignService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MediaUploadController {

  private final CloudinarySignService cloudinarySignService;

  /**
   * @param purpose {@code spotted} (video) or {@code place-cover} (image)
   */
  @PostMapping("/api/media/cloudinary-sign")
  public CloudinaryDtos.SignResponse sign(
      @AuthenticationPrincipal User user,
      @RequestParam(defaultValue = "spotted") String purpose
  ) {
    return cloudinarySignService.signUpload(user, purpose);
  }
}
