export interface PostFormData {
  title: string;
  category: 'property' | 'furniture' | 'staff' | '';
  subcategory: 'sale' | 'rent' | 'requirement' | '';
  description: string;
  price: string;
  location: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  images: File[];
}

export interface StepProps {
  formData: PostFormData;
  errors: Partial<Record<keyof PostFormData, string>>;
  handleInputChange: (field: keyof PostFormData, value: string) => void;
}
