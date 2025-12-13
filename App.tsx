import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import GroceryList from './components/GroceryList';
import Auth from './components/Auth';
import * as storageService from './services/storageService';
import { User, GroceryList as GroceryListType, ViewState } from './types';
import { IconShoppingBag, IconLogout } from './components/Icons';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lists, setLists] = useState<GroceryListType[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Authentication & Data Subscription
  useEffect(() => {
    // Listen for auth changes
    const unsubscribeAuth = storageService.onAuthChange((user) => {
      setCurrentUser(user);
      
      if (user) {
        // If logged in, subscribe to real-time updates for lists
        // Note: We pass the whole user object now to support fetching shared lists by email
        const unsubscribeLists = storageService.subscribeToLists(user, (updatedLists) => {
          setLists(updatedLists);
          setInitializing(false);
        });
        
        // Cleanup list subscription on auth change or unmount
        return () => unsubscribeLists();
      } else {
        setLists([]);
        setInitializing(false);
        return undefined;
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // No more setInterval polling needed! Firebase handles push updates.

  const handleLoginSuccess = (user: User) => {
    // State handled by onAuthChange listener
  };

  const handleLogout = () => {
    storageService.logout();
    // State handled by onAuthChange listener
  };

  const handleSelectList = (listId: string) => {
    setSelectedListId(listId);
    setCurrentView(ViewState.LIST_DETAIL);
  };

  const handleBack = () => {
    setSelectedListId(null);
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleCreateList = (name: string) => {
    if (name && currentUser) {
      // Async fire and forget for UI, Firebase listener updates the list
      storageService.createList(name, currentUser);
    }
  };

  const handleEditList = (listId: string, newName: string, newIcon: string) => {
    if (newName) {
       storageService.updateListMetadata(listId, newName, newIcon);
       // Optimistic update (optional, but firebase is fast enough usually)
    }
  };

  const handleDeleteList = (listId: string) => {
    storageService.deleteList(listId);
    if (selectedListId === listId) {
        handleBack();
    }
  };

  const handleListUpdate = (updatedList: GroceryListType) => {
    // Send update to Firebase
    storageService.saveList(updatedList);
    // Note: We don't manually setLists here because the onSnapshot listener 
    // in the useEffect will fire immediately with the local change and update the state.
  };

  if (initializing) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Carregando...</div>;

  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedList = lists.find(l => l.id === selectedListId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={handleBack}
            >
                <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
                    <IconShoppingBag className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-slate-800 hidden sm:block">Lista de <span className="text-indigo-600">Compras</span></span>
            </div>

            <div className="flex items-center space-x-4">
               {/* User Profile */}
               <div className="flex items-center space-x-2 bg-slate-50 pl-1 pr-3 py-1 rounded-full border border-slate-100">
                    <div className="relative rounded-full w-8 h-8 flex items-center justify-center overflow-hidden">
                        <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-sm font-medium text-slate-600 hidden md:block max-w-[120px] truncate">{currentUser.name}</span>
               </div>

               <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 transition-colors p-2"
                title="Sair"
               >
                 <IconLogout className="w-5 h-5" />
               </button>
            </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-4 md:p-6">
        {currentView === ViewState.DASHBOARD && (
            <Dashboard 
                lists={lists} 
                currentUser={currentUser}
                onSelectKey={handleSelectList}
                onCreateList={handleCreateList}
                onEditList={handleEditList}
                onDeleteList={handleDeleteList}
            />
        )}

        {currentView === ViewState.LIST_DETAIL && selectedList && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[80vh]">
                <GroceryList 
                    list={selectedList}
                    onBack={handleBack}
                    onUpdate={handleListUpdate}
                />
            </div>
        )}
      </main>
    </div>
  );
};

export default App;