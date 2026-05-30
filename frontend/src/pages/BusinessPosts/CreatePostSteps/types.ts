// Vendor subcategories — add more here as needed
export const VENDOR_SUBCATEGORIES = [
  { value: 'rent_agreement', label: 'Rent Agreement', desc: 'Creates rental agreements, area/location-wise' },
  { value: 'house_service', label: 'House Service', desc: 'Furniture/services for rent or purchase, area-wise' },
  { value: 'flat_cleaner', label: 'Flat Cleaner', desc: 'Flat and home cleaning services' },
  { value: 'pest_controller', label: 'Pest Controller', desc: 'Pest control and treatment services' },
] as const;

export type VendorSubcategory = typeof VENDOR_SUBCATEGORIES[number]['value'];

export type PostCategory = 'furniture_office' | 'furniture_house' | 'vendor' | 'staff';
export type PostSubcategory = 'sale' | 'rent' | 'requirement' | VendorSubcategory;

export interface PostFormData {
  title: string;
  category: PostCategory | '';
  subcategory: PostSubcategory | '';
  description: string;
  price: string;
  location: string;
  // Vendor-specific fields
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactWhatsapp: string;
  serviceArea: string;
  images: File[];
  // Staff-specific
  resumeFile: File | null;
}

export interface StepProps {
  formData: PostFormData;
  errors: Partial<Record<keyof PostFormData, string>>;
  handleInputChange: (field: keyof PostFormData, value: string) => void;
  onResumeChange?: (file: File | null) => void;
}
