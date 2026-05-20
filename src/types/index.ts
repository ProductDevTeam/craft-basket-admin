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
  category?: string;
  // ─── V2 IA Taxonomy ────────────────────────────────────────────────────────
  subcategory?: string;
  recipientTags: string[];
  occasionTags: string[];
  styleTags: string[];
  // ─── Legacy (kept for backwards compat) ────────────────────────────────────
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

// ─── V2 IA Taxonomy Constants ─────────────────────────────────────────────────
// These must stay in sync with src/constants/taxonomy.ts in the backend.

export const OCCASION_OPTIONS = [
  // Birthdays
  'Birthday',
  // Weddings
  'Proposal',
  'Engagement',
  'Bridal Shower',
  'Wedding',
  'Bridesmaid',
  'Groomsmen',
  'Wedding Souvenir',
  'Honeymoon',
  // Corporate
  'Conference',
  'Employee Appreciation',
  'Client Appreciation',
  'Onboarding',
  'Retirement',
  // Baby Celebrations
  'Baby Shower',
  'Naming Ceremony',
  'Newborn Welcome',
  // Milestones
  'Graduation',
  'Promotion',
  'Housewarming',
  'New Job',
  // General
  'Anniversary',
  'Valentine',
  "Mother's Day",
  "Father's Day",
  'Christmas',
  'Easter',
  'Eid',
] as const;

export const RECIPIENT_OPTIONS = [
  'Women',
  'Men',
  'Couples',
  'Kids',
  'Babies',
  'Mothers',
  'Fathers',
  'Friends',
  'Colleagues',
] as const;

export const STYLE_TAG_OPTIONS = [
  'Luxury',
  'Budget-Friendly',
  'Wellness',
  'Eco-Friendly',
  'Funny',
  'Romantic',
  'Minimalist',
  'Bold',
  'Traditional',
  'Modern',
] as const;

/** Level 1 → Level 2: maps each core category to its subcategories */
export const SUBCATEGORIES_MAP: Record<string, readonly string[]> = {
  'Fashion & Accessories': ['Men Fashion', 'Women Fashion', 'Footwear', 'Bags', 'Wallets', 'Watches', 'Jewellery Accessories'],
  'Beauty & Self-care':    ['Skincare', 'Haircare', 'Perfumes', 'Spa Kits', 'Grooming'],
  'Food & Treats':         ['Snacks', 'Chocolates', 'Cakes', 'Pastries', 'Fruit Packs', 'Drinks', 'Wine Alternatives', 'Healthy Packs'],
  'Gift Boxes':            ['Self-care Boxes', 'Snack Boxes', 'Romantic Boxes', 'Luxury Boxes', 'Birthday Boxes', 'Corporate Boxes', 'Baby Boxes'],
  'Home & Living':         ['Candles', 'Decor', 'Kitchenware', 'Bedding', 'Aromatherapy', 'Storage Solutions'],
  'Tech & Gadgets':        ['Earbuds', 'Speakers', 'Power Banks', 'Phone Accessories', 'Gaming Accessories', 'Smart Devices'],
  'Baby & Child':          ['Baby Clothing', 'Feeding Essentials', 'Bath Essentials', 'Toys', 'School Essentials', 'Books'],
  'Personalized Gifts':    ['Custom Mugs', 'Custom Frames', 'Custom Shirts', 'Custom Pillows', 'Custom Keyholders', 'Engraved Gifts'],
};

export const CORE_CATEGORY_OPTIONS = Object.keys(SUBCATEGORIES_MAP) as string[];

/** Level 2 → Level 3: maps each subcategory to its specific items (only for categories with deep hierarchy) */
export const SUB_SUBCATEGORIES_MAP: Record<string, readonly string[]> = {
  // Fashion & Accessories
  'Men Fashion':           ['Shirts', 'Men Trousers', 'Shorts', 'Native Wear', 'Jackets', 'Hoodies', 'Tracksuits'],
  'Women Fashion':         ['Dresses', 'Tops', 'Women Trousers', 'Skirts', 'Jumpsuits', 'Co-ords', 'Outerwear'],
  'Footwear':              ['Sneakers', 'Sandals', 'Slippers', 'Heels', 'Boots', 'Loafers'],
  'Bags':                  ['Handbags', 'Tote Bags', 'Backpacks', 'Clutches', 'Travel Bags'],
  'Wallets':               ['Men Wallets', 'Women Wallets', 'Card Holders'],
  'Watches':               ['Smartwatches', 'Luxury Watches', 'Casual Watches'],
  'Jewellery Accessories': ['Bracelets', 'Chains', 'Earrings', 'Rings'],
  // Beauty & Self-care
  'Skincare':              ['Cleansers', 'Serums', 'Moisturizers', 'Sunscreens'],
  'Haircare':              ['Wigs', 'Hair Oils', 'Shampoos', 'Conditioners'],
  'Perfumes':              ['Men Perfumes', 'Women Perfumes', 'Unisex Perfumes'],
  'Spa Kits':              ['Bath Kits', 'Massage Kits', 'Relaxation Kits'],
  'Grooming':              ['Beard Kits', 'Shaving Kits'],
};

// ─── Legacy (kept for backwards compat with any existing code) ────────────────
export const GIFT_TYPE_OPTIONS = RECIPIENT_OPTIONS;

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
