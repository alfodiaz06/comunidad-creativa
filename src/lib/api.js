import { auth } from './firebase';

const BASE_URL = '/.netlify/functions';

async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');
  return user.getIdToken();
}

export async function apiCreateUser({ email, password, displayName, role = 'student' }) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/createUser`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password, displayName, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear usuario');
  return data;
}

// Delete by uid OR by email (useful when uid is unknown)
export async function apiDeleteUser(uid, email) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/deleteUser`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ uid, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
  return data;
}

export async function apiDeleteUserByEmail(uid, email) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/deleteUserByEmail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ uid, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
  return data;
}

export async function apiUpdatePassword(uid, email, password) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/updateUserPassword`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ uid, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar contraseña');
  return data;
}
