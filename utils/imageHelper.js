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
