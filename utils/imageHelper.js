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

export const getImageSrcSet = (url) => {
  if (!url) return undefined;
  
  if (typeof url !== 'string') return undefined;

  // Local images under /images/
  if (url.startsWith("/images/") && (url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".jpeg"))) {
    if (url.includes("_mobile")) {
      return undefined;
    }
    const dotIndex = url.lastIndexOf(".");
    const base = url.substring(0, dotIndex);
    const ext = url.substring(dotIndex);
    return `${base}_mobile${ext} 300w, ${url} 600w`;
  }
  
  // Supabase storage transformation fallback (if transformation is enabled)
  if (url.includes("supabase.co") || url.includes("supabase.in")) {
    return `${url}?width=300 300w, ${url}?width=600 600w`;
  }
  
  return undefined;
};

export const getBannerSrcSet = (url) => {
  if (!url) return undefined;
  
  if (typeof url !== 'string') return undefined;

  if (url.startsWith("/images/") && (url.endsWith(".jpg") || url.endsWith(".png") || url.endsWith(".jpeg"))) {
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
