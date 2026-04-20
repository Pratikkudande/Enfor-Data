import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { PostFormData } from './CreatePostSteps/types';
import ProgressBar from './CreatePostSteps/ProgressBar';
import Step1Category from './CreatePostSteps/Step1Category';
import Step2Details from './CreatePostSteps/Step2Details';
import Step3Contact from './CreatePostSteps/Step3Contact';
import { Building2, Sofa, Users, FileText } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    price: '',
    location: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof PostFormData, string>>>({});

  if (!isOpen) return null;

  const handleInputChange = (field: keyof PostFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...formData.images, ...files].slice(0, 5);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 5));
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof PostFormData, string>> = {};

    if (step === 1) {
      if (!formData.category) newErrors.category = 'Please select a category';
      if (!formData.subcategory) newErrors.subcategory = 'Please select a type';
    } else if (step === 2) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';

      if (formData.subcategory !== 'requirement') {
        if (!formData.price.trim()) {
          newErrors.price = 'Price is required';
        } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
          newErrors.price = 'Please enter a valid price';
        }
      }
    } else if (step === 3) {
      if (!formData.contactName.trim()) newErrors.contactName = 'Name is required';
      if (!formData.contactPhone.trim()) {
        newErrors.contactPhone = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(formData.contactPhone.replace(/[^\d]/g, ''))) {
        newErrors.contactPhone = 'Please enter a valid phone number';
      }
      if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      console.log('Form submitted:', formData);
      onClose();
    }
  };

  const getCategoryInfo = () => {
    switch (formData.category) {
      case 'property':
        return {
          icon: Building2,
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'furniture':
        return {
          icon: Sofa,
          color: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'staff':
        return {
          icon: Users,
          color: 'from-orange-500 to-amber-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200'
        };
      default:
        return {
          icon: FileText,
          color: 'from-gray-500 to-slate-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  const categoryInfo = getCategoryInfo();
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Business Post</h2>
            <p className="text-sm text-gray-600 mt-1">Share your business opportunity with the network</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <ProgressBar currentStep={currentStep} />

        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <Step1Category 
              formData={formData} 
              errors={errors} 
              handleInputChange={handleInputChange} 
            />
          )}

          {currentStep === 2 && (
            <Step2Details 
              formData={formData} 
              errors={errors} 
              handleInputChange={handleInputChange}
              categoryInfo={categoryInfo}
              CategoryIcon={CategoryIcon}
              imagePreviews={imagePreviews}
              handleImageUpload={handleImageUpload}
              removeImage={removeImage}
            />
          )}

          {currentStep === 3 && (
            <Step3Contact 
              formData={formData} 
              errors={errors} 
              handleInputChange={handleInputChange}
              categoryInfo={categoryInfo}
              CategoryIcon={CategoryIcon}
            />
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>

            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2.5 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Publish Post</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
