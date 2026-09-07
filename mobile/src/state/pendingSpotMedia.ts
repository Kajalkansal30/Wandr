type PendingSpotMedia = {
  uri: string;
  mime: string;
  durationSec?: number;
};

let pending: PendingSpotMedia | null = null;

export function setPendingSpotMedia(media: PendingSpotMedia) {
  pending = media;
}

export function takePendingSpotMedia(): PendingSpotMedia | null {
  const value = pending;
  pending = null;
  return value;
}

export function peekPendingSpotMedia(): PendingSpotMedia | null {
  return pending;
}
