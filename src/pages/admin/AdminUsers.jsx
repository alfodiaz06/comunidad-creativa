import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllUsers, createUserProfile, updateUserProfile,
  deleteUserProfile, getAllCourses, getUserAssignedCourses,
  assignCourseToUser, removeCourseFromUser
} from '../../lib/db';
import AdminNav from '../../components/admin/AdminNav';
import {
  Plus, Pencil, Trash2, X, Check, Users,
  BookOpen, Shield, User, ChevronDown, ChevronUp, Search
} from 'lucide-react';

// Firebase Admin SDK is only available server-side, so we use a Cloud Function
// OR we pre-create users via the Firebase console and then set their profile here.
// For simplicity, we create the profile in Firestore and guide the admin to also
// create the auth account from Firebase Console or a serverless function.

function UserModal({ user, courses, onClose, onSave }) {
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    role: user?.role || 'student',
    disabled: user?.disabled || false,
  });
  const [assignedCourseIds, setAssignedCourseIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      getUserAssignedCourses(user.id).then(ids => setAssignedCourseIds(ids));
    }
  }, [user]);

  const toggleCourse = (courseId) => {
    setAssignedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSave = async () => {
    if (!form.email || !form.displayName) {
      setError('Nombre y correo son requeridos.');
      return;
    }
    setLoading(true);
    try {
      await onSave(user?.id, form, assignedCourseIds);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">
            {user ? 'Editar usuario' : 'Nuevo usuario'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {!user && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-body">
              <strong>Nota:</strong> Crea primero la cuenta en Firebase Authentication Console con el mismo correo. Luego el perfil se guardará aquí.
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Nombre completo</label>
            <input
              className="input-field"
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              placeholder="Juan García"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Correo electrónico</label>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="juan@correo.com"
              disabled={!!user}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Rol</label>
              <select
                className="input-field"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="student">Estudiante</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Estado</label>
              <select
                className="input-field"
                value={form.disabled ? 'disabled' : 'active'}
                onChange={e => setForm(f => ({ ...f, disabled: e.target.value === 'disabled' }))}
              >
                <option value="active">Activo</option>
                <option value="disabled">Deshabilitado</option>
              </select>
            </div>
          </div>

          {/* Course assignment */}
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
              Cursos asignados
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {courses.length === 0 ? (
                <p className="text-slate-500 text-xs font-body">Sin cursos disponibles</p>
              ) : courses.map(c => (
                <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-obsidian-700 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                    assignedCourseIds.includes(c.id)
                      ? 'bg-aurora-500 border-aurora-500'
                      : 'border-white/20'
                  }`}>
                    {assignedCourseIds.includes(c.id) && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={assignedCourseIds.includes(c.id)}
                    onChange={() => toggleCourse(c.id)}
                  />
                  <span className="text-xs font-body text-slate-300">{c.emoji} {c.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | user object
  const [search, setSearch] = useState('');

  const load = async () => {
    const [u, c] = await Promise.all([getAllUsers(), getAllCourses()]);
    setUsers(u);
    setCourses(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (userId, form, courseIds) => {
    if (userId) {
      // Update existing
      await updateUserProfile(userId, form);
      // Sync course assignments
      const currentIds = await getUserAssignedCourses(userId);
      const toAdd = courseIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !courseIds.includes(id));
      await Promise.all([
        ...toAdd.map(id => assignCourseToUser(userId, id)),
        ...toRemove.map(id => removeCourseFromUser(userId, id)),
      ]);
    } else {
      // New user profile (Auth account must be created separately)
      // We use email as the document ID placeholder; in production use Cloud Functions
      // to create auth users and get their UID
      const tempId = `user_${Date.now()}`;
      await createUserProfile(tempId, { ...form, uid: tempId });
      await Promise.all(courseIds.map(id => assignCourseToUser(tempId, id)));
    }
    await load();
  };

  const handleDelete = async (userId) => {
    if (!confirm('¿Eliminar este usuario? Esta acción es irreversible.')) return;
    await deleteUserProfile(userId);
    await load();
  };

  const filtered = users.filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Usuarios</h1>
              <p className="text-slate-500 text-sm font-body mt-1">{users.length} usuarios registrados</p>
            </div>
            <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo usuario
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="input-field pl-11"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="card overflow-hidden p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 shimmer-loading rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 font-body text-sm">Sin usuarios</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map(u => (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-obsidian-600 border border-white/10 flex items-center justify-center text-sm font-display font-bold text-slate-400 flex-shrink-0">
                      {(u.displayName || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-display font-semibold text-slate-200">{u.displayName || '–'}</div>
                      <div className="text-xs font-mono text-slate-500 truncate">{u.email}</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <span className={u.role === 'admin' ? 'badge-aurora' : 'badge bg-white/5 text-slate-500 border border-white/10'}>
                        {u.role === 'admin' ? <><Shield className="w-2.5 h-2.5" /> Admin</> : <><User className="w-2.5 h-2.5" /> Estudiante</>}
                      </span>
                      {u.disabled && <span className="badge bg-red-500/10 text-red-400 border border-red-500/20">Inactivo</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModal(u)}
                        className="p-2 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== authUser?.uid && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          courses={courses}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
