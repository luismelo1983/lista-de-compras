
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    updateProfile, 
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
    limit
  } from 'firebase/firestore';
  import { auth, db } from './firebase';
  import { GroceryList, User, ListPrivilege } from '../types';
  
  const mapUser = async (fbUser: FirebaseUser | any, isVirtual = false): Promise<User> => {
      if (isVirtual) return fbUser;

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
      try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          return await mapUser(userCredential.user);
      } catch (authError) {
          const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()), limit(1));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
              const userDoc = snapshot.docs[0];
              const userData = userDoc.data();
              
              if (userData.password === password) {
                  const virtualUser: User = {
                      id: userDoc.id,
                      name: userData.name,
                      email: userData.email,
                      phone: userData.phone,
                      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name}`,
                      color: 'bg-indigo-500',
                      role: userData.role || 'child',
                      masterId: userData.masterId,
                      status: userData.status || 'active',
                      planType: 'premium',
                      listPermissions: userData.listPermissions || {}
                  };
                  localStorage.setItem('alistasession_member', JSON.stringify(virtualUser));
                  window.location.reload(); 
                  return virtualUser;
              }
          }
          throw new Error('E-mail ou senha inválidos.');
      }
  };

  export const createMasterUser = async (data: { name: string, email: string, phone: string, password: string }): Promise<void> => {
    // Admin cria um master manual (virtual para protótipo)
    const newUserId = `master_${Date.now()}`;
    await setDoc(doc(db, 'users', newUserId), {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        password: data.password,
        role: 'master',
        masterId: newUserId,
        status: 'active',
        planType: 'premium',
        createdAt: serverTimestamp()
    });
  };

  export const createChildUser = async (masterUser: User, childData: { name: string, email: string, phone: string, password: string, listPermissions: Record<string, ListPrivilege> }): Promise<void> => {
    const newUserId = `member_${Date.now()}`; 
    await setDoc(doc(db, 'users', newUserId), {
        name: childData.name,
        email: childData.email.toLowerCase(),
        phone: childData.phone,
        password: childData.password, 
        role: 'child',
        masterId: masterUser.id,
        status: 'active',
        listPermissions: childData.listPermissions,
        createdAt: serverTimestamp()
    });
  };

  export const updateChildUser = async (userId: string, data: Partial<User>): Promise<void> => {
    await updateDoc(doc(db, 'users', userId), data);
  };

  export const deleteUser = async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId));
  };

  export const getGroupMembers = (masterId: string, onUpdate: (members: User[]) => void) => {
    const q = query(collection(db, 'users'), where('masterId', '==', masterId), where('role', '==', 'child'));
    return onSnapshot(q, (snapshot) => {
      const members: User[] = [];
      snapshot.forEach(d => {
        members.push({ id: d.id, ...d.data() } as User);
      });
      onUpdate(members);
    });
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
      localStorage.removeItem('alistasession_member');
      await signOut(auth);
      window.location.reload(); 
  };
  
  export const subscribeToLists = (user: User, onUpdate: (lists: GroceryList[]) => void) => {
      const q = query(collection(db, 'lists'), where('userId', '==', user.masterId));

      return onSnapshot(q, (snapshot) => {
          const lists: GroceryList[] = [];
          snapshot.forEach((doc) => {
              const data = doc.data();
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
