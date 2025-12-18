
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
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
  contacts?: Contact[]; // Contatos para notificação via BotConversa
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  LIST_DETAIL = 'LIST_DETAIL',
  PROFILE = 'PROFILE',
}

export interface GeminiSuggestion {
  name: string;
  category: string;
  reason: string;
}
