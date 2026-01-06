
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
    arrayUnion,
    arrayRemove
  } from 'firebase/firestore';
  import { auth, db } from './firebase';
  import { GroceryList, User, Contact } from '../types';
  
  const mapUser = (fbUser: FirebaseUser): User => {
      const seed = fbUser.displayName || fbUser.email || 'User';
      return {
          id: fbUser.uid,
          name: fbUser.displayName || 'Usuário',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`,
          color: 'bg-indigo-500' 
      };
  };
  
  export const onAuthChange = (callback: (user: User | null) => void) => {
      return onAuthStateChanged(auth, (user) => {
          if (user) {
              callback(mapUser(user));
          } else {
              callback(null);
          }
      });
  };
  
  export const login = async (email: string, password: string): Promise<User> => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return mapUser(userCredential.user);
  };
  
  export const register = async (name: string, email: string, password: string): Promise<User> => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
      });
      return mapUser(userCredential.user);
  };
  
  export const logout = async (): Promise<void> => {
      await signOut(auth);
  };
  
  export const resetPassword = async (email: string): Promise<boolean> => {
     return true;
  }

  export const updateUserProfileName = async (name: string): Promise<void> => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
            displayName: name,
            photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
        });
    }
  };

  export const updateUserPassword = async (newPassword: string): Promise<void> => {
    if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
    }
  };
  
  export const subscribeToLists = (user: User, onUpdate: (lists: GroceryList[]) => void) => {
      const ownedLists: GroceryList[] = [];
      const sharedLists: GroceryList[] = [];
      
      const pushUpdates = () => {
          const combined = [...ownedLists, ...sharedLists];
          const uniqueLists = Array.from(new Map(combined.map(item => [item.id, item])).values());
          
          uniqueLists.sort((a, b) => {
              const orderA = a.order ?? a.createdAt ?? 0;
              const orderB = b.order ?? b.createdAt ?? 0;
              return orderA - orderB;
          });
          onUpdate(uniqueLists);
      };

      const qOwned = query(collection(db, 'lists'), where('userId', '==', user.id));
      const unsubOwned = onSnapshot(qOwned, (snapshot) => {
          ownedLists.length = 0;
          snapshot.forEach((doc) => {
              const data = doc.data();
              ownedLists.push({
                  id: doc.id,
                  name: data.name,
                  userId: data.userId,
                  ownerName: data.ownerName,
                  sharedWith: data.sharedWith || [],
                  webhookUrl: data.webhookUrl || '',
                  contactName: data.contactName || '',
                  contactPhone: data.contactPhone || '',
                  contacts: data.contacts || [],
                  color: data.color || 'bg-blue-100',
                  icon: data.icon || '📝',
                  items: data.items || [],
                  order: data.order,
                  createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
              });
          });
          pushUpdates();
      });

      let unsubShared = () => {};
      if (user.email) {
          const qShared = query(collection(db, 'lists'), where('sharedWith', 'array-contains', user.email));
          unsubShared = onSnapshot(qShared, (snapshot) => {
              sharedLists.length = 0;
              snapshot.forEach((doc) => {
                  const data = doc.data();
                  sharedLists.push({
                      id: doc.id,
                      name: data.name,
                      userId: data.userId,
                      ownerName: data.ownerName,
                      sharedWith: data.sharedWith || [],
                      webhookUrl: data.webhookUrl || '',
                      contactName: data.contactName || '',
                      contactPhone: data.contactPhone || '',
                      contacts: data.contacts || [],
                      color: data.color || 'bg-indigo-100',
                      icon: data.icon || '📝',
                      items: data.items || [],
                      order: data.order,
                      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
                  });
              });
              pushUpdates();
          });
      }
  
      return () => {
          unsubOwned();
          unsubShared();
      };
  };
  
  export const createList = async (name: string, icon: string, user: User): Promise<void> => {
      await addDoc(collection(db, 'lists'), {
          name,
          userId: user.id,
          ownerName: user.name,
          sharedWith: [],
          color: 'bg-blue-100',
          icon: icon || '📝',
          items: [],
          order: Date.now(),
          createdAt: serverTimestamp()
      });
  };
  
  export const saveList = async (updatedList: GroceryList): Promise<void> => {
      const listRef = doc(db, 'lists', updatedList.id);
      await updateDoc(listRef, {
          name: updatedList.name,
          icon: updatedList.icon,
          items: updatedList.items,
          webhookUrl: updatedList.webhookUrl || '',
          contactName: updatedList.contactName || '',
          contactPhone: updatedList.contactPhone || ''
      });
  };

  export const updateListOrder = async (listId: string, newOrder: number): Promise<void> => {
      const listRef = doc(db, 'lists', listId);
      await updateDoc(listRef, {
          order: newOrder
      });
  };
  
  export const updateListMetadata = async (listId: string, name: string, icon?: string, webhookUrl?: string, contactName?: string, contactPhone?: string): Promise<void> => {
      const listRef = doc(db, 'lists', listId);
      const updates: any = { name };
      if (icon) updates.icon = icon;
      if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl;
      if (contactName !== undefined) updates.contactName = contactName;
      if (contactPhone !== undefined) updates.contactPhone = contactPhone;
      await updateDoc(listRef, updates);
  };
  
  export const deleteList = async (listId: string): Promise<void> => {
      await deleteDoc(doc(db, 'lists', listId));
  };
  
  export const shareList = async (listId: string, email: string): Promise<void> => {
      const listRef = doc(db, 'lists', listId);
      await updateDoc(listRef, {
          sharedWith: arrayUnion(email)
      });
  };

  export const unshareList = async (listId: string, email: string): Promise<void> => {
      const listRef = doc(db, 'lists', listId);
      await updateDoc(listRef, {
          sharedWith: arrayRemove(email)
      });
  };
  
  export const getCurrentUser = (): User | null => {
      const u = auth.currentUser;
      return u ? mapUser(u) : null;
  };
