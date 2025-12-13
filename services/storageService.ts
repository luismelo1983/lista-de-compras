import { GroceryList, GroceryItem, User } from '../types';

// Mock Initial Data
const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Grupo Silva', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Grupo%20Silva', color: 'bg-indigo-500' },
  { id: 'u_test', name: 'Usuário Teste', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Teste', color: 'bg-emerald-500' },
];

const DEFAULT_LISTS: GroceryList[] = [
  {
    id: 'l1',
    name: 'Mercado Semanal',
    color: 'bg-emerald-100',
    icon: '🛒',
    items: [
      { id: 'i1', name: 'Leite', checked: false, createdAt: Date.now() },
      { id: 'i2', name: 'Ovos (12un)', checked: false, createdAt: Date.now() },
      { id: 'i3', name: 'Pão Francês', checked: true, createdAt: Date.now() - 10000 },
    ],
  },
  {
    id: 'l2',
    name: 'Produtos de Limpeza',
    color: 'bg-blue-100',
    icon: '🧹',
    items: [
      { id: 'i4', name: 'Detergente', checked: false, createdAt: Date.now() },
    ],
  }
];

// LocalStorage Keys
const LISTS_KEY = 'family_market_lists';
const USERS_KEY = 'family_market_users';
const CURRENT_USER_KEY = 'family_market_user_id';

// --- User & Auth Management ---

export const getUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(stored);
};

export const getCurrentUser = (): User | null => {
  const storedId = localStorage.getItem(CURRENT_USER_KEY);
  if (!storedId) return null;
  const users = getUsers();
  return users.find(u => u.id === storedId) || null;
};

export const logout = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export const login = async (email: string, password: string): Promise<User | null> => {
  await simulateDelay(600);

  // Credenciais Explicitas de Desenvolvimento (Backdoor)
  if (email === 'teste@teste.com' && password === 'teste') {
      const devUser: User = { 
          id: 'u_test', 
          name: 'Usuário Teste', 
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Teste', 
          color: 'bg-emerald-500' 
      };
      
      // Garante que o usuário existe no storage (caso tenha sido limpo ou inicializado antes da mudança)
      const currentUsers = getUsers();
      if (!currentUsers.find(u => u.id === devUser.id)) {
          currentUsers.push(devUser);
          localStorage.setItem(USERS_KEY, JSON.stringify(currentUsers));
      }

      localStorage.setItem(CURRENT_USER_KEY, devUser.id);
      return devUser;
  }

  const users = getUsers();
  // Simples verificação mockada. Em produção, validaria email/hash da senha.
  // Para demo: considera o login se o nome da conta ou email coincidir parcialmente
  const user = users.find(u => 
    u.name.toLowerCase().includes(email.toLowerCase()) || 
    email.includes(u.name.toLowerCase().split(' ')[0])
  );
  
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    return user;
  }
  return null;
};

export const register = async (name: string, email: string, password: string): Promise<User> => {
  await simulateDelay(800);
  const users = getUsers();
  const newUser: User = {
    id: `u${Date.now()}`,
    name: name, // Nome de exibição
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
    color: 'bg-indigo-500'
  };
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, newUser.id);
  // Limpa listas antigas ao criar nova conta para começar do zero (opcional, mas bom para demo)
  // localStorage.removeItem(LISTS_KEY); 
  return newUser;
};

export const resetPassword = async (email: string): Promise<boolean> => {
  await simulateDelay(1000);
  return true; 
}

// --- List Management ---

export const getLists = (): GroceryList[] => {
  const stored = localStorage.getItem(LISTS_KEY);
  if (!stored) {
    localStorage.setItem(LISTS_KEY, JSON.stringify(DEFAULT_LISTS));
    return DEFAULT_LISTS;
  }
  return JSON.parse(stored);
};

export const saveList = (updatedList: GroceryList): void => {
  const lists = getLists();
  const index = lists.findIndex(l => l.id === updatedList.id);
  if (index >= 0) {
    lists[index] = updatedList;
  } else {
    lists.push(updatedList);
  }
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
};

export const updateListMetadata = (listId: string, name: string, icon?: string): void => {
  const lists = getLists();
  const list = lists.find(l => l.id === listId);
  if (list) {
    list.name = name;
    if (icon) list.icon = icon;
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  }
};

export const deleteList = (listId: string): void => {
  const lists = getLists().filter(l => l.id !== listId);
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
};

export const createList = (name: string): GroceryList => {
  const newList: GroceryList = {
    id: `l${Date.now()}`,
    name,
    items: [],
    color: 'bg-blue-100', // Default
    icon: '📝'
  };
  saveList(newList);
  return newList;
};

// Helper for simulating network latency
export const simulateDelay = async (ms: number = 300) => new Promise(res => setTimeout(res, ms));