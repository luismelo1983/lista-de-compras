
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    updateProfile, 
    updatePassword,
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
    getDocs
  } from 'firebase/firestore';
  import { auth, db } from './firebase';
  import { GroceryList, User, UserRole, ChildPrivilege } from '../types';
  
  const mapUser = async (fbUser: FirebaseUser): Promise<User> => {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      const userData = userDoc.data();
      const seed = fbUser.displayName || fbUser.email || 'User';

      // Admin padrão
      const isAdmin = fbUser.email === 'teste@teste.com';
      
      return {
          id: fbUser.uid,
          name: fbUser.displayName || 'Usuário',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`,
          color: 'bg-indigo-500',
          role: isAdmin ? 'admin' : (userData?.role || 'master'),
          masterId: userData?.masterId || fbUser.uid,
          status: userData?.status || 'active',
          planType: userData?.planType || 'degustacao',
          expiresAt: userData?.expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000),
          privilege: userData?.privilege,
          allowedLists: userData?.allowedLists || []
      };
  };
  
  export const onAuthChange = (callback: (user: User | null) => void) => {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await mapUser(userCredential.user);
  };

  // Cadastro removido da UI pública, mas mantido para fluxos automáticos/ADM
  export const registerMaster = async (name: string, email: string, password: string, plan: any): Promise<void> => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
      });

      await setDoc(doc(db, 'users', uid), {
          role: 'master',
          masterId: uid,
          status: 'active',
          planType: plan.type,
          expiresAt: plan.expiresAt,
          paymentSource: plan.source,
          createdAt: serverTimestamp()
      });
  };

  export const createChildUser = async (masterUser: User, childData: { name: string, email: string, password: string, privilege: ChildPrivilege, allowedLists: string[] }): Promise<void> => {
    // Nota: Firebase Client SDK não permite criar outro usuário sem deslogar o atual.
    // Em um SaaS real, isso seria feito via Cloud Function (Admin SDK).
    // Aqui simularemos criando o registro na coleção 'users'. 
    // O usuário precisará fazer o primeiro login para ativar o Auth se usarmos Email/Pass.
    // Para simplificar o protótipo, vamos criar o registro de metadados.
    
    // ATENÇÃO: Em produção, use Firebase Admin SDK em uma Cloud Function.
    alert("Funcionalidade de criação de filhos requer Cloud Functions em produção. Os dados foram salvos no Firestore.");
    
    const tempId = `child_${Date.now()}`;
    await setDoc(doc(db, 'users', tempId), {
        name: childData.name,
        email: childData.email,
        role: 'child',
        masterId: masterUser.id,
        status: 'active',
        privilege: childData.privilege,
        allowedLists: childData.allowedLists,
        createdAt: serverTimestamp()
    });
  };

  export const getAllUsersForAdmin = async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    snapshot.forEach(d => {
        const data = d.data();
        users.push({ id: d.id, ...data } as any);
    });
    return users;
  };

  export const updateUserStatus = async (userId: string, status: 'active' | 'blocked' | 'cancelled'): Promise<void> => {
    await updateDoc(doc(db, 'users', userId), { status });
  };
  
  export const logout = async (): Promise<void> => {
      await signOut(auth);
  };
  
  export const subscribeToLists = (user: User, onUpdate: (lists: GroceryList[]) => void) => {
      // Regra: Master vê suas listas. Filho vê apenas as 'allowedLists'.
      const q = user.role === 'child' 
        ? query(collection(db, 'lists'), where('userId', '==', user.masterId))
        : query(collection(db, 'lists'), where('userId', '==', user.id));

      return onSnapshot(q, (snapshot) => {
          const lists: GroceryList[] = [];
          snapshot.forEach((doc) => {
              const data = doc.data();
              // Filtro de visibilidade para Filhos
              if (user.role === 'child' && !user.allowedLists?.includes(doc.id)) return;

              lists.push({
                  id: doc.id,
                  name: data.name,
                  userId: data.userId,
                  items: data.items || [],
                  icon: data.icon || '📝',
                  order: data.order,
                  webhookUrl: data.webhookUrl,
                  contactName: data.contactName,
                  contactPhone: data.contactPhone
              } as any);
          });
          onUpdate(lists.sort((a,b) => (a.order||0) - (b.order||0)));
      });
  };
  
  export const createList = async (name: string, icon: string, user: User): Promise<void> => {
      if (user.role === 'child') return;
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
      const listRef = doc(db, 'lists', updatedList.id);
      await updateDoc(listRef, {
          items: updatedList.items
      });
  };

  export const updateListMetadata = async (listId: string, name: string, icon?: string, webhookUrl?: string, contactName?: string, contactPhone?: string): Promise<void> => {
      const listRef = doc(db, 'lists', listId);
      await updateDoc(listRef, { name, icon, webhookUrl, contactName, contactPhone });
  };
  
  export const deleteList = async (listId: string): Promise<void> => {
      await deleteDoc(doc(db, 'lists', listId));
  };

  export const updateListOrder = async (listId: string, newOrder: number): Promise<void> => {
      await updateDoc(doc(db, 'lists', listId), { order: newOrder });
  };

  export const updateUserProfileName = async (name: string): Promise<void> => {
    if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
  };

  export const updateUserPassword = async (newPassword: string): Promise<void> => {
    if (auth.currentUser) await updatePassword(auth.currentUser, newPassword);
  };
