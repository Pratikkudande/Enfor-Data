import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { API_CONFIG } from '../../config/api';

interface PropertyPhotoUploadProps {
  propertyId: string;
  currentPhotos: string[];
  onPhotosUpdated: (photos: string[]) => void;
  onClose: () => void;
}

const PropertyPhotoUpload: React.FC<PropertyPhotoUploadProps> = ({
  propertyId,
  currentPhotos,
  onPhotosUpdated,
  onClose
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxPhotos = 5;
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setError(null);

    // Check total photo limit
    const totalPhotos = currentPhotos.length + files.length;
    if (totalPhotos > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed. You currently have ${currentPhotos.length} photos.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`Photo ${index + 1}: File too large (max 5MB)`);
        return;
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`Photo ${index + 1}: Invalid file type (JPEG, PNG, GIF, WebP only)`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join('; '));
      return;
    }

    setSelectedFiles(validFiles);

    // Create preview URLs
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select photos to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      const token = localStorage.getItem('enfor_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/property-photos/${propertyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      // Update parent component with new photos
      const updatedPhotos = [...currentPhotos, ...result.data.uploaded_photos];
      onPhotosUpdated(updatedPhotos);

      // Clean up
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show success message if there were warnings
      if (result.data.warnings && result.data.warnings.length > 0) {
        setError(`Upload completed with warnings: ${result.data.warnings.join('; ')}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoFilename: string) => {
    try {
      const token = localStorage.getItem('enfor_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/property-photos/${propertyId}/${photoFilename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Delete failed');
      }

      // Update parent component
      const updatedPhotos = currentPhotos.filter(photo => photo !== photoFilename);
      onPhotosUpdated(updatedPhotos);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const clearSelection = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Property Photos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload up to {maxPhotos} photos (max 5MB each). Current: {currentPhotos.length}/{maxPhotos}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Photos */}
          {currentPhotos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Current Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentPhotos.map((photo, index) => (
                  <div key={photo} className="relative group">
                    <img
                      src={`${API_CONFIG.BASE_URL}/uploads/${photo}`}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Section */}
          {currentPhotos.length < maxPhotos && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Upload New Photos</h3>
              
              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFiles.length === 0 ? (
                  <div>
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Select Photos
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      JPEG, PNG, GIF, WebP up to 5MB each
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {selectedFiles[index].name}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={clearSelection}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Add More
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photos
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Photo Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Maximum {maxPhotos} photos per property</li>
              <li>• Each photo must be under 5MB</li>
              <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
              <li>• High-quality photos improve property visibility</li>
              <li>• First photo will be used as the main display image</li>
            </ul>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyPhotoUpload;