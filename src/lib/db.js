import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp, addDoc
} from 'firebase/firestore';
import { db } from './firebase';

// ─── USERS ───────────────────────────────────────────────────────────────────

export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUserProfile = async (uid) => {
  await deleteDoc(doc(db, 'users', uid));
};

// ─── COURSES ─────────────────────────────────────────────────────────────────

export const createCourse = async (data) => {
  const ref = await addDoc(collection(db, 'courses'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getCourse = async (courseId) => {
  const snap = await getDoc(doc(db, 'courses', courseId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllCourses = async () => {
  const snap = await getDocs(query(collection(db, 'courses'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateCourse = async (courseId, data) => {
  await updateDoc(doc(db, 'courses', courseId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCourse = async (courseId) => {
  await deleteDoc(doc(db, 'courses', courseId));
};

// ─── MODULES ─────────────────────────────────────────────────────────────────

export const createModule = async (courseId, data) => {
  const ref = await addDoc(collection(db, 'courses', courseId, 'modules'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getModules = async (courseId) => {
  const snap = await getDocs(
    query(collection(db, 'courses', courseId, 'modules'), orderBy('order', 'asc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateModule = async (courseId, moduleId, data) => {
  await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), data);
};

export const deleteModule = async (courseId, moduleId) => {
  await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId));
};

// ─── LESSONS ─────────────────────────────────────────────────────────────────

export const createLesson = async (courseId, moduleId, data) => {
  const ref = await addDoc(
    collection(db, 'courses', courseId, 'modules', moduleId, 'lessons'),
    { ...data, createdAt: serverTimestamp() }
  );
  return ref.id;
};

export const getLessons = async (courseId, moduleId) => {
  const snap = await getDocs(
    query(
      collection(db, 'courses', courseId, 'modules', moduleId, 'lessons'),
      orderBy('order', 'asc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateLesson = async (courseId, moduleId, lessonId, data) => {
  await updateDoc(
    doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId),
    data
  );
};

export const deleteLesson = async (courseId, moduleId, lessonId) => {
  await deleteDoc(
    doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId)
  );
};

// ─── PROGRESS ────────────────────────────────────────────────────────────────

export const markLessonComplete = async (userId, courseId, lessonId, completed = true) => {
  const progressId = `${userId}_${courseId}_${lessonId}`;
  await setDoc(doc(db, 'progress', progressId), {
    userId,
    courseId,
    lessonId,
    completed,
    completedAt: completed ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getUserCourseProgress = async (userId, courseId) => {
  const snap = await getDocs(
    query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      where('completed', '==', true)
    )
  );
  return snap.docs.map(d => d.data().lessonId);
};

export const getAllUserProgress = async (userId) => {
  const snap = await getDocs(
    query(collection(db, 'progress'), where('userId', '==', userId), where('completed', '==', true))
  );
  return snap.docs.map(d => d.data());
};

// ─── COURSE ASSIGNMENTS ───────────────────────────────────────────────────────

export const assignCourseToUser = async (userId, courseId) => {
  await setDoc(doc(db, 'assignments', `${userId}_${courseId}`), {
    userId,
    courseId,
    assignedAt: serverTimestamp(),
  });
};

export const removeCourseFromUser = async (userId, courseId) => {
  await deleteDoc(doc(db, 'assignments', `${userId}_${courseId}`));
};

export const getUserAssignedCourses = async (userId) => {
  const snap = await getDocs(
    query(collection(db, 'assignments'), where('userId', '==', userId))
  );
  return snap.docs.map(d => d.data().courseId);
};

export const getCourseAssignedUsers = async (courseId) => {
  const snap = await getDocs(
    query(collection(db, 'assignments'), where('courseId', '==', courseId))
  );
  return snap.docs.map(d => d.data().userId);
};
