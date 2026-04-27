// ── Logistics DB service using Firestore ──────────────────────────────────────
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

const uid = () => 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const today = () => new Date().toISOString().slice(0, 10);
export const add30 = d => { const dt = new Date(d); dt.setDate(dt.getDate() + 30); return dt.toISOString().slice(0, 10); };
export const fmt = d => { if (!d) return '—'; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
export const month = () => today().slice(0, 7);
export const money = n => '$' + Number(n).toLocaleString('es-CO');

export function statusAccount(exp) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const e = new Date(exp); e.setHours(0, 0, 0, 0);
  const d = Math.round((e - now) / 86400000);
  return d < 0 ? 'expired' : d <= 7 ? 'expiring' : 'active';
}

function normalizeSlots(a) {
  if (!a.slots) a.slots = { 0: null, 1: null, 2: null, 3: null, 4: null };
  if (Array.isArray(a.slots)) {
    const obj = {}; for (let i = 0; i < 5; i++) obj[i] = a.slots[i] || null;
    a.slots = obj;
  } else {
    for (let i = 0; i < 5; i++) if (!(String(i) in a.slots)) a.slots[String(i)] = null;
  }
  return a;
}

// ── ACCOUNTS ─────────────────────────────────────────────────────────────────

export const getAccounts = async () => {
  const snap = await getDocs(collection(db, 'logistics_accounts'));
  return snap.docs.map(d => normalizeSlots({ id: d.id, ...d.data() }));
};

export const saveAccount = async (acc) => {
  const id = acc.id || uid();
  await setDoc(doc(db, 'logistics_accounts', id), { ...acc, id, updatedAt: serverTimestamp() });
  return id;
};

export const deleteAccount = async (id) => {
  await deleteDoc(doc(db, 'logistics_accounts', id));
};

// ── STUDENTS ─────────────────────────────────────────────────────────────────

function normPayments(s) {
  if (!s.payments) s.payments = [];
  if (!Array.isArray(s.payments)) s.payments = Object.values(s.payments);
  return s;
}

export const getStudents = async () => {
  const snap = await getDocs(collection(db, 'logistics_students'));
  return snap.docs.map(d => normPayments({ id: d.id, ...d.data() }));
};

export const saveStudent = async (st) => {
  const id = st.id || uid();
  await setDoc(doc(db, 'logistics_students', id), { ...st, id, updatedAt: serverTimestamp() });
  return id;
};

export const deleteStudent = async (id) => {
  await deleteDoc(doc(db, 'logistics_students', id));
};

// Slot assignment helpers
export const assignStudentToAccount = async (accounts, accountId, studentId) => {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;
  const freeSlot = Object.entries(acc.slots).find(([, v]) => v === null);
  if (!freeSlot) throw new Error('No hay slots disponibles en esta cuenta');
  acc.slots[freeSlot[0]] = studentId;
  await saveAccount(acc);
};

export const removeStudentFromAccount = async (accounts, studentId) => {
  for (const acc of accounts) {
    const slot = Object.entries(acc.slots).find(([, v]) => v === studentId);
    if (slot) {
      acc.slots[slot[0]] = null;
      await saveAccount(acc);
      return;
    }
  }
};

// ── ADS ───────────────────────────────────────────────────────────────────────

export const getAds = async () => {
  const snap = await getDocs(collection(db, 'logistics_ads'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const saveAd = async (ad) => {
  const id = ad.id || uid();
  await setDoc(doc(db, 'logistics_ads', id), { ...ad, id });
  return id;
};

export const deleteAd = async (id) => {
  await deleteDoc(doc(db, 'logistics_ads', id));
};
