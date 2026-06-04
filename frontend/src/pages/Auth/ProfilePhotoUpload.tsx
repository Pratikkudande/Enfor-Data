import React from 'react';
import { Upload, X } from 'lucide-react';

interface ProfilePhotoUploadProps {
  photoPreview: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ photoPreview, onUpload, onRemove }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Passport Size Photo
      </label>
      <div className="flex items-center space-x-4">
        {photoPreview ? (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Profile preview"
              className="w-24 h-24 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <div>
          <input
            type="file"
            id="profilePhoto"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
          />
          <label
            htmlFor="profilePhoto"
            className="btn-secondary px-4 py-2 cursor-pointer inline-flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </label>
          <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoUpload;
