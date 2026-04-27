import { useState, useEffect, useCallback } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import {
  getAccounts, getStudents, getAds,
  saveAccount, deleteAccount, saveStudent, deleteStudent,
  assignStudentToAccount, removeStudentFromAccount, saveAd, deleteAd,
  statusAccount, fmt, month, today, add30, money, uid
} from '../../lib/logistics';
import {
  Plus, Pencil, Trash2, X, Check, ChevronRight, ChevronLeft,
  Copy, RefreshCw, Calendar, Users, DollarSign, TrendingUp,
  AlertCircle, Search, Eye, EyeOff, BarChart2, Megaphone
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid2 = () => 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function StatusBadge({ exp }) {
  const st = statusAccount(exp);
  const map = {
    active: 'bg-jade-500/15 text-jade-400 border-jade-500/20',
    expiring: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    expired: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  const labels = { active: 'Activa', expiring: 'Por vencer', expired: 'Vencida' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${map[st]}`}>
      {labels[st]}
    </span>
  );
}

function PayBadge({ paid, m }) {
  return paid
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-jade-500/15 text-jade-400 border border-jade-500/20"><Check className="w-2.5 h-2.5" /> Pagado {m}</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-red-500/15 text-red-400 border border-red-500/20"><AlertCircle className="w-2.5 h-2.5" /> Pendiente {m}</span>;
}

function copyText(t) { navigator.clipboard.writeText(t); }

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'text-brand-400',
    jade: 'text-jade-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };
  return (
    <div className="card">
      <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">{label}</div>
      <div className={`font-display text-2xl font-bold ${colors[color]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5 font-body">{sub}</div>}
    </div>
  );
}

// ── Account Modal ─────────────────────────────────────────────────────────────

function AccountModal({ account, onClose, onSave }) {
  const [form, setForm] = useState({
    email: account?.email || '',
    password: account?.password || '',
    twoFactorKey: account?.twoFactorKey || '',
    createdAt: account?.createdAt || today(),
    expiresAt: account?.expiresAt || add30(today()),
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSave = async () => {
    if (!form.email || !form.password) return;
    setLoading(true);
    try {
      const acc = account
        ? { ...account, ...form }
        : { id: uid2(), ...form, slots: { 0: null, 1: null, 2: null, 3: null, 4: null } };
      await onSave(acc);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{account ? 'Editar cuenta' : 'Nueva cuenta'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Correo</label>
            <input className="input-field font-mono text-sm" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <input className="input-field font-mono text-sm pr-10" type={showPass ? 'text' : 'password'}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Clave 2FA</label>
            <input className="input-field font-mono text-sm" value={form.twoFactorKey}
              onChange={e => setForm(f => ({ ...f, twoFactorKey: e.target.value }))} placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Creada</label>
              <input className="input-field text-sm" type="date" value={form.createdAt}
                onChange={e => setForm(f => ({ ...f, createdAt: e.target.value, expiresAt: add30(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Vence</label>
              <input className="input-field text-sm" type="date" value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !form.email || !form.password} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Student Modal ─────────────────────────────────────────────────────────────

function StudentModal({ student, accounts, onClose, onSave }) {
  const availableAccounts = accounts.filter(a =>
    Object.values(a.slots || {}).some(s => s === null) ||
    (student && Object.values(a.slots || {}).includes(student.id))
  );
  const [form, setForm] = useState({
    name: student?.name || '',
    whatsapp: student?.whatsapp || '',
    email: student?.email || '',
    startDate: student?.startDate || today(),
    accountId: student?.accountId || availableAccounts[0]?.id || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.whatsapp) return;
    setLoading(true);
    try {
      await onSave(student, form);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{student ? 'Editar estudiante' : 'Nuevo estudiante'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Nombre</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">WhatsApp</label>
            <input className="input-field font-mono" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="3001234567" />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Correo (opcional)</label>
            <input className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Cuenta asignada</label>
            <select className="input-field" value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
              {availableAccounts.map(a => {
                const free = Object.values(a.slots || {}).filter(s => s === null).length;
                return <option key={a.id} value={a.id}>{a.email} ({free} libre{free !== 1 ? 's' : ''})</option>;
              })}
              {availableAccounts.length === 0 && <option disabled>Sin slots disponibles</option>}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Fecha de inicio</label>
            <input className="input-field text-sm" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !form.name || !form.whatsapp} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Calendar Modal ────────────────────────────────────────────────────

function PayCalendarModal({ student, onClose, onUpdate }) {
  const [payments, setPayments] = useState(student.payments || []);
  const [loading, setLoading] = useState(false);
  const m = month();

  const allMonths = () => {
    const months = [];
    const start = new Date(student.startDate || today());
    const now = new Date();
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= now) {
      months.push(cur.toISOString().slice(0, 7));
      cur.setMonth(cur.getMonth() + 1);
    }
    return months;
  };

  const toggleMonth = async (monthKey) => {
    const existing = payments.find(p => p.month === monthKey);
    let newPayments;
    if (existing) {
      newPayments = payments.map(p => p.month === monthKey ? { ...p, paid: !p.paid } : p);
    } else {
      newPayments = [...payments, { month: monthKey, paid: true, amount: 80000 }];
    }
    setPayments(newPayments);
    setLoading(true);
    try {
      await saveStudent({ ...student, payments: newPayments });
      onUpdate();
    } finally { setLoading(false); }
  };

  const months = allMonths();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-sm animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="font-display font-semibold text-white">{student.name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Historial de pagos</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-2">
          {months.map(mk => {
            const p = payments.find(x => x.month === mk);
            const paid = p?.paid;
            const [y, mo] = mk.split('-');
            const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
            return (
              <div key={mk} className="flex items-center justify-between p-3 rounded-xl bg-obsidian-700 border border-white/5">
                <div>
                  <div className="text-sm font-display text-slate-200 capitalize">{label}</div>
                  {p?.amount && <div className="text-xs font-mono text-slate-500">{money(p.amount)}</div>}
                </div>
                <button onClick={() => toggleMonth(mk)} disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all
                    ${paid ? 'bg-jade-500/15 text-jade-400 border border-jade-500/20 hover:bg-jade-500/25' : 'bg-brand-500/15 text-brand-400 border border-brand-500/20 hover:bg-brand-500/25'}`}>
                  {paid ? <><Check className="w-3 h-3 inline mr-1" />Pagado</> : 'Marcar pagado'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Account Detail ────────────────────────────────────────────────────────────

function AccountDetail({ account, students, accounts, onBack, onRefresh, onEditStudent }) {
  const m = month();
  const active = students.filter(s => !s.deletedAt);
  const [showPass, setShowPass] = useState(false);
  const [showModal, setShowModal] = useState(null);

  const slotsData = Object.entries(account.slots || {}).map(([i, sid]) => {
    const st = sid ? active.find(s => s.id === sid) : null;
    return { i: parseInt(i), sid, student: st };
  });

  const handleNewStudent = async (_, form) => {
    const newSt = { id: uid2(), ...form, payments: [], deletedAt: null };
    await saveStudent(newSt);
    await assignStudentToAccount(accounts, account.id, newSt.id);
    onRefresh();
  };

  return (
    <div className="animate-fade-in">
      {/* Back + header */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm font-body mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a cuentas
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`w-3 h-3 rounded-full ${statusAccount(account.expiresAt) === 'active' ? 'bg-jade-400' : statusAccount(account.expiresAt) === 'expiring' ? 'bg-amber-400' : 'bg-red-400'}`} />
          <h2 className="font-display text-xl font-bold text-white font-mono">{account.email}</h2>
          <StatusBadge exp={account.expiresAt} />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Correo', val: account.email, copy: true },
          { label: 'Contraseña', val: showPass ? account.password : '••••••••', copy: true, copyVal: account.password, toggle: () => setShowPass(s => !s) },
          { label: 'Clave 2FA', val: account.twoFactorKey || '—', copy: !!account.twoFactorKey },
          { label: 'Creada', val: fmt(account.createdAt) },
          { label: 'Vence', val: fmt(account.expiresAt) },
        ].map(({ label, val, copy, copyVal, toggle }) => (
          <div key={label} className="card p-3">
            <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">{label}</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-mono text-slate-200 break-all">{val}</span>
              {copy && (
                <button onClick={() => copyText(copyVal || val)} className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0">
                  <Copy className="w-3 h-3" />
                </button>
              )}
              {toggle && (
                <button onClick={toggle} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
                  {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Slots */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-semibold text-white text-sm">
          Slots de usuarios — {slotsData.filter(s => s.sid).length}/5 ocupados
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {slotsData.map(({ i, student: st }) => {
          if (!st) {
            return (
              <button key={i} onClick={() => setShowModal('newStudent')}
                className="card border-dashed border-white/10 hover:border-brand-500/30 hover:bg-brand-500/5 flex flex-col items-center justify-center gap-2 h-40 transition-all">
                <Plus className="w-5 h-5 text-slate-600" />
                <span className="text-xs text-slate-600 font-body">Slot {i + 1} libre</span>
              </button>
            );
          }
          const pay = (st.payments || []).find(p => p.month === m);
          const paid = pay?.paid;
          return (
            <div key={i} className="card h-40 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-slate-600 mb-1">Slot {i + 1}</div>
                <div className="font-display font-semibold text-white text-sm">{st.name}</div>
                <div className="text-xs font-mono text-slate-500 mt-1">📱 {st.whatsapp}</div>
                {st.email && <div className="text-xs font-mono text-slate-500 truncate">📧 {st.email}</div>}
              </div>
              <div>
                <PayBadge paid={paid} m={m} />
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => onEditStudent(st)} className="text-xs btn-ghost px-2 py-1">✏️</button>
                  <button onClick={() => setShowModal({ type: 'pay', student: st })} className="text-xs btn-ghost px-2 py-1">📅</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal === 'newStudent' && (
        <StudentModal accounts={accounts} onClose={() => setShowModal(null)} onSave={handleNewStudent} />
      )}
      {showModal?.type === 'pay' && (
        <PayCalendarModal student={showModal.student} onClose={() => setShowModal(null)} onUpdate={onRefresh} />
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function AdminLogistics() {
  const [tab, setTab] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [stFilter, setStFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, s, ad] = await Promise.all([getAccounts(), getStudents(), getAds()]);
      setAccounts(a);
      setStudents(s);
      setAds(ad);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeStudents = students.filter(s => !s.deletedAt);
  const trashedStudents = students.filter(s => s.deletedAt);
  const m = month();

  // KPIs
  const mPaid = activeStudents.reduce((sum, st) => {
    const p = (st.payments || []).find(x => x.month === m && x.paid);
    return sum + (p ? p.amount : 0);
  }, 0);
  const mPending = activeStudents.reduce((sum, st) => {
    const pays = st.payments || [];
    const p = pays.find(x => x.month === m);
    if (p?.paid) return sum;
    return sum + (p?.amount || (pays.length > 1 ? 60000 : 80000));
  }, 0);
  const totalAdsMonth = ads.filter(a => a.date?.slice(0, 7) === m).reduce((s, a) => s + a.amount, 0);
  const totalHistoric = activeStudents.reduce((sum, st) =>
    sum + (st.payments || []).filter(p => p.paid).reduce((a, p) => a + p.amount, 0), 0);
  const netMonth = mPaid - totalAdsMonth;

  // Students filtered
  const filteredStudents = activeStudents.filter(s => {
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase()) && !s.whatsapp?.includes(search)) return false;
    if (stFilter === 'paid') {
      const p = (s.payments || []).find(x => x.month === m);
      return p?.paid;
    }
    if (stFilter === 'pending') {
      const p = (s.payments || []).find(x => x.month === m);
      return !p?.paid;
    }
    return true;
  });

  const handleSaveAccount = async (acc) => {
    await saveAccount(acc);
    await load();
  };

  const handleDeleteAccount = async (acc) => {
    if (!confirm(`¿Eliminar la cuenta "${acc.email}"?`)) return;
    if (activeStudents.some(s => s.accountId === acc.id)) {
      alert('Elimina o reasigna los estudiantes primero.');
      return;
    }
    await deleteAccount(acc.id);
    await load();
  };

  const handleSaveStudent = async (existing, form) => {
    if (existing) {
      const oldAccId = existing.accountId;
      if (oldAccId !== form.accountId) {
        await removeStudentFromAccount(accounts, existing.id);
        await saveStudent({ ...existing, ...form });
        await assignStudentToAccount(accounts, form.accountId, existing.id);
      } else {
        await saveStudent({ ...existing, ...form });
      }
    } else {
      const newSt = { id: uid2(), ...form, payments: [], deletedAt: null };
      await saveStudent(newSt);
      if (form.accountId) await assignStudentToAccount(accounts, form.accountId, newSt.id);
    }
    await load();
  };

  const handleTrashStudent = async (st) => {
    if (!confirm(`¿Mover a papelera a "${st.name}"?`)) return;
    await removeStudentFromAccount(accounts, st.id);
    await saveStudent({ ...st, deletedAt: new Date().toISOString(), accountId: null });
    await load();
  };

  const handleRestoreStudent = async (st) => {
    await saveStudent({ ...st, deletedAt: null });
    await load();
  };

  const handlePermDelete = async (st) => {
    if (!confirm(`¿Eliminar permanentemente a "${st.name}"?`)) return;
    await deleteStudent(st.id);
    await load();
  };

  const handleTogglePay = async (st) => {
    const pays = [...(st.payments || [])];
    const idx = pays.findIndex(p => p.month === m);
    if (idx >= 0) {
      pays[idx] = { ...pays[idx], paid: !pays[idx].paid };
    } else {
      pays.push({ month: m, paid: true, amount: 80000 });
    }
    await saveStudent({ ...st, payments: pays });
    await load();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'accounts', label: 'Cuentas' },
    { id: 'students', label: 'Estudiantes' },
    { id: 'logistica', label: 'Torre' },
    { id: 'trash', label: 'Papelera' },
  ];

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 animate-fade-in">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Logística</h1>
            <p className="text-slate-500 text-sm font-body mt-1">Gestión de cuentas, estudiantes y contabilidad</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedAccount(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-display font-semibold whitespace-nowrap transition-all
                  ${tab === t.id ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* ── DASHBOARD ── */}
              {tab === 'dashboard' && (
                <div className="animate-slide-up space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <KpiCard label="Estudiantes activos" value={activeStudents.length} color="jade" />
                    <KpiCard label="Cuentas activas" value={accounts.filter(a => statusAccount(a.expiresAt) !== 'expired').length}
                      sub={`${accounts.filter(a => statusAccount(a.expiresAt) === 'expired').length} vencidas`} color="brand" />
                    <KpiCard label={`Ingresos ${m}`} value={money(mPaid)} sub="recaudado este mes" color="jade" />
                    <KpiCard label={`Pendiente ${m}`} value={money(mPending)} color="amber" />
                    <KpiCard label={`Publicidad ${m}`} value={money(totalAdsMonth)} sub="invertido en ads" color="red" />
                    <KpiCard label={`Ganancia neta ${m}`} value={money(netMonth)} sub="ingresos - publicidad" color="jade" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <KpiCard label="Total histórico" value={money(totalHistoric)} sub="todos los pagos" color="jade" />
                    <KpiCard label="Ganancia neta total" value={money(totalHistoric - ads.reduce((s, a) => s + a.amount, 0))}
                      sub="histórico - publicidad" color="jade" />
                  </div>

                  {/* Recent students */}
                  <div className="card">
                    <h3 className="font-display font-semibold text-white text-sm mb-4">Últimos estudiantes</h3>
                    <div className="space-y-3">
                      {activeStudents.slice(0, 5).map(st => {
                        const acc = accounts.find(a => a.id === st.accountId);
                        const pay = (st.payments || []).find(p => p.month === m);
                        const paid = pay?.paid;
                        return (
                          <div key={st.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                            <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs flex-shrink-0">
                              {st.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-display text-slate-200">{st.name}</div>
                              <div className="text-xs font-mono text-slate-500">{st.whatsapp} · {acc?.email || '—'}</div>
                            </div>
                            <PayBadge paid={paid} m={m} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACCOUNTS ── */}
              {tab === 'accounts' && !selectedAccount && (
                <div className="animate-slide-up">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-slate-500 text-sm font-body">{accounts.length} cuentas</span>
                    <button onClick={() => setModal({ type: 'account' })} className="btn-primary flex items-center gap-2 text-sm">
                      <Plus className="w-4 h-4" /> Nueva cuenta
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map(acc => {
                      const occupied = Object.values(acc.slots || {}).filter(Boolean).length;
                      const st = statusAccount(acc.expiresAt);
                      return (
                        <div key={acc.id} className="card group cursor-pointer hover:bg-obsidian-700/60 transition-all"
                          onClick={() => setSelectedAccount(acc)}>
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${st === 'active' ? 'bg-jade-400' : st === 'expiring' ? 'bg-amber-400' : 'bg-red-400'}`} />
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <button onClick={() => setModal({ type: 'account', data: acc })}
                                className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteAccount(acc)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="font-mono text-white text-sm font-semibold mb-1 truncate">{acc.email}</div>
                          <StatusBadge exp={acc.expiresAt} />
                          <div className="mt-3">
                            <div className="flex justify-between text-xs font-mono text-slate-500 mb-1">
                              <span>Slots</span><span>{occupied}/5</span>
                            </div>
                            <div className="flex gap-1">
                              {[0,1,2,3,4].map(i => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full ${acc.slots?.[i] ? 'bg-brand-500' : 'bg-obsidian-600'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-2">Vence {fmt(acc.expiresAt)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === 'accounts' && selectedAccount && (
                <AccountDetail
                  account={accounts.find(a => a.id === selectedAccount.id) || selectedAccount}
                  students={students}
                  accounts={accounts}
                  onBack={() => setSelectedAccount(null)}
                  onRefresh={load}
                  onEditStudent={st => setModal({ type: 'student', data: st })}
                />
              )}

              {/* ── STUDENTS ── */}
              {tab === 'students' && (
                <div className="animate-slide-up">
                  <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
                    <div className="flex gap-2">
                      {['all', 'paid', 'pending'].map(f => (
                        <button key={f} onClick={() => setStFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all
                            ${stFilter === f ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20' : 'text-slate-500 hover:bg-white/5'}`}>
                          {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagados' : 'Pendientes'}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setModal({ type: 'student' })} className="btn-primary flex items-center gap-2 text-sm">
                      <Plus className="w-4 h-4" /> Nuevo estudiante
                    </button>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input className="input-field pl-11" placeholder="Buscar por nombre o WhatsApp..."
                      value={search} onChange={e => setSearch(e.target.value)} />
                  </div>

                  <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/5">
                            {['Nombre', 'WhatsApp', 'Cuenta', 'Total pagado', 'Mes actual', 'Acciones'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredStudents.map(st => {
                            const acc = accounts.find(a => a.id === st.accountId);
                            const pays = st.payments || [];
                            const pay = pays.find(p => p.month === m);
                            const paid = pay?.paid;
                            const total = pays.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
                            return (
                              <tr key={st.id} className="hover:bg-white/2 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-display text-sm text-slate-200">{st.name}</div>
                                  <div className="text-xs text-slate-500 font-mono">{fmt(st.startDate)}</div>
                                </td>
                                <td className="px-4 py-3 font-mono text-sm text-slate-300">{st.whatsapp}</td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[130px] truncate">{acc?.email || '—'}</td>
                                <td className="px-4 py-3 font-mono text-sm text-jade-400">{money(total)}</td>
                                <td className="px-4 py-3"><PayBadge paid={paid} m={m} /></td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1">
                                    <button onClick={() => handleTogglePay(st)}
                                      className={`px-2 py-1 rounded-lg text-xs font-display font-semibold transition-all
                                        ${paid ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-jade-500/15 text-jade-400 hover:bg-jade-500/25'}`}>
                                      {paid ? 'Revertir' : '✓ Pagado'}
                                    </button>
                                    <button onClick={() => setModal({ type: 'pay', student: st })}
                                      className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                                      <Calendar className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setModal({ type: 'student', data: st })}
                                      className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors">
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleTrashStudent(st)}
                                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {filteredStudents.length === 0 && (
                        <div className="text-center py-16 text-slate-500 font-body text-sm">Sin estudiantes</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TORRE LOGÍSTICA ── */}
              {tab === 'logistica' && (
                <div className="animate-slide-up space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <KpiCard label="Estudiantes activos" value={activeStudents.length} color="jade" />
                    <KpiCard label={`Ingresos ${m}`} value={money(mPaid)} color="jade" />
                    <KpiCard label={`Pendiente ${m}`} value={money(mPending)} color="amber" />
                    <KpiCard label={`Publicidad ${m}`} value={money(totalAdsMonth)} color="red" />
                    <KpiCard label={`Ganancia neta ${m}`} value={money(netMonth)} color="jade" />
                    <KpiCard label="Total histórico" value={money(totalHistoric)} color="jade" />
                  </div>

                  {/* Ads section */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-brand-400" /> Publicidad / Gastos
                      </h3>
                      <button onClick={() => setModal({ type: 'ad' })} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5">
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </button>
                    </div>
                    {ads.length === 0 ? (
                      <p className="text-slate-500 text-xs font-body">Sin gastos registrados</p>
                    ) : (
                      <div className="space-y-2">
                        {ads.map(ad => (
                          <div key={ad.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-display text-slate-200">{ad.name}</div>
                              <div className="text-xs font-mono text-slate-500">{fmt(ad.date)}</div>
                            </div>
                            <span className="text-sm font-mono text-red-400">{money(ad.amount)}</span>
                            <button onClick={() => deleteAd(ad.id).then(load)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="pt-2 flex justify-between">
                          <span className="text-xs font-mono text-slate-500">Total publicidad</span>
                          <span className="text-sm font-mono text-red-400">{money(ads.reduce((s, a) => s + a.amount, 0))}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logistica table */}
                  <div className="card overflow-hidden p-0">
                    <div className="p-4 border-b border-white/5 flex flex-wrap gap-2 items-center justify-between">
                      <h3 className="font-display font-semibold text-white text-sm">Seguimiento {m}</h3>
                      <div className="flex gap-2">
                        {['all', 'paid', 'pending'].map(f => (
                          <button key={f} onClick={() => setStFilter(f)}
                            className={`px-3 py-1 rounded-lg text-xs font-display font-semibold transition-all
                              ${stFilter === f ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20' : 'text-slate-500 hover:bg-white/5'}`}>
                            {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagados' : 'Pendientes'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/5">
                            {['Nombre', 'WhatsApp', 'Cuenta', 'Mes', 'Monto', 'Estado', 'Acción'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredStudents.map(st => {
                            const acc = accounts.find(a => a.id === st.accountId);
                            const pay = (st.payments || []).find(p => p.month === m);
                            const paid = pay?.paid;
                            const amt = pay?.amount || 80000;
                            return (
                              <tr key={st.id} className="hover:bg-white/2 transition-colors">
                                <td className="px-4 py-3 font-display text-sm text-slate-200">{st.name}</td>
                                <td className="px-4 py-3 font-mono text-sm text-slate-300">{st.whatsapp}</td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[130px] truncate">{acc?.email || '—'}</td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{m}</td>
                                <td className="px-4 py-3 font-mono text-sm text-jade-400">{money(amt)}</td>
                                <td className="px-4 py-3"><PayBadge paid={paid} m={m} /></td>
                                <td className="px-4 py-3">
                                  <button onClick={() => handleTogglePay(st)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all
                                      ${paid ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-jade-500/15 text-jade-400 hover:bg-jade-500/25'}`}>
                                    {paid ? 'Revertir' : '✓ Marcar pagado'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PAPELERA ── */}
              {tab === 'trash' && (
                <div className="animate-slide-up">
                  <h3 className="font-display font-semibold text-white text-sm mb-4">
                    Papelera — {trashedStudents.length} estudiante{trashedStudents.length !== 1 ? 's' : ''}
                  </h3>
                  {trashedStudents.length === 0 ? (
                    <div className="card text-center py-16">
                      <Trash2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 font-body text-sm">Papelera vacía</p>
                    </div>
                  ) : (
                    <div className="card overflow-hidden p-0">
                      <div className="divide-y divide-white/5">
                        {trashedStudents.map(st => (
                          <div key={st.id} className="flex items-center gap-3 px-4 py-4 hover:bg-white/2 transition-colors">
                            <div className="w-9 h-9 rounded-full bg-obsidian-700 border border-white/10 flex items-center justify-center text-slate-500 font-bold text-sm">
                              {st.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-display text-slate-300">{st.name}</div>
                              <div className="text-xs font-mono text-slate-500">{st.whatsapp}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleRestoreStudent(st)}
                                className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold bg-jade-500/15 text-jade-400 border border-jade-500/20 hover:bg-jade-500/25 transition-all">
                                Restaurar
                              </button>
                              <button onClick={() => handlePermDelete(st)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── MODALS ── */}
        {modal?.type === 'account' && (
          <AccountModal account={modal.data} onClose={() => setModal(null)} onSave={handleSaveAccount} />
        )}
        {modal?.type === 'student' && (
          <StudentModal student={modal.data} accounts={accounts} onClose={() => setModal(null)} onSave={handleSaveStudent} />
        )}
        {modal?.type === 'pay' && (
          <PayCalendarModal student={modal.student} onClose={() => setModal(null)} onUpdate={load} />
        )}
        {modal?.type === 'ad' && (
          <AdModal onClose={() => setModal(null)} onSave={async (ad) => { await saveAd(ad); await load(); setModal(null); }} />
        )}
      </main>
    </div>
  );
}

function AdModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', amount: '', date: today() });
  const [loading, setLoading] = useState(false);
  const uid3 = () => 'ad_' + Date.now().toString(36);

  const handleSave = async () => {
    if (!form.name || !form.amount) return;
    setLoading(true);
    try { await onSave({ id: uid3(), ...form, amount: parseInt(form.amount) }); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">Nuevo gasto / publicidad</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Descripción</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Meta Ads, Google Ads..." />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Monto (COP)</label>
            <input className="input-field font-mono" type="number" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="50000" />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Fecha</label>
            <input className="input-field text-sm" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !form.name || !form.amount} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
