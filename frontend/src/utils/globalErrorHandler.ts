/**
 * Global error handler for catching and managing runtime errors
 * Specifically handles image loading errors and animation frame issues
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  type: 'image' | 'animation' | 'network' | 'runtime' | 'unknown';
}

class GlobalErrorHandler {
  private errors: ErrorInfo[] = [];
  private maxErrors = 50; // Keep only last 50 errors

  constructor() {
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        type: this.categorizeError(event.reason?.message || '')
      });

      // Prevent default browser behavior for certain errors
      if (this.shouldSuppressError(event.reason?.message)) {
        event.preventDefault();
      }
    });

    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
      const errorMsg = event.message || event.error?.message || 'Unknown error';
      
      this.logError({
        message: errorMsg,
        stack: event.error?.stack,
        timestamp: Date.now(),
        type: this.categorizeError(errorMsg)
      });

      // Suppress specific errors that are not critical
      if (this.shouldSuppressError(errorMsg)) {
        event.preventDefault();
        return false;
      }
    });

    // Handle image loading errors globally
    document.addEventListener('error', (event) => {
      if (event.target && (event.target as any).tagName === 'IMG') {
        const img = event.target as HTMLImageElement;
        this.handleImageError(img);
      }
    }, true);
  }

  private categorizeError(message: string): ErrorInfo['type'] {
    if (message.includes('startTime') || message.includes('requestAnimationFrame')) {
      return 'animation';
    }
    if (message.includes('image') || message.includes('img') || message.includes('load')) {
      return 'image';
    }
    if (message.includes('fetch') || message.includes('network') || message.includes('NetworkError')) {
      return 'network';
    }
    if (message.includes('TypeError') || message.includes('ReferenceError')) {
      return 'runtime';
    }
    return 'unknown';
  }

  private shouldSuppressError(message: string): boolean {
    const suppressibleErrors = [
      'Cannot read properties of undefined (reading \'startTime\')',
      'requestAnimationFrame',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured'
    ];

    return suppressibleErrors.some(error => 
      message && message.includes(error)
    );
  }

  private handleImageError(img: HTMLImageElement) {
    console.warn('Global image error handler: Failed to load image', img.src);
    
    // Try to set a fallback image
    if (!img.src.includes('pexels.com')) {
      img.src = 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg';
    } else {
      // If even the fallback fails, hide the image
      img.style.display = 'none';
      
      // Try to show fallback content if available
      const parent = img.parentElement;
      if (parent) {
        const fallback = parent.querySelector('.image-fallback, .avatar-fallback, .profile-fallback');
        if (fallback) {
          (fallback as HTMLElement).style.display = 'flex';
        }
      }
    }
  }

  private logError(error: ErrorInfo) {
    // Add to errors array
    this.errors.push(error);
    
    // Keep only the last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${error.type.toUpperCase()}] ${error.message}`);
      if (error.stack) {
        console.warn(error.stack);
      }
    }
  }

  public getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  public clearErrors() {
    this.errors = [];
  }

  public getErrorsByType(type: ErrorInfo['type']): ErrorInfo[] {
    return this.errors.filter(error => error.type === type);
  }
}

// Create singleton instance
export const globalErrorHandler = new GlobalErrorHandler();

// Export utility function to manually log errors
export const logError = (message: string, type: ErrorInfo['type'] = 'unknown', stack?: string) => {
  globalErrorHandler['logError']({
    message,
    stack,
    timestamp: Date.now(),
    type
  });
};