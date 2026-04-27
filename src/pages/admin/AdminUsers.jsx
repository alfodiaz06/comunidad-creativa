import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUserProfile, updateUserProfile,
  getAllUsers, getAllCourses, getUserAssignedCourses,
  assignCourseToUser, removeCourseFromUser
} from '../../lib/db';
import { apiCreateUser, apiDeleteUser } from '../../lib/api';
import AdminNav from '../../components/admin/AdminNav';
import {
  Plus, Pencil, Trash2, X, Check, Users,
  Shield, User, Search, Copy, Eye, EyeOff, RefreshCw
} from 'lucide-react';

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function UserModal({ user, courses, onClose, onSave }) {
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    role: user?.role || 'student',
    disabled: user?.disabled || false,
  });
  const [assignedCourseIds, setAssignedCourseIds] = useState([]);
  const [password, setPassword] = useState(() => generatePassword());
  const [showPass, setShowPass] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) getUserAssignedCourses(user.id).then(setAssignedCourseIds);
  }, [user]);

  const toggleCourse = (id) =>
    setAssignedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!form.email || !form.displayName) { setError('Nombre y correo son requeridos.'); return; }
    setLoading(true);
    try {
      await onSave(user?.id, form, assignedCourseIds, password);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg animate-slide-up max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{user ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Nombre completo</label>
            <input className="input-field" value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Juan García" />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Correo electrónico</label>
            <input className="input-field" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="juan@correo.com" disabled={!!user} />
          </div>

          {/* Contraseña — solo para nuevos usuarios */}
          {!user && (
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
                Contraseña de acceso
              </label>
              <div className="relative">
                <input
                  className="input-field pr-28 font-mono text-sm tracking-wider"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button type="button" onClick={() => setPassword(generatePassword())}
                    className="p-1.5 text-slate-500 hover:text-brand-400 transition-colors" title="Regenerar">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors">
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={copyPassword}
                    className={`p-1.5 transition-colors ${copied ? 'text-jade-400' : 'text-slate-500 hover:text-brand-400'}`} title="Copiar">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="mt-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs font-body text-brand-300">
                📋 <strong>Copia esta contraseña</strong> para enviársela al estudiante junto con su correo. La cuenta se creará automáticamente.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Rol</label>
              <select className="input-field" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="student">Estudiante</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Estado</label>
              <select className="input-field" value={form.disabled ? 'disabled' : 'active'}
                onChange={e => setForm(f => ({ ...f, disabled: e.target.value === 'disabled' }))}>
                <option value="active">Activo</option>
                <option value="disabled">Deshabilitado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Cursos asignados</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {courses.length === 0
                ? <p className="text-slate-500 text-xs">Sin cursos disponibles</p>
                : courses.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-obsidian-700 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors
                      ${assignedCourseIds.includes(c.id) ? 'bg-brand-500 border-brand-500' : 'border-white/20'}`}>
                      {assignedCourseIds.includes(c.id) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <input type="checkbox" className="sr-only"
                      checked={assignedCourseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} />
                    <span className="text-xs font-body text-slate-300">{c.emoji} {c.title}</span>
                  </label>
                ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading
              ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creando...</>
              : <><Check className="w-4 h-4" /> Guardar</>}
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
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    const [u, c] = await Promise.all([getAllUsers(), getAllCourses()]);
    setUsers(u);
    setCourses(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (userId, form, courseIds, password) => {
    if (userId) {
      await updateUserProfile(userId, form);
      const currentIds = await getUserAssignedCourses(userId);
      const toAdd = courseIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !courseIds.includes(id));
      await Promise.all([
        ...toAdd.map(id => assignCourseToUser(userId, id)),
        ...toRemove.map(id => removeCourseFromUser(userId, id)),
      ]);
    } else {
      const result = await apiCreateUser({
        email: form.email,
        password,
        displayName: form.displayName,
        role: form.role,
      });
      if (result.uid) {
        await Promise.all(courseIds.map(id => assignCourseToUser(result.uid, id)));
      }
    }
    await load();
  };

  const handleDelete = async (userId) => {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
      await apiDeleteUser(userId);
    } catch {
      const { deleteUserProfile } = await import('../../lib/db');
      await deleteUserProfile(userId);
    }
    await load();
  };

  const filtered = users.filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8 animate-fade-in">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Usuarios</h1>
              <p className="text-slate-500 text-sm font-body mt-1">{users.length} usuarios registrados</p>
            </div>
            <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo</span> usuario
            </button>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input className="input-field pl-11" placeholder="Buscar por nombre o correo..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="card overflow-hidden p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 shimmer-loading rounded-xl" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 font-body text-sm">Sin usuarios</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-4 hover:bg-white/2 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-sm font-display font-bold text-brand-400 flex-shrink-0">
                      {(u.displayName || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-display font-semibold text-slate-200 truncate">{u.displayName || '–'}</div>
                      <div className="text-xs font-mono text-slate-500 truncate">{u.email}</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <span className={u.role === 'admin' ? 'badge-brand' : 'badge bg-white/5 text-slate-500 border border-white/10'}>
                        {u.role === 'admin' ? <><Shield className="w-2.5 h-2.5" /> Admin</> : <><User className="w-2.5 h-2.5" /> Estudiante</>}
                      </span>
                      {u.disabled && <span className="badge bg-red-500/10 text-red-400 border border-red-500/20">Inactivo</span>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setModal(u)}
                        className="p-2 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== authUser?.uid && (
                        <button onClick={() => handleDelete(u.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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
