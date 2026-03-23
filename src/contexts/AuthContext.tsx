import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check if user exists in Firestore, if not create them
        const userRef = doc(db, 'users', currentUser.uid);
        const profileRef = doc(db, 'profiles', currentUser.uid);
        
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            const now = new Date().toISOString();
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              createdAt: now,
            });
            
            await setDoc(profileRef, {
              uid: currentUser.uid,
              fullName: currentUser.displayName || '',
              avatarUrl: currentUser.photoURL || '',
              createdAt: now,
              updatedAt: now,
            });
          }
        } catch (error) {
          console.error("Error creating user profile:", error);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
