export interface User {
  id: string;
  name: string;
  email: string; // Adicionado para convites
  avatar: string;
  color: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  category?: string;
  quantity?: number; // Novo campo numérico opcional
  createdAt: number;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  color: string;
  icon: string;
  createdAt?: number;
  order?: number; // Campo para ordenação personalizada
  userId: string; // ID do dono
  ownerName?: string; // Nome do dono para exibição
  sharedWith?: string[]; // Array de emails com acesso
  webhookUrl?: string; // URL para integração (BotConversa, Zapier, etc)
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