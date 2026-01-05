// Types pour l'API

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Component {
  _id: string;
  category: Category | string;
  title: string;
  brand: string;
  model: string;
  description?: string;
  specifications: Record<string, any>;
  imageUrl?: string;
  price?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Price {
  _id: string;
  component: Component | string;
  price: number;
  currency: string;
  url?: string;
  lastUpdated: string;
}

export interface Merchant {
  _id: string;
  name: string;
  websiteUrl: string;
  logoUrl?: string;
  prices: Price[];
  commissionRate?: number;
  affiliationConditions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationComponent {
  component: Component | string;
  quantity: number;
  selectedMerchant?: Merchant | string;
  price?: number;
}

export interface Configuration {
  _id: string;
  user: User | string;
  name: string;
  components: ConfigurationComponent[];
  totalCost: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

