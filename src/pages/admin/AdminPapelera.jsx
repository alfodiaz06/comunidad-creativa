import { useState, useEffect, useCallback } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import { getStudents, saveStudent, deleteStudent, getAccounts, assignStudentToAccount, fmt, today, add30 } from '../../lib/logistics';
import { apiDeleteUserByEmail } from '../../lib/api';
import { Trash2, RotateCcw, AlertCircle, User } from 'lucide-react';

export default function AdminPapelera() {
  const [students, setStudents] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sts, accs] = await Promise.all([getStudents(), getAccounts()]);
      setStudents(sts.filter(s => s.deletedAt));
      setAccounts(accs);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (st) => {
    const newExpiry = add30(today());
    await saveStudent({ ...st, deletedAt: null, expiresAt: newExpiry, disabled: false });
    await load();
  };

  const handlePermDelete = async (st) => {
    if (!confirm(`¿Eliminar permanentemente a "${st.name}"?\n\nEsto eliminará su acceso a la plataforma. Esta acción es irreversible.`)) return;
    setDeleting(st.id);
    try {
      // Delete from Firebase Auth by email or uid
      if (st.email || st.uid) {
        try {
          await apiDeleteUserByEmail(st.uid, st.email);
        } catch(e) { console.warn('Auth delete:', e.message); }
      }
      // Delete from RTDB
      await deleteStudent(st.id);
      await load();
    } finally { setDeleting(null); }
  };

  const trashed = students;

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <AdminNav />
      <main className="flex-1 lg:overflow-auto p-4 pt-16 lg:pt-8 sm:px-6 lg:px-8 lg:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 animate-fade-in">
            <h1 className="font-display text-2xl font-bold text-white">Papelera</h1>
            <p className="text-slate-500 text-sm mt-1">{trashed.length} persona{trashed.length !== 1 ? 's' : ''} eliminada{trashed.length !== 1 ? 's' : ''}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
            </div>
          ) : trashed.length === 0 ? (
            <div className="card text-center py-20">
              <Trash2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-body text-sm">La papelera está vacía</p>
            </div>
          ) : (
            <div className="space-y-3 animate-slide-up">
              {/* Warning */}
              <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Al <strong>restaurar</strong> una persona se reactiva su acceso con 30 días nuevos. Al <strong>eliminar permanentemente</strong> se borra su cuenta de Firebase Auth y no podrá volver a usar ese correo hasta recrear el acceso.</span>
              </div>

              <div className="card overflow-hidden p-0">
                <div className="divide-y divide-white/5">
                  {trashed.map(st => {
                    const acc = accounts.find(a => a.id === st.accountId);
                    const deletedDate = st.deletedAt ? new Date(st.deletedAt).toLocaleDateString('es-CO') : '—';
                    return (
                      <div key={st.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-obsidian-700 border border-white/10 flex items-center justify-center text-slate-500 font-bold text-sm flex-shrink-0">
                          {st.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-sm font-semibold text-slate-300">{st.name}</div>
                          <div className="flex flex-wrap gap-x-3 mt-0.5">
                            {st.whatsapp && <span className="text-xs font-mono text-slate-500">📱 {st.whatsapp}</span>}
                            {st.email && <span className="text-xs font-mono text-slate-500">✉️ {st.email}</span>}
                            {acc && <span className="text-xs font-mono text-slate-600">🔑 {acc.email}</span>}
                          </div>
                          <div className="text-xs font-mono text-slate-600 mt-0.5">Eliminado: {deletedDate}</div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleRestore(st)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-semibold bg-jade-500/15 text-jade-400 border border-jade-500/20 hover:bg-jade-500/25 transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                          </button>
                          <button
                            onClick={() => handlePermDelete(st)}
                            disabled={deleting === st.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            {deleting === st.id
                              ? <div className="w-3.5 h-3.5 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
