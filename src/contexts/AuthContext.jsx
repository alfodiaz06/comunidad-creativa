import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, getUserAssignedCourses, assignCourseToUser } from '../lib/db';
import { getStudents } from '../lib/logistics';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-sync courses from student record to Firestore assignments
  const syncStudentCourses = async (uid) => {
    try {
      const students = await getStudents();
      const student = students.find(s => s.uid === uid);
      if (!student || !student.courseIds?.length) return;

      const assigned = await getUserAssignedCourses(uid);
      const missing = student.courseIds.filter(id => !assigned.includes(id));
      if (missing.length > 0) {
        await Promise.all(missing.map(id => assignCourseToUser(uid, id)));
      }
    } catch (err) {
      console.error('Error syncing courses:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
          // Auto-sync courses for students
          if (userProfile && userProfile.role !== 'admin') {
            syncStudentCourses(firebaseUser.uid);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
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
    const userProfile = await getUserProfile(result.user.uid);
    if (!userProfile || userProfile.disabled) {
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
