import { useState } from 'react';
import { getStudents, getAccounts } from '../../lib/logistics';
import AdminNav from '../../components/admin/AdminNav';

export default function AdminDebug() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const [students, accounts] = await Promise.all([getStudents(), getAccounts()]);
      const found = students.filter(s =>
        s.email?.toLowerCase().includes(email.toLowerCase()) ||
        s.name?.toLowerCase().includes(email.toLowerCase())
      );
      const result = found.map(s => ({
        ...s,
        _account: accounts.find(a => a.id === s.accountId) || null,
        _deletedAt: s.deletedAt ? 'ELIMINADO' : 'activo',
      }));
      setResult(result);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav/>
      <main className="flex-1 p-8">
        <h1 className="font-display text-2xl font-bold text-white mb-6">🔍 Debug Estudiantes</h1>
        <div className="flex gap-3 mb-6">
          <input className="input-field max-w-sm" value={email}
            onChange={e=>setEmail(e.target.value)} placeholder="Buscar por nombre o email..."/>
          <button onClick={check} disabled={loading} className="btn-primary">
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {result && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">{result.length} resultado(s)</p>
            {result.map((s, i) => (
              <div key={i} className="card font-mono text-xs space-y-1">
                <div className={`font-bold ${s.deletedAt ? 'text-red-400' : 'text-jade-400'}`}>
                  {s._deletedAt} — {s.name}
                </div>
                <div>email: <span className="text-slate-200">{s.email || '—'}</span></div>
                <div>uid: <span className="text-slate-200">{s.uid || '❌ SIN UID'}</span></div>
                <div>accountId: <span className="text-slate-200">{s.accountId || '❌ SIN CUENTA'}</span></div>
                <div>courseIds: <span className="text-slate-200">{JSON.stringify(s.courseIds || [])}</span></div>
                <div>accessPassword: <span className="text-slate-200">{s.accessPassword || '—'}</span></div>
                {s._account ? (
                  <div className="mt-2 p-2 bg-jade-500/10 rounded-lg">
                    <div className="text-jade-400 font-bold mb-1">✅ Cuenta encontrada:</div>
                    <div>email cuenta: {s._account.email}</div>
                    <div>password cuenta: {s._account.password}</div>
                  </div>
                ) : (
                  <div className="mt-2 p-2 bg-red-500/10 rounded-lg text-red-400">
                    ❌ No se encontró cuenta con accountId: {s.accountId || 'null'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
