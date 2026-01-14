
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import GroceryList from './components/GroceryList';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import SalesPage from './components/SalesPage';
import AdminPanel from './components/AdminPanel';
import * as storageService from './services/storageService';
import { User, GroceryList as GroceryListType, ViewState } from './types';
import { IconLogo, IconLogout } from './components/Icons';

const APP_VERSION = "1.3.0"; 

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lists, setLists] = useState<GroceryListType[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

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

  const navigateTo = (view: ViewState, listId: string | null = null) => {
      setCurrentView(view);
      setSelectedListId(listId);
  };

  const handleBack = () => {
    setCurrentView(ViewState.DASHBOARD);
    setSelectedListId(null);
  };

  if (initializing) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Iniciando aLista...</div>;

  if (currentView === ViewState.SALES) return <SalesPage onBack={handleBack} />;

  if (!currentUser) return <Auth onLoginSuccess={() => {}} onNavigateSales={() => navigateTo(ViewState.SALES)} />;

  if (currentUser.status === 'blocked') return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 text-center">
        <div className="space-y-4 max-w-xs">
            <h1 className="text-2xl font-black text-red-600 uppercase">Acesso Bloqueado</h1>
            <p className="text-sm font-bold text-red-400">Entre em contato com o suporte ou regularize sua assinatura aLista.</p>
            <button onClick={() => storageService.logout()} className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase">Sair</button>
        </div>
    </div>
  );

  if (currentView === ViewState.ADMIN_PANEL && currentUser.role === 'admin') return <AdminPanel onBack={handleBack} />;

  const selectedList = lists.find(l => l.id === selectedListId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 h-14">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => navigateTo(ViewState.DASHBOARD)}>
                <IconLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
                <span className="font-black text-xl tracking-tighter text-slate-800">aLista</span>
            </div>

            <div className="flex items-center space-x-3">
               <button onClick={() => navigateTo(ViewState.PROFILE)} className="flex items-center space-x-2 bg-slate-50 pl-1 pr-2 py-1 rounded-full border border-slate-100 hover:border-slate-300 transition-all">
                    <img src={currentUser.avatar} alt="" className="w-7 h-7 rounded-full object-cover"/>
                    <span className="text-xs font-bold text-slate-600 hidden md:block">{currentUser.name.split(' ')[0]}</span>
               </button>
               <button onClick={() => storageService.logout()} className="text-slate-400 p-1.5 hover:text-red-500"><IconLogout className="w-4 h-4" /></button>
            </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-4 relative h-[calc(100vh-3.5rem)] overflow-y-auto">
        {currentView === ViewState.DASHBOARD && (
            <Dashboard 
                lists={lists} currentUser={currentUser}
                onSelectKey={(id) => navigateTo(ViewState.LIST_DETAIL, id)}
                onCreateList={(name, icon) => storageService.createList(name, icon, currentUser)} 
                onEditList={storageService.updateListMetadata}
                onDeleteList={storageService.deleteList}
                onMoveList={storageService.updateListOrder}
                onNavigateAdmin={() => navigateTo(ViewState.ADMIN_PANEL)}
            />
        )}
        {currentView === ViewState.LIST_DETAIL && selectedList && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden h-full">
                <GroceryList list={selectedList} currentUser={currentUser} onBack={handleBack} onUpdate={storageService.saveList} />
            </div>
        )}
        {currentView === ViewState.PROFILE && <UserProfile user={currentUser} lists={lists} onBack={handleBack} />}
        
        <div className="py-8 text-center flex flex-col items-center opacity-30 mt-auto">
            <span className="text-[9px] font-black uppercase tracking-widest">v{APP_VERSION} • aLista SaaS Edition</span>
        </div>
      </main>
    </div>
  );
};

export default App;
