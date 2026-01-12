import { ApiResponse, Vendor, Category, User, DashboardStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getVendors(): Promise<ApiResponse<Vendor[]>> {
    return this.request('/admin/vendors');
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request('/admin/categories');
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
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return this.request(`/admin/products?${queryParams.toString()}`);
  }

  async getProduct(id: string): Promise<ApiResponse<unknown>> {
    return this.request(`/admin/products/${id}`);
  }

  async getActivityLogs(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
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
}

export const apiClient = new ApiClient();
