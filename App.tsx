import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import GroceryList from './components/GroceryList';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
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
        const unsubscribeLists = storageService.subscribeToLists(user, (updatedLists) => {
          setLists(updatedLists);
          setInitializing(false);
        });
        
        return () => unsubscribeLists();
      } else {
        setLists([]);
        setInitializing(false);
        return undefined;
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Android Back Button Logic (History API)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        // If we hit back and we are in LIST_DETAIL or PROFILE, go back to DASHBOARD
        if (currentView !== ViewState.DASHBOARD) {
            setCurrentView(ViewState.DASHBOARD);
            setSelectedListId(null);
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  const handleLoginSuccess = (user: User) => {
    // State handled by onAuthChange listener
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentView(ViewState.DASHBOARD);
  };

  const navigateTo = (view: ViewState, listId: string | null = null) => {
      // Push state to history so back button works
      window.history.pushState({ view }, '', '#view=' + view);
      setCurrentView(view);
      setSelectedListId(listId);
  };

  const handleSelectList = (listId: string) => {
    navigateTo(ViewState.LIST_DETAIL, listId);
  };

  const handleOpenProfile = () => {
      navigateTo(ViewState.PROFILE);
  };

  const handleBack = () => {
    // If we have history, go back (triggering popstate), otherwise manual force
    if (window.history.state) {
        window.history.back();
    } else {
        setCurrentView(ViewState.DASHBOARD);
        setSelectedListId(null);
    }
  };

  const handleCreateList = (name: string, icon: string) => {
    if (name && currentUser) {
      storageService.createList(name, icon, currentUser);
    }
  };

  const handleEditList = (listId: string, newName: string, newIcon: string, newWebhookUrl: string) => {
    if (newName) {
       storageService.updateListMetadata(listId, newName, newIcon, newWebhookUrl);
    }
  };

  const handleDeleteList = (listId: string) => {
    storageService.deleteList(listId);
    if (selectedListId === listId) {
        handleBack();
    }
  };
  
  const handleMoveList = (listId: string, direction: 'up' | 'down') => {
      const index = lists.findIndex(l => l.id === listId);
      if (index === -1) return;
      
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= lists.length) return;
      
      const listA = lists[index];
      const listB = lists[targetIndex];
      
      // We need to swap the 'order' fields. 
      // If 'order' is missing on legacy items, default to createdAt or Date.now() to establish a baseline
      const orderA = listA.order ?? (listA.createdAt || Date.now());
      const orderB = listB.order ?? (listB.createdAt || Date.now());
      
      // If orders happen to be identical, artificially offset them so the swap works effectively
      let newOrderA = orderB;
      let newOrderB = orderA;
      
      if (newOrderA === newOrderB) {
          if (direction === 'up') {
             newOrderA = newOrderB - 100;
          } else {
             newOrderA = newOrderB + 100; 
          }
      }
      
      storageService.updateListOrder(listA.id, newOrderA);
      storageService.updateListOrder(listB.id, newOrderB);
  };

  const handleListUpdate = (updatedList: GroceryListType) => {
    storageService.saveList(updatedList);
  };

  if (initializing) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">Carregando...</div>;

  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedList = lists.find(l => l.id === selectedListId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Top Navigation Bar Reduced */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-3 h-14 flex items-center justify-between">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => {
                  if (currentView !== ViewState.DASHBOARD) handleBack();
              }}
            >
                <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-md shadow-indigo-200">
                    <IconShoppingBag className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-lg tracking-tight text-slate-800 hidden sm:block">Lista de <span className="text-indigo-600">Compras</span></span>
            </div>

            <div className="flex items-center space-x-3">
               {/* User Profile Trigger */}
               <button 
                onClick={handleOpenProfile}
                className="flex items-center space-x-2 bg-slate-50 pl-1 pr-2 py-1 rounded-full border border-slate-100 hover:bg-slate-100 transition-colors"
               >
                    <div className="relative rounded-full w-7 h-7 flex items-center justify-center overflow-hidden">
                        <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-600 hidden md:block max-w-[100px] truncate">{currentUser.name}</span>
               </button>

               <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5"
                title="Sair"
               >
                 <IconLogout className="w-4 h-4" />
               </button>
            </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-3 md:p-5 h-[calc(100vh-3.5rem)]">
        {currentView === ViewState.DASHBOARD && (
            <Dashboard 
                lists={lists} 
                currentUser={currentUser}
                onSelectKey={handleSelectList}
                onCreateList={handleCreateList}
                onEditList={handleEditList}
                onDeleteList={handleDeleteList}
                onMoveList={handleMoveList}
            />
        )}

        {currentView === ViewState.LIST_DETAIL && selectedList && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden h-full">
                <GroceryList 
                    list={selectedList}
                    currentUser={currentUser}
                    onBack={handleBack}
                    onUpdate={handleListUpdate}
                />
            </div>
        )}

        {currentView === ViewState.PROFILE && (
            <UserProfile 
                user={currentUser}
                onBack={handleBack}
            />
        )}
      </main>
    </div>
  );
};

export default App;