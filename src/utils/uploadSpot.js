import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

const MAX_BYTES = 50 * 1024 * 1024;

export function isSpotUploadAvailable() {
  return Boolean(storage);
}

/**
 * Upload a video file to Firebase Storage when configured.
 * @returns {Promise<string>} download URL
 */
export async function uploadSpotFile(file, userId) {
  if (!storage) {
    throw new Error("File upload needs Firebase Storage — paste a video URL for now.");
  }
  if (!file) throw new Error("No file selected");
  if (file.size > MAX_BYTES) throw new Error("Video must be under 50MB");
  const type = file.type || "";
  if (type && !type.startsWith("video/")) {
    throw new Error("Please choose a video file");
  }

  const ext = (file.name?.split(".").pop() || "mp4").toLowerCase();
  const path = `spotted/${userId || "anon"}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: type || "video/mp4" });
  return getDownloadURL(storageRef);
}
