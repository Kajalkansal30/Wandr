import { api } from "../api/client";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function isCloudinaryUploadAvailable() {
  return Boolean(
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME &&
      String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME).trim()
  );
}

/** @deprecated use isCloudinaryUploadAvailable */
export function isSpotUploadAvailable() {
  return isCloudinaryUploadAvailable();
}

/**
 * Build a Cloudinary video thumbnail (frame) URL from a secure delivery URL.
 * @param {string} secureUrl
 * @returns {string|null}
 */
export function cloudinaryVideoThumbnail(secureUrl) {
  if (!secureUrl || !secureUrl.includes("/upload/")) return null;
  return secureUrl
    .replace("/upload/", "/upload/so_0,w_720,c_fill,q_auto,f_jpg/")
    .replace(/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i, ".jpg$2");
}

async function signedCloudinaryUpload(file, purpose, { onProgress } = {}) {
  if (!isCloudinaryUploadAvailable()) {
    throw new Error("File upload needs Cloudinary — paste a URL for now.");
  }
  if (!file) throw new Error("No file selected");

  const sign = await api(`/api/media/cloudinary-sign?purpose=${encodeURIComponent(purpose)}`, {
    method: "POST",
    auth: true,
  });
  const cloudName = sign.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const resourceType = sign.resourceType || (purpose === "place-cover" ? "image" : "video");
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);
  form.append("public_id", sign.publicId);

  onProgress?.(5);

  const url = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (!onProgress || !e.lengthComputable) return;
      const pct = Math.min(99, Math.round(5 + (e.loaded / e.total) * 94));
      onProgress(pct);
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let msg = "Upload failed";
        try {
          const data = JSON.parse(xhr.responseText);
          msg = data.error?.message || msg;
        } catch {
          /* ignore */
        }
        reject(new Error(msg));
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        if (!data.secure_url) {
          reject(new Error("Cloudinary did not return a URL"));
          return;
        }
        onProgress?.(100);
        resolve(data.secure_url);
      } catch {
        reject(new Error("Could not parse Cloudinary response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });

  return url;
}

/**
 * Spotted video → folder spotted/{userId}
 * @returns {Promise<{ url: string, thumbnailUrl: string|null }>}
 */
export async function uploadSpotFile(file, _userId, options = {}) {
  if (file.size > MAX_VIDEO_BYTES) throw new Error("Video must be under 50MB");
  const type = file.type || "";
  if (type && !type.startsWith("video/")) {
    throw new Error("Please choose a video file");
  }
  const url = await signedCloudinaryUpload(file, "spotted", options);
  return { url, thumbnailUrl: cloudinaryVideoThumbnail(url) };
}

/**
 * Café cover image → folder places/{userId}
 * @returns {Promise<string>} secure URL
 */
export async function uploadPlaceCover(file, options = {}) {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be under 10MB");
  const type = file.type || "";
  if (type && !type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  return signedCloudinaryUpload(file, "place-cover", options);
}
