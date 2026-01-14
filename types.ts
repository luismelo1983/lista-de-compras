
export type UserRole = 'admin' | 'master' | 'child';
export type ChildPrivilege = 'view' | 'work';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  role: UserRole;
  masterId: string; // ID do Master vinculado
  status: 'active' | 'blocked' | 'cancelled';
  planType?: 'mensal' | 'anual' | 'degustacao';
  paymentSource?: string;
  expiresAt?: number;
  // Apenas para filhos
  privilege?: ChildPrivilege;
  allowedLists?: string[]; 
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
  userId: string; // ID do Master dono
  ownerName?: string;
  sharedWith?: string[];
  webhookUrl?: string;
  contactName?: string;
  contactPhone?: string;
  contacts?: Contact[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  LIST_DETAIL = 'LIST_DETAIL',
  PROFILE = 'PROFILE',
  ADMIN_PANEL = 'ADMIN_PANEL',
  SALES = 'SALES'
}

export interface GeminiSuggestion {
  name: string;
  category: string;
  reason: string;
}
