
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import GroceryList from './components/GroceryList';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import * as storageService from './services/storageService';
import { User, GroceryList as GroceryListType, ViewState, Contact } from './types';
import { IconShoppingBag, IconLogout } from './components/Icons';

const APP_VERSION = "0.4.3"; 

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lists, setLists] = useState<GroceryListType[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = storageService.onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        const unsubscribeLists = storageService.subscribeToLists(user, (updatedLists) => {
          setLists(updatedLists);
          setInitializing(false);
        });
        return () => unsubscribeLists();
      } else {
        setLists([]);
        setInitializing(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // PWA: Detecção de nova versão
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const checkUpdate = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
          if (registration.waiting) {
            setNewVersionAvailable(true);
          }
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNewVersionAvailable(true);
                }
              };
            }
          };
        }
      };
      checkUpdate();
      const interval = setInterval(checkUpdate, 60000); 
      return () => clearInterval(interval);
    }
  }, []);

  const navigateTo = (view: ViewState, listId: string | null = null) => {
      window.history.pushState({ view }, '', '#view=' + view);
      setCurrentView(view);
      setSelectedListId(listId);
  };

  const handleBack = () => {
    if (window.history.state) window.history.back();
    else {
        setCurrentView(ViewState.DASHBOARD);
        setSelectedListId(null);
    }
  };

  const handleMoveList = (listId: string, direction: 'up' | 'down') => {
      const index = lists.findIndex(l => l.id === listId);
      if (index === -1) return;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= lists.length) return;
      
      const listA = lists[index];
      const listB = lists[targetIndex];
      const orderA = listA.order ?? (listA.createdAt || Date.now());
      const orderB = listB.order ?? (listB.createdAt || Date.now());
      
      storageService.updateListOrder(listA.id, orderB);
      storageService.updateListOrder(listB.id, orderA);
  };

  const forceRefresh = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
        window.location.href = window.location.origin + '?v=' + Date.now();
      });
    } else {
      window.location.reload();
    }
  };

  if (initializing) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">Iniciando...</div>;
  if (!currentUser) return <Auth onLoginSuccess={() => {}} />;

  const selectedList = lists.find(l => l.id === selectedListId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {newVersionAvailable && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600 text-white p-3 text-center text-[10px] font-black flex items-center justify-center gap-4 shadow-xl border-b border-white/20 uppercase tracking-tighter">
              🚀 Nova versão disponível!
              <button onClick={forceRefresh} className="bg-white text-indigo-600 px-4 py-1.5 rounded-full shadow-lg font-black active:scale-95 transition-all">ATUALIZAR</button>
          </div>
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-3 h-14 flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo(ViewState.DASHBOARD)}>
                <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-md shadow-indigo-100"><IconShoppingBag className="w-4 h-4" /></div>
                <span className="font-extrabold text-lg tracking-tight text-slate-800">Lista</span>
            </div>

            <div className="flex items-center space-x-3">
               <button onClick={() => navigateTo(ViewState.PROFILE)} className="flex items-center space-x-2 bg-slate-50 pl-1 pr-2 py-1 rounded-full border border-slate-100 active:bg-slate-100 transition-colors">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover shadow-sm"/>
                    <span className="text-xs font-bold text-slate-600 hidden md:block">{currentUser.name}</span>
               </button>
               <button onClick={() => storageService.logout()} className="text-slate-400 p-1.5 hover:text-red-500 transition-colors"><IconLogout className="w-4 h-4" /></button>
            </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-3 h-[calc(100vh-3.5rem)] relative">
        {currentView === ViewState.DASHBOARD && (
            <Dashboard 
                lists={lists} currentUser={currentUser}
                onSelectKey={(id) => navigateTo(ViewState.LIST_DETAIL, id)}
                onCreateList={(name, icon) => storageService.createList(name, icon, currentUser)} 
                onEditList={storageService.updateListMetadata}
                onDeleteList={storageService.deleteList} onMoveList={handleMoveList}
            />
        )}
        {currentView === ViewState.LIST_DETAIL && selectedList && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden h-full">
                <GroceryList list={selectedList} currentUser={currentUser} onBack={handleBack} onUpdate={storageService.saveList} />
            </div>
        )}
        {currentView === ViewState.PROFILE && <UserProfile user={currentUser} onBack={handleBack} />}
        
        <div className="absolute bottom-4 left-0 right-0 text-center opacity-30 text-[9px] pointer-events-none uppercase font-bold tracking-widest">
            v{APP_VERSION}
        </div>
      </main>
    </div>
  );
};

export default App;
