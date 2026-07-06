export const getImageAlt = (url, fallback = "Maaz Oud Fragrance") => {
  if (!url) return fallback;
  try {
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1];
    
    // Handle query params if any (e.g. ?width=300)
    const cleanLastPart = lastPart.split("?")[0];
    
    const dotIndex = cleanLastPart.lastIndexOf(".");
    const filename = dotIndex !== -1 ? cleanLastPart.substring(0, dotIndex) : cleanLastPart;
    
    // Decode percent encoded characters and replace hyphens/underscores with spaces
    const cleanName = decodeURIComponent(filename)
      .replace(/[-_]+/g, " ")
      .trim();

    return cleanName || fallback;
  } catch (e) {
    return fallback;
  }
};

export const getOptimizedImageUrl = (url, width) => {
  if (!url || typeof url !== 'string') return url;
  
  // If it's a Supabase storage URL, dynamically resize it to target width and transform to webp with quality 60
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const renderUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${renderUrl}?width=${width}&format=webp&quality=60`;
  }
  
  // For local images, if width is 200 or less, we can return the mobile version
  if (url.startsWith("/images/") && (url.endsWith(".webp") || url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".jpeg"))) {
    if (width && width <= 200 && !url.includes("_mobile")) {
      const dotIndex = url.lastIndexOf(".");
      const base = url.substring(0, dotIndex);
      const ext = url.substring(dotIndex);
      return `${base}_mobile${ext}`;
    }
  }
  
  return url;
};

export const getImageSrcSet = (url) => {
  if (!url || typeof url !== 'string') return undefined;
  
  // For Supabase storage URL (Generate 200w and 400w sizes in WebP format with quality 60)
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const renderUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${renderUrl}?width=200&format=webp&quality=60 200w, ${renderUrl}?width=400&format=webp&quality=60 400w`;
  }
  
  // Local images under /images/ (Map to 200w for mobile-version and 400w for standard version)
  if (url.startsWith("/images/") && (url.endsWith(".webp") || url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".jpeg"))) {
    if (url.includes("_mobile")) {
      return undefined;
    }
    const dotIndex = url.lastIndexOf(".");
    const base = url.substring(0, dotIndex);
    const ext = url.substring(dotIndex);
    return `${base}_mobile${ext} 200w, ${url} 400w`;
  }
  
  return undefined;
};

export const getBannerSrcSet = (url) => {
  if (!url || typeof url !== 'string') return undefined;
  
  // For Supabase storage URL (Generate 600w and 1200w sizes in WebP format with quality 60)
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const renderUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${renderUrl}?width=600&format=webp&quality=60 600w, ${renderUrl}?width=1200&format=webp&quality=60 1200w`;
  }

  // Local banners under /images/
  if (url.startsWith("/images/") && (url.endsWith(".webp") || url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".jpeg"))) {
    if (url.includes("_mobile")) {
      return undefined;
    }
    const dotIndex = url.lastIndexOf(".");
    const base = url.substring(0, dotIndex);
    const ext = url.substring(dotIndex);
    return `${base}_mobile${ext} 600w, ${url} 1200w`;
  }
  
  return undefined;
};
