import {
  ApiResponse,
  Vendor,
  User,
  DashboardStats,
  EmailTemplate,
  EmailCampaign,
  EmailAutomationRule,
  Subscriber,
  SubscriberStats,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      ...(options.headers || {}),
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${endpoint}`, data);
        throw new Error(data.message || `Error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error or invalid response');
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getVendors(): Promise<ApiResponse<Vendor[]>> {
    return this.request('/admin/vendors');
  }

  async createProduct(formData: FormData): Promise<ApiResponse<unknown>> {
    return this.request('/admin/products', {
      method: 'POST',
      body: formData,
    });
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/admin/dashboard/stats');
  }

  async inviteVendor(email: string): Promise<ApiResponse<unknown>> {
    return this.request('/admin/invite-vendor', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    vendor?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minDiscount?: number;
    madeInNigeria?: boolean;
    maxDeliveryDays?: number;
    // V2 IA Taxonomy
    recipients?: string[];
    occasionTags?: string[];
    styleTags?: string[];
    budgetTier?: string;
    subcategory?: string;
    // Legacy
    occasions?: string[];
    giftTypes?: string[];
    sort?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.vendor) queryParams.append('vendor', params.vendor);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.minDiscount !== undefined)
      queryParams.append('minDiscount', params.minDiscount.toString());
    if (params?.madeInNigeria !== undefined)
      queryParams.append('madeInNigeria', params.madeInNigeria.toString());
    if (params?.maxDeliveryDays !== undefined)
      queryParams.append('maxDeliveryDays', params.maxDeliveryDays.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    // V2 IA Taxonomy
    if (params?.recipients && params.recipients.length > 0) {
      params.recipients.forEach((r) => queryParams.append('recipients', r));
    }
    if (params?.occasionTags && params.occasionTags.length > 0) {
      params.occasionTags.forEach((o) => queryParams.append('occasionTags', o));
    }
    if (params?.styleTags && params.styleTags.length > 0) {
      params.styleTags.forEach((s) => queryParams.append('styleTags', s));
    }
    if (params?.budgetTier) queryParams.append('budgetTier', params.budgetTier);
    if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
    // Legacy
    if (params?.occasions && params.occasions.length > 0) {
      params.occasions.forEach((occ) => queryParams.append('occasions', occ));
    }
    if (params?.giftTypes && params.giftTypes.length > 0) {
      params.giftTypes.forEach((gt) => queryParams.append('giftTypes', gt));
    }

    return this.request(`/admin/products?${queryParams.toString()}`);
  }

  async getProduct(id: string): Promise<ApiResponse<unknown>> {
    return this.request(`/admin/products/${id}`);
  }

  async getActivityLogs(params?: { page?: number; limit?: number }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return this.request(`/admin/activity-logs?${queryParams.toString()}`);
  }

  async deleteProduct(id: string): Promise<ApiResponse<null>> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async updateProduct(id: string, formData: FormData): Promise<ApiResponse<unknown>> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async generateSku(vendorId: string): Promise<ApiResponse<{ sku: string }>> {
    return this.request(`/admin/vendors/${vendorId}/generate-sku`);
  }

  // ==================== EMAIL TEMPLATES ====================

  async getEmailTemplates(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<ApiResponse<EmailTemplate[]>> {
    const qp = new URLSearchParams();
    if (params?.page) qp.append('page', params.page.toString());
    if (params?.limit) qp.append('limit', params.limit.toString());
    if (params?.search) qp.append('search', params.search);
    if (params?.category) qp.append('category', params.category);
    return this.request(`/email/templates?${qp.toString()}`);
  }

  async getEmailTemplate(id: string): Promise<ApiResponse<EmailTemplate>> {
    return this.request(`/email/templates/${id}`);
  }

  async createEmailTemplate(data: {
    name: string;
    subject: string;
    htmlContent: string;
    jsonContent?: Record<string, unknown>;
    category?: string;
  }): Promise<ApiResponse<EmailTemplate>> {
    return this.request('/email/templates', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateEmailTemplate(
    id: string,
    data: Partial<EmailTemplate>
  ): Promise<ApiResponse<EmailTemplate>> {
    return this.request(`/email/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteEmailTemplate(id: string): Promise<ApiResponse<null>> {
    return this.request(`/email/templates/${id}`, { method: 'DELETE' });
  }

  // ==================== EMAIL CAMPAIGNS ====================

  async getEmailCampaigns(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<EmailCampaign[]>> {
    const qp = new URLSearchParams();
    if (params?.page) qp.append('page', params.page.toString());
    if (params?.limit) qp.append('limit', params.limit.toString());
    if (params?.status) qp.append('status', params.status);
    return this.request(`/email/campaigns?${qp.toString()}`);
  }

  async getEmailCampaign(id: string): Promise<ApiResponse<EmailCampaign>> {
    return this.request(`/email/campaigns/${id}`);
  }

  async createEmailCampaign(data: {
    name: string;
    subject: string;
    htmlContent: string;
    jsonContent?: Record<string, unknown>;
    template?: string;
    audienceSegment: string;
    customRecipients?: string[];
    scheduledAt?: string;
  }): Promise<ApiResponse<EmailCampaign>> {
    return this.request('/email/campaigns', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateEmailCampaign(
    id: string,
    data: Partial<EmailCampaign>
  ): Promise<ApiResponse<EmailCampaign>> {
    return this.request(`/email/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteEmailCampaign(id: string): Promise<ApiResponse<null>> {
    return this.request(`/email/campaigns/${id}`, { method: 'DELETE' });
  }

  async sendEmailCampaign(id: string): Promise<ApiResponse<EmailCampaign>> {
    return this.request(`/email/campaigns/${id}/send`, { method: 'POST' });
  }

  async cancelEmailCampaign(id: string): Promise<ApiResponse<EmailCampaign>> {
    return this.request(`/email/campaigns/${id}/cancel`, { method: 'POST' });
  }

  async getCampaignAnalytics(id: string): Promise<ApiResponse<{ campaign: EmailCampaign; stats: Record<string, any> }>> {
    return this.request(`/email/campaigns/${id}/analytics`);
  }

  async getCampaignRecipients(id: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<any[]>> {
    const qp = new URLSearchParams();
    if (params?.page) qp.append('page', params.page.toString());
    if (params?.limit) qp.append('limit', params.limit.toString());
    return this.request(`/email/campaigns/${id}/recipients?${qp.toString()}`);
  }

  // ==================== AUTOMATION RULES ====================

  async getAutomationRules(): Promise<ApiResponse<EmailAutomationRule[]>> {
    return this.request('/email/automation');
  }

  async getAutomationRule(id: string): Promise<ApiResponse<EmailAutomationRule>> {
    return this.request(`/email/automation/${id}`);
  }

  async createAutomationRule(data: {
    name: string;
    trigger: string;
    isEnabled?: boolean;
    template?: string;
    subject?: string;
    htmlContent?: string;
  }): Promise<ApiResponse<EmailAutomationRule>> {
    return this.request('/email/automation', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateAutomationRule(
    id: string,
    data: Partial<EmailAutomationRule>
  ): Promise<ApiResponse<EmailAutomationRule>> {
    return this.request(`/email/automation/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteAutomationRule(id: string): Promise<ApiResponse<null>> {
    return this.request(`/email/automation/${id}`, { method: 'DELETE' });
  }

  // ==================== SUBSCRIBERS ====================

  async getSubscribers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    segment?: string;
  }): Promise<ApiResponse<Subscriber[]>> {
    const qp = new URLSearchParams();
    if (params?.page) qp.append('page', params.page.toString());
    if (params?.limit) qp.append('limit', params.limit.toString());
    if (params?.search) qp.append('search', params.search);
    if (params?.segment) qp.append('segment', params.segment);
    return this.request(`/email/subscribers?${qp.toString()}`);
  }

  async getSubscriberStats(): Promise<ApiResponse<SubscriberStats>> {
    return this.request('/email/subscribers/stats');
  }

  // ==================== TEST EMAIL ====================

  async sendTestEmail(data: {
    email: string;
    subject: string;
    htmlContent: string;
  }): Promise<ApiResponse<{ sent: boolean }>> {
    return this.request('/email/test', { method: 'POST', body: JSON.stringify(data) });
  }
}

export const apiClient = new ApiClient();
