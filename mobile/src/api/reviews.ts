import { api } from "./client";

export async function fetchReviews(placeId: string | number, page = 0, size = 50) {
  return api(`/api/places/${placeId}/reviews?page=${page}&size=${size}`);
}

export async function submitReview(
  placeId: string | number,
  body: { rating: number; text?: string | null; experienceTags?: string[] }
) {
  return api(`/api/places/${placeId}/reviews`, {
    method: "POST",
    auth: true,
    body,
  });
}
