// ── Notifications — uses RTDB REST API (same as logistics.js)
const RTDB = 'https://registro-clientes-67d06-default-rtdb.firebaseio.com';

async function rtdbPush(path, data) {
  const r = await fetch(`${RTDB}/${path}.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('Error guardando notificación');
  return r.json();
}

async function rtdbRead(path) {
  const r = await fetch(`${RTDB}/${path}.json`);
  if (!r.ok) throw new Error('Error leyendo notificaciones');
  return r.json();
}

export async function notifyAccount(accountId, notification) {
  if (!accountId) return;
  await rtdbPush(`notifications/${accountId}`, {
    ...notification,
    createdAt: Date.now(),
    read: false,
  });
}

export async function getNotifications(accountId) {
  if (!accountId) return [];
  const data = await rtdbRead(`notifications/${accountId}`);
  if (!data) return [];
  return Object.entries(data)
    .map(([id, n]) => ({ id, ...n }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(-50);
}

export function markAllRead(accountId) {
  if (!accountId) return;
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
