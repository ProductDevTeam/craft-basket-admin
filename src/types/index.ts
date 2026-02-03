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

// Personalization types available for products
export type PersonalizationType = 
  | 'engraving'
  | 'sticker'
  | 'print-on'
  | 'none';

export interface ProductFormData {
  vendorId: string;
  name: string;
  description: string;
  shortDescription?: string;
  categories: string[]; // Changed to array for multi-category
  occasion?: string[];
  giftType?: string[];
  basePrice: number;
  discountPercentage?: number;
  weight?: string;
  color?: string;
  materials: string[];
  keyInfo: KeyInfo[];
  personalizationType?: PersonalizationType;
  estimatedDeliveryDays?: number;
  isBestSeller: boolean;
  isFeatured: boolean;
  isMadeInNigeria: boolean;
  stock: number;
  sku: string;
  tags: string[];
}

// Filter options for product listing
export const OCCASION_OPTIONS = [
  'Wedding',
  'Corporate Gifting',
  'Birthdays',
  'Condolence & Remembrance',
  'Friends & Loved Ones',
  'Notable Holidays',
] as const;

export const GIFT_TYPE_OPTIONS = [
  'For Him',
  'For Her',
  'For Kids',
  'Boxes & Hampers',
  'Beauty & Grooming',
  'Keepsakes',
  'Accessories',
  'Home And Decor',
  'Personalised Gifts',
  'Flowers & Cards',
] as const;

export const PERSONALIZATION_TYPE_OPTIONS: { value: PersonalizationType; label: string }[] = [
  { value: 'none', label: 'No Personalization' },
  { value: 'engraving', label: 'Engraving' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'print-on', label: 'Print-on' },
];

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ==================== EMAIL TYPES ====================

export type EmailTemplateCategory = 'welcome' | 'birthday' | 'promotional' | 'newsletter' | 'transactional' | 'custom';

export interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  htmlContent: string;
  jsonContent?: Record<string, unknown>;
  category: EmailTemplateCategory;
  isActive: boolean;
  createdBy: { _id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
export type AudienceSegment = 'all_customers' | 'all_vendors' | 'birthday_this_month' | 'new_customers_30d' | 'inactive_customers_90d' | 'custom';

export interface EmailCampaign {
  _id: string;
  name: string;
  subject: string;
  htmlContent: string;
  jsonContent?: Record<string, unknown>;
  template?: { _id: string; name: string; subject?: string };
  status: CampaignStatus;
  audienceSegment: AudienceSegment;
  customRecipients?: string[];
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  successCount: number;
  failCount: number;
  createdBy: { _id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export type AutomationTrigger = 'registration' | 'birthday' | 'inactive_30d' | 'first_purchase';

export interface EmailAutomationRule {
  _id: string;
  name: string;
  trigger: AutomationTrigger;
  isEnabled: boolean;
  template?: { _id: string; name: string; subject?: string };
  subject: string;
  htmlContent?: string;
  lastRunAt?: string;
  createdBy: { _id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface Subscriber {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  createdAt: string;
}

export interface SubscriberStats {
  totalCustomers: number;
  customersWithBirthday: number;
  newCustomers30d: number;
  totalVendors: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalVendors: number;
  totalOrders: number;
  recentProducts?: number;
  recentOrders?: number;
  totalRevenue?: number;
  orderStats?: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  recentOrdersList?: Array<{
    _id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    customer?: {
      firstName: string;
      lastName: string;
    };
  }>;
  monthlyStats?: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
}
