// ── Notifications system via Firebase Realtime Database
import { ref, push, onValue, off, serverTimestamp, query, orderByChild, limitToLast, update } from 'firebase/database';
import { rtdb } from './firebase';

// Send a notification to all users of an account
export async function notifyAccount(accountId, notification) {
  const notifRef = ref(rtdb, `notifications/${accountId}`);
  await push(notifRef, {
    ...notification,
    createdAt: Date.now(),
    read: false,
  });
}

// Listen to notifications for an account in real time
export function listenNotifications(accountId, callback) {
  const notifRef = query(
    ref(rtdb, `notifications/${accountId}`),
    orderByChild('createdAt'),
    limitToLast(50)
  );
  onValue(notifRef, (snap) => {
    const data = snap.val();
    if (!data) { callback([]); return; }
    const list = Object.entries(data)
      .map(([id, n]) => ({ id, ...n }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    callback(list);
  });
  return () => off(notifRef);
}

// Mark all as read
export async function markAllRead(accountId) {
  // We'll handle read state locally via localStorage per user
  localStorage.setItem(`notif_read_${accountId}`, Date.now().toString());
}

export function getLastRead(accountId) {
  return parseInt(localStorage.getItem(`notif_read_${accountId}`) || '0');
}

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `Hace ${m} min`;
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${d}d`;
}
