import React, { useState } from 'react';
import { Building } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  onImageError?: () => void;
  showLoadingState?: boolean;
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  fallback, 
  onImageError,
  onError,
  showLoadingState = false,
  className = '',
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(showLoadingState);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('Image failed to load:', src);
    setImageError(true);
    setLoading(false);
    onImageError?.();
    onError?.(e);
  };

  const handleLoad = () => {
    setLoading(false);
    setImageError(false);
  };

  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        {fallback || (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Building className="h-8 w-8 mb-1" />
            <span className="text-xs">Image not available</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {loading && showLoadingState && (
        <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
          <div className="flex flex-col items-center justify-center text-gray-400">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-1"></div>
            <span className="text-xs">Loading...</span>
          </div>
        </div>
      )}
      <img
        {...props}
        src={src}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        style={{ display: loading && showLoadingState ? 'none' : 'block' }}
      />
    </>
  );
};