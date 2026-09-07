/**
 * Cloudinary delivery helpers — keep uploads browser→Cloudinary (signed).
 * Use f_auto / q_auto and responsive widths for cards vs detail.
 */
export function cloudinaryUrl(url, { width = 600, height, crop = "fill" } = {}) {
  if (!url || typeof url !== "string") return url || "";
  if (!url.includes("res.cloudinary.com") && !url.includes("cloudinary.com")) {
    return url;
  }
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const transforms = [`f_auto`, `q_auto`, `w_${width}`, `c_${crop}`];
  if (height) transforms.push(`h_${height}`);
  const prefix = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);
  // Avoid double-transforming if already transformed
  if (/^(f_|q_|w_|c_|h_)/.test(rest)) {
    return url;
  }
  return `${prefix}${transforms.join(",")}/${rest}`;
}

export const IMAGE_WIDTH = {
  card: 400,
  cardDesktop: 700,
  detail: 1200,
  hero: 1400,
};
