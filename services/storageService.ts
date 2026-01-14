
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
  import { GroceryList, User, ListPrivilege } from '../types';
  
  const mapUser = async (fbUser: FirebaseUser): Promise<User> => {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      const userData = userDoc.data();
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
          expiresAt: isAdmin ? undefined : (userData?.expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000)),
          listPermissions: userData?.listPermissions || {}
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
      const user = await mapUser(userCredential.user);
      // Sincroniza dados extras se necessário
      return user;
  };

  export const registerMaster = async (name: string, email: string, password: string, plan: any): Promise<void> => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
      });

      await setDoc(doc(db, 'users', uid), {
          name,
          email,
          role: 'master',
          masterId: uid,
          status: 'active',
          planType: plan.type,
          expiresAt: plan.expiresAt,
          paymentSource: plan.source,
          createdAt: serverTimestamp()
      });
  };

  export const createChildUser = async (masterUser: User, childData: { name: string, email: string, phone: string, password: string, listPermissions: Record<string, ListPrivilege> }): Promise<void> => {
    // Nota: Firebase Client SDK não permite criar outro usuário sem deslogar. 
    // Em produção real, isso usaria Firebase Admin SDK / Cloud Functions.
    // Simulamos salvando no Firestore. O usuário usará esse email/pass no login.
    const tempId = `user_${Date.now()}`; 
    await setDoc(doc(db, 'users', tempId), {
        name: childData.name,
        email: childData.email,
        phone: childData.phone,
        role: 'child',
        masterId: masterUser.id,
        status: 'active',
        listPermissions: childData.listPermissions,
        createdAt: serverTimestamp()
    });
    alert("Dados do membro salvos. Em um sistema real, a conta de autenticação seria gerada via API.");
  };

  export const getAllUsersForAdmin = async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    snapshot.forEach(d => {
        const data = d.data();
        users.push({ 
            id: d.id, 
            ...data, 
            name: data.name || 'Sem nome',
            email: data.email || 'Sem email'
        } as any);
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
      const q = user.role === 'child' 
        ? query(collection(db, 'lists'), where('userId', '==', user.masterId))
        : query(collection(db, 'lists'), where('userId', '==', user.id));

      return onSnapshot(q, (snapshot) => {
          const lists: GroceryList[] = [];
          snapshot.forEach((doc) => {
              const data = doc.data();
              // Se for child, só vê se tiver permissão != 'none'
              if (user.role === 'child') {
                  const perm = user.listPermissions?.[doc.id] || 'none';
                  if (perm === 'none') return;
              }

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
      const updateData: any = { name };
      if (icon) updateData.icon = icon;
      if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
      if (contactName !== undefined) updateData.contactName = contactName;
      if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
      
      await updateDoc(listRef, updateData);
  };
  
  export const deleteList = async (listId: string): Promise<void> => {
      await deleteDoc(doc(db, 'lists', listId));
  };

  export const updateListOrder = async (listId: string, newOrder: number): Promise<void> => {
      await updateDoc(doc(db, 'lists', listId), { order: newOrder });
  };
