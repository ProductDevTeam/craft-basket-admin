export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'vendor' | 'customer';
  isActive: boolean;
  vendorInfo?: {
    businessName: string;
  };
}

export interface Vendor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  vendorInfo?: {
    businessName: string;
  };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface KeyInfo {
  label: string;
  value: string;
}

export interface PersonalizationOption {
  name: string;
  type: 'text' | 'select' | 'color';
  options?: string[];
  placeholder?: string;
  required: boolean;
  maxLength?: number;
  priceModifier?: number;
}

export interface ProductFormData {
  vendorId: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: string;
  basePrice: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  weight?: string;
  color?: string;
  materials: string[];
  keyInfo: KeyInfo[];
  personalizationOptions: PersonalizationOption[];
  isPersonalizable: boolean;
  estimatedDeliveryDays?: number;
  isBestSeller: boolean;
  isFeatured: boolean;
  stock: number;
  sku: string;
  tags: string[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
