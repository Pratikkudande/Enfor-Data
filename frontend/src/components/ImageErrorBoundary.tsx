import React, { Component, ReactNode } from 'react';
import { Building } from 'lucide-react';

interface ImageErrorBoundaryState {
  hasError: boolean;
  errorInfo?: string;
}

interface ImageErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ImageErrorBoundary extends Component<ImageErrorBoundaryProps, ImageErrorBoundaryState> {
  constructor(props: ImageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ImageErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorInfo: error.message
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log image-related errors
    if (error.message.includes('image') || error.message.includes('img') || 
        error.message.includes('src') || error.message.includes('load')) {
      console.warn('Image Error Boundary caught an error:', error, errorInfo);
    } else {
      // Re-throw non-image errors to let other error boundaries handle them
      throw error;
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI for image errors
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-48 bg-gray-50 text-gray-400 select-none border border-gray-100">
          <Building className="h-10 w-10 stroke-[1.2] mb-1 text-gray-300" />
          <span className="text-[10px] font-semibold tracking-wider text-gray-400">IMAGE ERROR</span>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ImageErrorBoundary;