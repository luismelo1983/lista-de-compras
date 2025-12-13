export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  category?: string;
  createdAt: number;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  color: string;
  icon: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  LIST_DETAIL = 'LIST_DETAIL',
}

export interface GeminiSuggestion {
  name: string;
  category: string;
  reason: string;
}