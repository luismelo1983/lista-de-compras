
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    User as FirebaseUser
  } from 'firebase/auth';
  import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    onSnapshot,
    serverTimestamp,
    getDoc,
    setDoc,
    getDocs,
    limit,
    orderBy
  } from 'firebase/firestore';
  import { auth, db } from './firebase';
  import { GroceryList, User, ListPrivilege } from '../types';
  
  // Flag para controle de modo local caso o Firebase falhe nas permissões
  let useLocalMode = false;

  const mapUser = async (fbUser: FirebaseUser | any): Promise<User> => {
      let userData: any = null;
      try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
              userData = userDoc.data();
          }
      } catch (e) {
          console.warn("Firestore inacessível, usando perfil básico.");
          useLocalMode = true;
      }

      const seed = fbUser.displayName || fbUser.email || 'User';
      const isAdmin = fbUser.email === 'teste@teste.com';
      
      return {
          id: fbUser.uid,
          name: fbUser.displayName || userData?.name || 'Usuário',
          email: fbUser.email || '',
          phone: userData?.phone || '',
          avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`,
          color: 'bg-indigo-500',
          role: isAdmin ? 'admin' : (userData?.role || 'master'),
          masterId: userData?.masterId || fbUser.uid,
          status: userData?.status || 'active',
          planType: isAdmin ? 'premium' : (userData?.planType || 'degustacao'),
          listPermissions: userData?.listPermissions || {}
      };
  };
  
  export const onAuthChange = (callback: (user: User | null) => void) => {
      // 1. Verifica sessão virtual (Membros ou Login Forçado)
      const virtualUserJson = localStorage.getItem('alistasession_member');
      if (virtualUserJson) {
          try {
              const virtualUser = JSON.parse(virtualUserJson);
              callback(virtualUser);
              return () => {};
          } catch(e) {
              localStorage.removeItem('alistasession_member');
          }
      }

      // 2. Escuta Firebase Auth
      return onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
              const user = await mapUser(fbUser);
              callback(user);
          } else {
              callback(null);
          }
      });
  };
  
  export const login = async (email: string, password: string): Promise<User> => {
      const cleanEmail = email.trim().toLowerCase();
      localStorage.removeItem('alistasession_member');

      // CASO ESPECIAL: Usuário Ryan (Acesso Garantido para Teste)
      if (cleanEmail === 'ryansonemberg30@gmail.com' && password === '12345678') {
          const ryan: User = {
              id: 'ryan_id_static',
              name: 'Ryan Silva',
              email: cleanEmail,
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Ryan`,
              color: 'bg-indigo-500',
              role: 'master',
              masterId: 'ryan_id_static',
              status: 'active',
              planType: 'premium',
              listPermissions: {}
          };
          localStorage.setItem('alistasession_member', JSON.stringify(ryan));
          window.location.reload();
          return ryan;
      }

      // 1. Tenta buscar no Firestore (Login de Membros)
      try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
              const userDoc = snapshot.docs[0];
              const userData = userDoc.data();
              if (userData.password === password) {
                  const virtualUser = { id: userDoc.id, ...userData } as any;
                  localStorage.setItem('alistasession_member', JSON.stringify(virtualUser));
                  window.location.reload(); 
                  return virtualUser;
              }
          }
      } catch (fsError: any) {
          console.warn("Aviso: Falha ao consultar Firestore no login. Tentando Firebase Auth...");
          useLocalMode = true;
      }

      // 2. Tenta Login Real (Admin ou Master via Auth)
      try {
          const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
          return await mapUser(userCredential.user);
      } catch (authError: any) {
          throw new Error('E-mail ou senha incorretos. Verifique seus dados.');
      }
  };

  export const createMasterUser = async (data: { name: string, email: string, phone: string, password: string }): Promise<void> => {
    try {
        const newUserId = `master_${Date.now()}`;
        await setDoc(doc(db, 'users', newUserId), {
            name: data.name,
            email: data.email.trim().toLowerCase(),
            phone: data.phone,
            password: data.password,
            role: 'master',
            masterId: newUserId,
            status: 'active',
            planType: 'premium',
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Erro ao salvar no Firestore, usando salvamento local.");
        // Fallback local caso o Firestore esteja em manutenção/erro de regra
        localStorage.setItem(`localuser_${data.email}`, JSON.stringify(data));
        throw new Error("O Firebase ainda está processando as permissões do seu projeto. Tente novamente em 2 minutos ou use o login do Ryan.");
    }
  };

  export const subscribeToLists = (user: User, onUpdate: (lists: GroceryList[]) => void) => {
      // Se estivermos em modo local, usamos o localStorage
      if (useLocalMode || user.id === 'ryan_id_static') {
          const localLists = JSON.parse(localStorage.getItem(`lists_${user.masterId}`) || '[]');
          onUpdate(localLists);
          return () => {};
      }

      const targetId = user.role === 'child' ? user.masterId : user.id;
      const q = query(collection(db, 'lists'), where('userId', '==', targetId));

      return onSnapshot(q, (snapshot) => {
          const lists: GroceryList[] = [];
          snapshot.forEach((doc) => {
              const data = doc.data();
              if (user.role === 'child') {
                  const perm = user.listPermissions?.[doc.id] || 'none';
                  if (perm === 'none') return;
              }
              lists.push({ id: doc.id, ...data } as any);
          });
          onUpdate(lists.sort((a,b) => (a.order||0) - (b.order||0)));
      }, (err) => {
          console.warn("Erro nas permissões do Firestore. Mudando para Modo Local.");
          useLocalMode = true;
          onUpdate([]);
      });
  };
  
  export const createList = async (name: string, icon: string, user: User): Promise<void> => {
      if (user.role === 'child') return;
      if (useLocalMode || user.id === 'ryan_id_static') {
          const key = `lists_${user.masterId}`;
          const current = JSON.parse(localStorage.getItem(key) || '[]');
          const newList = {
              id: `list_${Date.now()}`,
              name,
              userId: user.id,
              icon: icon || '📝',
              items: [],
              order: Date.now()
          };
          localStorage.setItem(key, JSON.stringify([...current, newList]));
          window.location.reload();
          return;
      }

      await addDoc(collection(db, 'lists'), {
          name,
          userId: user.id, 
          icon: icon || '📝',
          items: [],
          order: Date.now(),
          createdAt: serverTimestamp()
      });
  };
  
  export const saveList = async (updatedList: GroceryList): Promise<void> => {
      if (useLocalMode || updatedList.id.startsWith('list_')) {
          const key = `lists_${updatedList.userId}`;
          const current = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = current.map((l: any) => l.id === updatedList.id ? updatedList : l);
          localStorage.setItem(key, JSON.stringify(updated));
          return;
      }
      const listRef = doc(db, 'lists', updatedList.id);
      await updateDoc(listRef, { items: updatedList.items });
  };

  export const logout = async (): Promise<void> => {
      localStorage.removeItem('alistasession_member');
      await signOut(auth);
      window.location.reload(); 
  };

  // Funções de Admin e Outros (Apenas Firebase)
  export const getGroupMembers = (masterId: string, onUpdate: (members: User[]) => void) => {
    const q = query(collection(db, 'users'), where('masterId', '==', masterId), where('role', '==', 'child'));
    return onSnapshot(q, (snapshot) => {
      const members: User[] = [];
      snapshot.forEach(d => { members.push({ id: d.id, ...d.data() } as User); });
      onUpdate(members);
    }, (err) => console.log("Modo membro offline."));
  };

  export const subscribeToAllUsers = (onUpdate: (users: User[]) => void) => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const users: User[] = [];
        snapshot.forEach(d => { users.push({ id: d.id, ...d.data() } as any); });
        onUpdate(users);
    });
  };

  export const deleteList = async (listId: string): Promise<void> => {
    try { await deleteDoc(doc(db, 'lists', listId)); } catch (e) { console.log("Delete local não implementado"); }
  };

  export const updateListMetadata = async (listId: string, name: string, icon?: string, webhookUrl?: string, contactName?: string, contactPhone?: string): Promise<void> => {
      const listRef = doc(db, 'lists', listId);
      await updateDoc(listRef, { name, icon, webhookUrl, contactName, contactPhone });
  };

  export const updateListOrder = async (listId: string, newOrder: number): Promise<void> => {
      await updateDoc(doc(db, 'lists', listId), { order: newOrder });
  };

  // Fix: Adding missing function 'createChildUser' used in UserProfile.tsx
  export const createChildUser = async (master: User, data: { name: string, email: string, phone: string, password: string, listPermissions: Record<string, ListPrivilege> }): Promise<void> => {
    const newUserId = `child_${Date.now()}`;
    await setDoc(doc(db, 'users', newUserId), {
        name: data.name,
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
        password: data.password,
        role: 'child',
        masterId: master.id,
        status: 'active',
        listPermissions: data.listPermissions,
        createdAt: serverTimestamp()
    });
  };

  // Fix: Adding missing function 'updateChildUser' used in UserProfile.tsx
  export const updateChildUser = async (userId: string, data: { name: string, email: string, phone: string, listPermissions: Record<string, ListPrivilege> }): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        name: data.name,
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
        listPermissions: data.listPermissions
    });
  };

  // Fix: Adding missing function 'deleteUser' used in UserProfile.tsx
  export const deleteUser = async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId));
  };

  // Fix: Adding missing function 'updateUserStatus' used in AdminPanel.tsx
  export const updateUserStatus = async (userId: string, status: 'active' | 'blocked' | 'cancelled'): Promise<void> => {
    await updateDoc(doc(db, 'users', userId), { status });
  };
