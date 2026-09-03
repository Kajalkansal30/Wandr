package com.wandr.domain;

public enum PlaceStatus {
  DRAFT,
  /** @deprecated use PENDING_REVIEW — kept for existing DB rows */
  PENDING,
  PENDING_REVIEW,
  APPROVED,
  REJECTED,
  SUSPENDED,
  CLOSED;

  public boolean isPendingReview() {
    return this == PENDING || this == PENDING_REVIEW;
  }

  public boolean isPubliclyVisible() {
    return this == APPROVED;
  }
}
