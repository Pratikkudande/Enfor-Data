/**
 * Image utility functions with error handling and fallbacks
 */

export const createImageLoader = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Set timeout for loading
    const timeoutId = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error(`Image load timeout: ${src}`));
    }, 10000); // 10 second timeout
    
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;
  });
};

export const preloadImages = async (urls: string[]): Promise<void> => {
  const loadPromises = urls.map(url => 
    createImageLoader(url).catch(err => {
      console.warn('Image preload failed:', err.message);
      return null; // Continue with other images even if one fails
    })
  );
  
  await Promise.allSettled(loadPromises);
};

/**
 * Safe image loading with error handling
 * Note: This is a utility function, not a React component
 */
export interface SafeImageOptions {
  fallbackUrl?: string;
  onImageError?: () => void;
  timeout?: number;
}

export const loadImageSafely = (
  src: string, 
  options: SafeImageOptions = {}
): Promise<HTMLImageElement> => {
  const { fallbackUrl, onImageError, timeout = 10000 } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    const cleanup = () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
    
    const timeoutId = setTimeout(() => {
      cleanup();
      if (fallbackUrl && src !== fallbackUrl) {
        // Try fallback URL
        loadImageSafely(fallbackUrl, { ...options, fallbackUrl: undefined })
          .then(resolve)
          .catch(reject);
      } else {
        onImageError?.();
        reject(new Error(`Image load timeout: ${src}`));
      }
    }, timeout);
    
    img.onload = () => {
      cleanup();
      resolve(img);
    };
    
    img.onerror = () => {
      cleanup();
      if (fallbackUrl && src !== fallbackUrl) {
        // Try fallback URL
        loadImageSafely(fallbackUrl, { ...options, fallbackUrl: undefined })
          .then(resolve)
          .catch(() => {
            onImageError?.();
            reject(new Error(`Failed to load image: ${src}`));
          });
      } else {
        onImageError?.();
        reject(new Error(`Failed to load image: ${src}`));
      }
    };
    
    img.src = src;
  });
};

/**
 * Get optimized image URL with error handling
 */
export const getOptimizedImageUrl = (
  url: string | undefined | null,
  fallbackUrl: string,
  baseUrl?: string
): string => {
  if (!url) return fallbackUrl;
  
  try {
    // Return as-is if it's already a complete URL
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    
    // Handle relative URLs
    if (baseUrl) {
      if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
        const filename = url.split('/').pop();
        return `${baseUrl}/uploads/${filename}`;
      }
      
      if (url.includes('/uploads/')) {
        return url;
      }
      
      return `${baseUrl}/uploads/${url}`;
    }
    
    return url;
  } catch (error) {
    console.warn('Error processing image URL:', error);
    return fallbackUrl;
  }
};