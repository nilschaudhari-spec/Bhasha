import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface UserProfile {
  email: string;
  displayName: string;
  xp: number;
  weeklyXp: number;
  streak: number;
  lastActiveDate: string;
  coins: number;
  dailyGoal: number;
  createdAt: number;
  updatedAt: number;
  completedLessons?: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, refreshProfile: async () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          email: auth.currentUser?.email || '',
          displayName: auth.currentUser?.displayName || 'User',
          xp: 0,
          weeklyXp: 0,
          streak: 0,
          lastActiveDate: new Date().toISOString().split('T')[0],
          coins: 0,
          dailyGoal: 50,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          completedLessons: [],
          currentCourseId: '',
        };
        try {
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await fetchProfile(u.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
