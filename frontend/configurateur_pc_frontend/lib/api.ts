// Service API pour communiquer avec le backend

import type {
  Category,
  Component,
  Merchant,
  User,
  Configuration,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Une erreur est survenue',
      }));
      throw new Error(error.message || 'Une erreur est survenue');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Categories
  async getCategories() {
    return this.request<Category[]>('/categories');
  }

  async getCategory(id: string) {
    return this.request<Category>(`/categories/${id}`);
  }

  async createCategory(data: { name: string; description?: string }) {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: { name?: string; description?: string }) {
    return this.request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Components
  async getComponents(params?: {
    category?: string;
    brand?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.brand) queryParams.append('brand', params.brand);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request<Component[]>(`/components${query ? `?${query}` : ''}`);
  }

  async getComponent(id: string) {
    return this.request<Component>(`/components/${id}`);
  }

  async createComponent(data: {
    category: string;
    title: string;
    brand: string;
    model: string;
    description?: string;
    specifications?: Record<string, any>;
    imageUrl?: string;
  }) {
    return this.request<Component>('/components', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComponent(
    id: string,
    data: {
      category?: string;
      title?: string;
      brand?: string;
      model?: string;
      description?: string;
      specifications?: Record<string, any>;
      imageUrl?: string;
    }
  ) {
    return this.request<Component>(`/components/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComponent(id: string) {
    return this.request(`/components/${id}`, {
      method: 'DELETE',
    });
  }

  // Merchants
  async getMerchants() {
    return this.request<Merchant[]>('/merchants');
  }

  async getMerchant(id: string) {
    return this.request<Merchant>(`/merchants/${id}`);
  }

  async createMerchant(data: {
    name: string;
    websiteUrl: string;
    logoUrl?: string;
    commissionRate?: number;
    affiliationConditions?: string;
    isActive?: boolean;
  }) {
    return this.request<Merchant>('/merchants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMerchant(
    id: string,
    data: {
      name?: string;
      websiteUrl?: string;
      logoUrl?: string;
      commissionRate?: number;
      affiliationConditions?: string;
      isActive?: boolean;
    }
  ) {
    return this.request<Merchant>(`/merchants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMerchant(id: string) {
    return this.request(`/merchants/${id}`, {
      method: 'DELETE',
    });
  }

  async addMerchantPrice(
    merchantId: string,
    data: {
      component: string;
      price: number;
      currency?: string;
      url?: string;
    }
  ) {
    return this.request<Merchant>(`/merchants/${merchantId}/prices`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Users
  async getUsers() {
    return this.request<User[]>('/users');
  }

  async getUser(id: string) {
    return this.request<User & { configurations: Configuration[] }>(
      `/users/${id}`
    );
  }

  // Configurations
  async getConfigurations() {
    return this.request<Configuration[]>('/configurations');
  }

  async getConfiguration(id: string) {
    return this.request<Configuration>(`/configurations/${id}`);
  }

  async createConfiguration(data: {
    name: string;
    components: Array<{
      component: string;
      quantity: number;
      selectedMerchant?: string;
    }>;
  }) {
    return this.request<Configuration>('/configurations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConfiguration(
    id: string,
    data: {
      name?: string;
      components?: Array<{
        component: string;
        quantity: number;
        selectedMerchant?: string;
      }>;
    }
  ) {
    return this.request<Configuration>(`/configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteConfiguration(id: string) {
    return this.request(`/configurations/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();

