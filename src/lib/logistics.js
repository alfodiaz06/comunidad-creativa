// ── Logistics DB — Firebase Realtime Database (Gemini Mgr)
const RTDB = 'https://registro-clientes-67d06-default-rtdb.firebaseio.com';

const rtdb = {
  async read(path) {
    const r = await fetch(`${RTDB}/${path}.json`);
    if (!r.ok && r.status !== 404) throw new Error('Error leyendo datos');
    return r.json();
  },
  async write(path, data) {
    const r = await fetch(`${RTDB}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Error guardando datos');
    return r.json();
  },
  async del(path) {
    await fetch(`${RTDB}/${path}.json`, { method: 'DELETE' });
  },
};

// ── Utils
export const uid = () => 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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

function normalizePayments(s) {
  if (!s.payments) { s.payments = []; return s; }
  if (!Array.isArray(s.payments)) s.payments = Object.values(s.payments);
  return s;
}

// ── ACCOUNTS
export const getAccounts = async () => {
  const d = await rtdb.read('accounts');
  if (!d) return [];
  return Object.values(d).map(normalizeSlots);
};
export const saveAccount = async (acc) => rtdb.write(`accounts/${acc.id}`, acc);
export const deleteAccount = async (id) => rtdb.del(`accounts/${id}`);

// ── STUDENTS
export const getStudents = async () => {
  const d = await rtdb.read('students');
  if (!d) return [];
  return Object.values(d).map(normalizePayments);
};
export const saveStudent = async (st) => rtdb.write(`students/${st.id}`, st);
export const deleteStudent = async (id) => rtdb.del(`students/${id}`);

// ── ADS
export const getAds = async () => {
  const d = await rtdb.read('ads');
  if (!d) return [];
  return Object.values(d);
};
export const saveAd = async (ad) => rtdb.write(`ads/${ad.id}`, ad);
export const deleteAd = async (id) => rtdb.del(`ads/${id}`);

// ── Slot helpers
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
