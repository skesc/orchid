import {API_URL} from "./fetchConfig";

const THUMBNAIL_SIZE = 200;
const PREVIEW_SIZE = 800;

// match server-side quality settings
const THUMBNAIL_QUALITY = 30; // small size, lower quality is fine
const PREVIEW_QUALITY = 50; // medium size, balanced quality
const FULL_QUALITY = 75; // full size, good quality but still optimized

export function getOptimizedImageUrl(path, options = {}) {
  if (!path) return "";

  const {width, height, quality = PREVIEW_QUALITY} = options;

  const baseUrl = `${API_URL}${path}`;
  const params = new URLSearchParams();

  if (width) params.set("w", width);
  if (height) params.set("h", height);
  if (quality !== PREVIEW_QUALITY) params.set("q", quality);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function getThumbnailUrl(path) {
  return getOptimizedImageUrl(path, {
    width: THUMBNAIL_SIZE,
    quality: THUMBNAIL_QUALITY,
  });
}

export function getPreviewUrl(path) {
  return getOptimizedImageUrl(path, {
    width: PREVIEW_SIZE,
    quality: PREVIEW_QUALITY,
  });
}

export function getFullQualityUrl(path) {
  return getOptimizedImageUrl(path, {
    quality: FULL_QUALITY,
  });
}

// react component for optimized images
export function OptimizedImage({src, alt, className, size = "preview", ...props}) {
  const imageSrc = size === "thumbnail" ? getThumbnailUrl(src) : size === "preview" ? getPreviewUrl(src) : getFullQualityUrl(src);

  return <img src={imageSrc} alt={alt} className={className} loading="lazy" {...props} />;
}
