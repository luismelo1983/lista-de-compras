
export type UserRole = 'admin' | 'master' | 'child';
export type ListPrivilege = 'none' | 'view' | 'work';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  color: string;
  role: UserRole;
  masterId: string;
  status: 'active' | 'blocked' | 'cancelled';
  planType?: 'mensal' | 'anual' | 'degustacao' | 'premium';
  paymentSource?: string;
  expiresAt?: number;
  // Permissões específicas por ID de lista
  listPermissions?: Record<string, ListPrivilege>;
}

export interface Contact {
  name: string;
  phone: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  category?: string;
  quantity?: number;
  order?: number;
  createdAt: number;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  color: string;
  icon: string;
  createdAt?: number;
  order?: number;
  userId: string;
  ownerName?: string;
  sharedWith?: string[];
  webhookUrl?: string;
  contactName?: string;
  contactPhone?: string;
  contacts?: Contact[];
}

// Fix: Added GeminiSuggestion interface which was missing and causing a compilation error in geminiService.ts
export interface GeminiSuggestion {
  name: string;
  category: string;
  reason: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  LIST_DETAIL = 'LIST_DETAIL',
  PROFILE = 'PROFILE',
  ADMIN_PANEL = 'ADMIN_PANEL',
  SALES = 'SALES'
}
