import { auth } from './firebase';

const BASE_URL = '/.netlify/functions';

async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');
  return user.getIdToken(true); // force refresh
}

export async function apiCreateUser({ email, password, displayName, role = 'student' }) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/createUser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ email, password, displayName, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear usuario');
  return data;
}

export async function apiDeleteUser(uid, email) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/deleteUser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ uid, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
  return data;
}

// Update password — uses createUser which handles existing emails by updating password
export async function apiUpdatePassword(uid, email, password) {
  if (!email && !uid) throw new Error('Se requiere email o uid');
  if (!password || password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
  
  const token = await getAuthToken();
  
  // Try updateUserPassword first if it exists
  try {
    const res = await fetch(`${BASE_URL}/updateUserPassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ uid, email, password }),
    });
    const data = await res.json();
    if (res.ok) return data;
    console.warn('updateUserPassword failed, trying createUser fallback:', data.error);
  } catch(e) {
    console.warn('updateUserPassword not available, using createUser fallback');
  }

  // Fallback: use createUser which updates password if email already exists
  const res = await fetch(`${BASE_URL}/createUser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ email, password, displayName: '', role: 'student' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar contraseña');
  return data;
}
