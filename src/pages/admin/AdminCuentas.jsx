import { useState, useEffect, useCallback } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import { getAccounts, getStudents, saveAccount, deleteAccount, statusAccount, fmt, month, today, add30, uid } from '../../lib/logistics';
import { Plus, Pencil, Trash2, X, Check, Eye, EyeOff, Copy, RefreshCw, ChevronLeft, Calendar } from 'lucide-react';

function StatusBadge({ exp }) {
  const st = statusAccount(exp);
  const map = { active:'bg-jade-500/15 text-jade-400 border-jade-500/20', expiring:'bg-amber-500/15 text-amber-400 border-amber-500/20', expired:'bg-red-500/15 text-red-400 border-red-500/20' };
  const labels = { active:'Activa', expiring:'Por vencer', expired:'Vencida' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono border ${map[st]}`}>{labels[st]}</span>;
}

function AccountModal({ account, onClose, onSave }) {
  const [form, setForm] = useState({ email:account?.email||'', password:account?.password||'', twoFactorKey:account?.twoFactorKey||'', createdAt:account?.createdAt||today(), expiresAt:account?.expiresAt||add30(today()) });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    if(!form.email||!form.password) return;
    setLoading(true);
    try {
      const acc = account ? {...account,...form} : {id:uid(),...form,slots:{0:null,1:null,2:null,3:null,4:null}};
      await onSave(acc); onClose();
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{account?'✏️ Editar cuenta':'➕ Nueva cuenta'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Correo principal</label>
            <input className="input-field font-mono" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="cuenta@gmail.com"/></div>
          <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <input className="input-field font-mono pr-10" type={showPass?'text':'password'} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
              <button onClick={()=>setShowPass(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
              </button>
            </div></div>
          <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Clave 2FA</label>
            <input className="input-field font-mono" value={form.twoFactorKey} onChange={e=>setForm(f=>({...f,twoFactorKey:e.target.value}))} placeholder="XXXX-XXXX-XXXX"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Creada</label>
              <input className="input-field text-sm" type="date" value={form.createdAt} onChange={e=>setForm(f=>({...f,createdAt:e.target.value,expiresAt:add30(e.target.value)}))}/></div>
            <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Vence</label>
              <input className="input-field text-sm" type="date" value={form.expiresAt} onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))}/></div>
          </div>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading||!form.email||!form.password} className="btn-primary flex items-center gap-2">
            {loading?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<Check className="w-4 h-4"/>}
            {account?'Guardar':'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RenewModal({ account, onClose, onSave }) {
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">🔄 Renovar cuenta</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5">
          <p className="text-sm font-mono text-brand-300 mb-4">{account.email}</p>
          <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Nueva fecha de inicio</label>
          <input className="input-field text-sm" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          <p className="text-xs text-slate-500 font-mono mt-2">Vencerá el: <span className="text-jade-400">{fmt(add30(date))}</span></p>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={async()=>{setLoading(true);try{await onSave(account.id,date);onClose();}finally{setLoading(false);}}}
            disabled={loading} className="btn-primary flex items-center gap-2">
            {loading?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<RefreshCw className="w-4 h-4"/>}
            Renovar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCuentas() {
  const [accounts, setAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const m = month();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a,s] = await Promise.all([getAccounts(), getStudents()]);
      setAccounts(a); setStudents(s);
      if (selected) setSelected(s => a.find(x => x.id === s?.id) || null);
    } finally { setLoading(false); }
  }, [selected]);

  useEffect(() => { load(); }, []);

  const active = students.filter(s=>!s.deletedAt);

  const handleSaveAccount = async (acc) => { await saveAccount(acc); await load(); };
  const handleRenew = async (id, date) => {
    const acc = accounts.find(a=>a.id===id);
    if (!acc) return;
    acc.createdAt = date; acc.expiresAt = add30(date);
    await saveAccount(acc); await load();
  };
  const handleDelete = async (acc) => {
    if (!confirm(`¿Eliminar "${acc.email}"?`)) return;
    if (active.some(s=>s.accountId===acc.id)) { alert('Reasigna los estudiantes primero.'); return; }
    await deleteAccount(acc.id); await load();
  };

  const currentAcc = selected ? accounts.find(a=>a.id===selected) : null;

  return (
    <div className="flex min-h-screen">
      <AdminNav/>
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {!currentAcc ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Cuentas</h1>
                  <p className="text-slate-500 text-sm mt-1">{accounts.length} cuentas registradas</p>
                </div>
                <button onClick={()=>setModal({type:'new'})} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4"/> Nueva cuenta
                </button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center h-48"><div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
                  {accounts.map(acc=>{
                    const occupied=Object.values(acc.slots||{}).filter(Boolean).length;
                    const st=statusAccount(acc.expiresAt);
                    return (
                      <div key={acc.id} className="card group cursor-pointer hover:bg-obsidian-700/60 transition-all" onClick={()=>setSelected(acc.id)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-3 h-3 rounded-full mt-0.5 ${st==='active'?'bg-jade-400':st==='expiring'?'bg-amber-400':'bg-red-400'}`}/>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                            <button onClick={()=>setModal({type:'renew',acc})} className="px-2 py-1 rounded-lg text-xs font-display font-semibold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25">Renovar</button>
                            <button onClick={()=>setModal({type:'edit',acc})} className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5"/></button>
                            <button onClick={()=>handleDelete(acc)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                        <div className="font-mono text-white text-sm font-semibold mb-2 truncate">{acc.email}</div>
                        <StatusBadge exp={acc.expiresAt}/>
                        <div className="mt-3 text-xs font-mono text-slate-500">📅 {fmt(acc.createdAt)} · Vence {fmt(acc.expiresAt)}</div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs font-mono text-slate-500 mb-1"><span>{occupied}/5 slots ocupados</span></div>
                          <div className="flex gap-1">{[0,1,2,3,4].map(i=><div key={i} className={`h-1.5 flex-1 rounded-full ${acc.slots?.[i]?'bg-brand-500':'bg-obsidian-600'}`}/>)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="animate-fade-in">
              <button onClick={()=>setSelected(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm mb-5 transition-colors">
                <ChevronLeft className="w-4 h-4"/> Volver a cuentas
              </button>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`w-3 h-3 rounded-full ${statusAccount(currentAcc.expiresAt)==='active'?'bg-jade-400':statusAccount(currentAcc.expiresAt)==='expiring'?'bg-amber-400':'bg-red-400'}`}/>
                  <h2 className="font-mono text-xl font-bold text-white">{currentAcc.email}</h2>
                  <StatusBadge exp={currentAcc.expiresAt}/>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setModal({type:'edit',acc:currentAcc})} className="btn-ghost flex items-center gap-1.5 text-sm"><Pencil className="w-3.5 h-3.5"/> Editar</button>
                  <button onClick={()=>setModal({type:'renew',acc:currentAcc})} className="px-4 py-2 rounded-xl text-sm font-display font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-all">🔄 Renovar</button>
                </div>
              </div>
              {/* Info */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {[
                  {label:'Correo', val:currentAcc.email, copy:currentAcc.email},
                  {label:'Contraseña', val:showPass?currentAcc.password:'••••••••', copy:currentAcc.password, toggle:()=>setShowPass(s=>!s)},
                  {label:'Clave 2FA', val:currentAcc.twoFactorKey||'—', copy:currentAcc.twoFactorKey},
                  {label:'Creada', val:fmt(currentAcc.createdAt)},
                  {label:'Vence', val:fmt(currentAcc.expiresAt)},
                ].map(({label,val,copy,toggle})=>(
                  <div key={label} className="card p-3">
                    <div className="text-xs font-mono text-slate-500 mb-1.5 uppercase">{label}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-mono text-slate-200 break-all">{val}</span>
                      {copy&&copy!=='—'&&<button onClick={()=>navigator.clipboard.writeText(copy)} className="text-brand-400 hover:text-brand-300"><Copy className="w-3 h-3"/></button>}
                      {toggle&&<button onClick={toggle} className="text-slate-500 hover:text-slate-300">{showPass?<EyeOff className="w-3 h-3"/>:<Eye className="w-3 h-3"/>}</button>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Slots */}
              <div className="mb-4">
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  Slots de usuarios — {Object.values(currentAcc.slots||{}).filter(Boolean).length}/5 ocupados
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {Object.entries(currentAcc.slots||{}).sort(([a],[b])=>parseInt(a)-parseInt(b)).map(([i,sid])=>{
                  const st = sid ? active.find(s=>s.id===sid) : null;
                  const pay = st ? (st.payments||[]).find(p=>p.month===m) : null;
                  if (!st) return (
                    <div key={i} className="card border-dashed border-white/10 flex flex-col items-center justify-center gap-2 min-h-[130px] text-slate-600">
                      <span className="text-xs">Slot {parseInt(i)+1} libre</span>
                    </div>
                  );
                  return (
                    <div key={i} className="card min-h-[130px] flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-mono text-slate-600 mb-1">Slot {parseInt(i)+1}</div>
                        <div className="font-display font-semibold text-white text-sm">{st.name}</div>
                        <div className="text-xs font-mono text-slate-500">📱 {st.whatsapp}</div>
                        <div className="text-xs font-mono text-slate-500">📅 {fmt(st.startDate)}</div>
                      </div>
                      <div className="mt-2">
                        {pay?.paid
                          ? <span className="text-xs font-mono text-jade-400">✓ Pagado {m}</span>
                          : <span className="text-xs font-mono text-amber-400">⚠ Pendiente {m}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      {modal?.type==='new' && <AccountModal onClose={()=>setModal(null)} onSave={handleSaveAccount}/>}
      {modal?.type==='edit' && <AccountModal account={modal.acc} onClose={()=>setModal(null)} onSave={handleSaveAccount}/>}
      {modal?.type==='renew' && <RenewModal account={modal.acc} onClose={()=>setModal(null)} onSave={handleRenew}/>}
    </div>
  );
}
