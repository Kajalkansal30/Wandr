import { api } from "./client";

export async function cloudinarySign(purpose = "spotted") {
  return api(`/api/media/cloudinary-sign?purpose=${encodeURIComponent(purpose)}`, {
    method: "POST",
    auth: true,
    timeoutMs: 20000,
  });
}

/**
 * Upload a local file URI to Cloudinary using a signed request from the API.
 * Does not require Cloudinary secrets in the app — only the signed payload.
 */
export async function uploadLocalUri(
  uri: string,
  purpose: "spotted" | "place-cover" = "spotted",
  mimeType = "image/jpeg"
): Promise<{ url: string; thumbnailUrl: string | null }> {
  const sign = await cloudinarySign(purpose);
  const cloudName = sign.cloudName;
  if (!cloudName) throw new Error("Cloudinary is not configured on the API");

  const resourceType = sign.resourceType || (purpose === "place-cover" ? "image" : "video");
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const form = new FormData();
  form.append("file", {
    uri,
    type: mimeType,
    name:
      purpose === "place-cover"
        ? "cover.jpg"
        : mimeType.startsWith("image/")
          ? "spot.jpg"
          : "spot.mp4",
  } as any);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);
  form.append("public_id", sign.publicId);

  const res = await fetch(uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    let msg = "Upload failed";
    try {
      const data = await res.json();
      msg = data.error?.message || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = await res.json();
  if (!data.secure_url) throw new Error("Cloudinary did not return a URL");

  let thumbnailUrl: string | null = null;
  if (typeof data.secure_url === "string" && data.secure_url.includes("/upload/")) {
    thumbnailUrl = data.secure_url
      .replace("/upload/", "/upload/so_0,w_720,c_fill,q_auto,f_jpg/")
      .replace(/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i, ".jpg$2");
  }

  return { url: data.secure_url, thumbnailUrl };
}
