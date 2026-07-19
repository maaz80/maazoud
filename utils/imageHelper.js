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
  
  // If it's a Supabase storage URL, dynamically resize it to target width and transform to webp with quality 50
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const renderUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${renderUrl}?width=${width}&resize=contain&format=webp&quality=50`;
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
  
  // For Supabase storage URL (Generate 160w, 320w and 640w sizes in WebP format with quality 50)
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const renderUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${renderUrl}?width=160&resize=contain&format=webp&quality=50 160w, ${renderUrl}?width=320&resize=contain&format=webp&quality=50 320w, ${renderUrl}?width=640&resize=contain&format=webp&quality=50 640w`;
  }
  
  // Local images under /images/ (Map to 160w and 320w for mobile-version, and 640w for standard version)
  if (url.startsWith("/images/") && (url.endsWith(".webp") || url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".jpeg"))) {
    if (url.includes("_mobile")) {
      return undefined;
    }
    const dotIndex = url.lastIndexOf(".");
    const base = url.substring(0, dotIndex);
    const ext = url.substring(dotIndex);
    return `${base}_mobile${ext} 160w, ${base}_mobile${ext} 320w, ${url} 640w`;
  }
  
  return undefined;
};

export const getBannerSrcSet = (url) => {
  if (!url || typeof url !== 'string') return undefined;
  
  // For Supabase storage URL (Generate 600w, 900w and 1200w sizes in WebP format with quality 50)
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const renderUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${renderUrl}?width=600&resize=contain&format=webp&quality=50 600w, ${renderUrl}?width=900&resize=contain&format=webp&quality=50 900w, ${renderUrl}?width=1200&resize=contain&format=webp&quality=50 1200w`;
  }

  // Local banners under /images/
  if (url.startsWith("/images/") && (url.endsWith(".webp") || url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".jpeg"))) {
    if (url.includes("_mobile")) {
      return undefined;
    }
    const dotIndex = url.lastIndexOf(".");
    const base = url.substring(0, dotIndex);
    const ext = url.substring(dotIndex);
    return `${base}_mobile${ext} 600w, ${url} 900w, ${url} 1200w`;
  }
  
  return undefined;
};
