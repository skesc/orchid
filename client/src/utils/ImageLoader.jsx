import {API_URL} from "./fetchConfig";

// quality presets
const THUMBNAIL_QUALITY = 30;
const PREVIEW_QUALITY = 50;
const FULL_QUALITY = 90;

// default preview width - won't be used if image is smaller
const DEFAULT_PREVIEW_WIDTH = 800;
const DEFAULT_THUMBNAIL_WIDTH = 200;

export function getOptimizedImageUrl(path, options = {}) {
  if (!path) return "";

  const {width, height, quality = PREVIEW_QUALITY, originalWidth} = options;
  const params = new URLSearchParams();

  if (quality) params.set("q", quality);

  // if we know original width, don't upscale
  if (width && originalWidth) {
    const targetWidth = Math.min(width, originalWidth);
    params.set("w", targetWidth);
  } else if (width) {
    params.set("w", width);
  }

  if (height) params.set("h", height);

  const baseUrl = `${API_URL}${path}`;
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function getThumbnailUrl(path, originalWidth) {
  return getOptimizedImageUrl(path, {
    width: DEFAULT_THUMBNAIL_WIDTH,
    quality: THUMBNAIL_QUALITY,
    originalWidth,
  });
}

export function getPreviewUrl(path, originalWidth) {
  return getOptimizedImageUrl(path, {
    width: DEFAULT_PREVIEW_WIDTH,
    quality: PREVIEW_QUALITY,
    originalWidth,
  });
}

export function getFullQualityUrl(path) {
  return getOptimizedImageUrl(path, {
    quality: FULL_QUALITY,
  });
}

export function OptimizedImage({src, alt, className, size = "preview", width, originalWidth, ...props}) {
  const imageSrc = size === "thumbnail" ? getThumbnailUrl(src, originalWidth) : size === "preview" ? getPreviewUrl(src, originalWidth) : getFullQualityUrl(src);

  return <img src={imageSrc} alt={alt} className={className} loading="lazy" {...props} />;
}
