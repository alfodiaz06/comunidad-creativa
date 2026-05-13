import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  updatePassword, EmailAuthProvider, reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, getUserAssignedCourses, assignCourseToUser } from '../lib/db';
import { getStudents, saveStudent } from '../lib/logistics';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncOnLogin = async (firebaseUser) => {
    try {
      const students = await getStudents();
      // Only active students
      const active = students.filter(s => !s.deletedAt);

      // Find student by uid OR by email
      let student = active.find(s => s.uid === firebaseUser.uid);
      if (!student) {
        student = active.find(s =>
          s.email?.toLowerCase() === firebaseUser.email?.toLowerCase()
        );
      }

      if (!student) return;

      // Always update uid to current Firebase uid
      if (!student.uid || student.uid !== firebaseUser.uid) {
        await saveStudent({ ...student, uid: firebaseUser.uid });
        student = { ...student, uid: firebaseUser.uid };
      }

      // Sync courses from RTDB courseIds → Firestore assignments
      if (student.courseIds?.length > 0) {
        const assigned = await getUserAssignedCourses(firebaseUser.uid);
        const missing = student.courseIds.filter(id => !assigned.includes(id));
        if (missing.length > 0) {
          await Promise.all(missing.map(id => assignCourseToUser(firebaseUser.uid, id)));
        }
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
          if (userProfile && userProfile.role !== 'admin') {
            syncOnLogin(firebaseUser);
          }
        } catch (err) {
          console.error('Profile error:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Only block if admin explicitly disabled the account (not just expired)
    let userProfile = null;
    try { userProfile = await getUserProfile(result.user.uid); } catch(e) {}
    if (userProfile?.disabled === true) {
      await signOut(auth);
      throw new Error('Tu cuenta está deshabilitada. Contacta al administrador.');
    }
    setProfile(userProfile);
    return result;
  };

  const logout = () => signOut(auth);

  const changePassword = async (currentPassword, newPassword) => {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  const isAdmin = profile?.role === 'admin';
  const value = { user, profile, loading, login, logout, changePassword, isAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
