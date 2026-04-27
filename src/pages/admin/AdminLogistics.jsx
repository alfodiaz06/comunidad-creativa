import { useState, useEffect, useCallback } from 'react';
import AdminNav from '../../components/admin/AdminNav';
import {
  getAccounts, getStudents, getAds,
  saveAccount, deleteAccount, saveStudent, deleteStudent,
  assignStudentToAccount, removeStudentFromAccount,
  saveAd, deleteAd,
  statusAccount, fmt, month, today, add30, money, uid
} from '../../lib/logistics';
import {
  Plus, Pencil, Trash2, X, Check, ChevronLeft,
  Copy, Eye, EyeOff, Calendar, Search,
  Megaphone, RefreshCw, AlertCircle
} from 'lucide-react';

// ── Status Badge
function StatusBadge({ exp }) {
  const st = statusAccount(exp);
  const map = {
    active:   'bg-jade-500/15 text-jade-400 border-jade-500/20',
    expiring: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    expired:  'bg-red-500/15 text-red-400 border-red-500/20',
  };
  const labels = { active: 'Activa', expiring: 'Por vencer', expired: 'Vencida' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono border ${map[st]}`}>{labels[st]}</span>;
}

function PayBadge({ paid, m }) {
  return paid
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-jade-500/15 text-jade-400 border border-jade-500/20"><Check className="w-2.5 h-2.5"/>Pagado {m}</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-red-500/15 text-red-400 border border-red-500/20"><AlertCircle className="w-2.5 h-2.5"/>Pendiente</span>;
}

function cp(text) { navigator.clipboard.writeText(text); }

// ── Account Modal
function AccountModal({ account, onClose, onSave }) {
  const [form, setForm] = useState({
    email: account?.email || '',
    password: account?.password || '',
    twoFactorKey: account?.twoFactorKey || '',
    createdAt: account?.createdAt || today(),
    expiresAt: account?.expiresAt || add30(today()),
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.email || !form.password) return;
    setLoading(true);
    try {
      const acc = account
        ? { ...account, ...form }
        : { id: uid(), ...form, slots: { 0: null, 1: null, 2: null, 3: null, 4: null } };
      await onSave(acc);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{account ? '✏️ Editar cuenta' : '➕ Nueva cuenta'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Correo principal</label>
            <input className="input-field font-mono" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="cuenta@gmail.com"/>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <input className="input-field font-mono pr-10" type={showPass?'text':'password'} value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Contraseña visible"/>
              <button onClick={()=>setShowPass(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Clave 2FA de la cuenta</label>
            <input className="input-field font-mono" value={form.twoFactorKey} onChange={e => setForm(f=>({...f,twoFactorKey:e.target.value}))} placeholder="XXXX-XXXX-XXXX"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Fecha de creación</label>
              <input className="input-field text-sm" type="date" value={form.createdAt}
                onChange={e => setForm(f=>({...f, createdAt:e.target.value, expiresAt:add30(e.target.value)}))}/>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Vence</label>
              <input className="input-field text-sm" type="date" value={form.expiresAt}
                onChange={e => setForm(f=>({...f, expiresAt:e.target.value}))}/>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading||!form.email||!form.password} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : <Check className="w-4 h-4"/>}
            {account ? 'Guardar cambios' : 'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Renew Modal
function RenewModal({ account, onClose, onSave }) {
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    setLoading(true);
    try { await onSave(account.id, date); onClose(); }
    finally { setLoading(false); }
  };
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
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
            Renovar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Student Modal
function StudentModal({ student, accounts, onClose, onSave }) {
  const available = accounts.filter(a =>
    Object.values(a.slots||{}).some(s=>s===null) ||
    (student && Object.values(a.slots||{}).includes(student.id))
  );
  const [form, setForm] = useState({
    name: student?.name||'',
    whatsapp: student?.whatsapp||'',
    email: student?.email||'',
    startDate: student?.startDate||today(),
    accountId: student?.accountId || available[0]?.id || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name||!form.whatsapp) return;
    setLoading(true);
    try { await onSave(student, form); onClose(); }
    catch(err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{student?'✏️ Editar estudiante':'👤 Agregar estudiante'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Nombre completo</label>
            <input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nombre completo"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">WhatsApp</label>
              <input className="input-field font-mono" value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} placeholder="3001234567"/>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Fecha de ingreso</label>
              <input className="input-field text-sm" type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Correo electrónico</label>
            <input className="input-field" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="correo@gmail.com (opcional)"/>
          </div>
          {!student && (
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Cuenta asignada</label>
              <select className="input-field" value={form.accountId} onChange={e=>setForm(f=>({...f,accountId:e.target.value}))}>
                {available.map(a=>{
                  const free=Object.values(a.slots||{}).filter(s=>s===null).length;
                  return <option key={a.id} value={a.id}>{a.email} ({free} libre{free!==1?'s':''})</option>;
                })}
                {available.length===0 && <option disabled>Sin slots disponibles</option>}
              </select>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading||!form.name||!form.whatsapp} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : <Check className="w-4 h-4"/>}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pay Calendar Modal
function PayCalendarModal({ student, onClose, onUpdate }) {
  const [payments, setPayments] = useState([...(student.payments||[])]);
  const [loading, setLoading] = useState(false);
  const m = month();

  const allMonths = () => {
    const months=[];
    const start=new Date(student.startDate||today());
    const now=new Date();
    let cur=new Date(start.getFullYear(),start.getMonth(),1);
    while(cur<=now){ months.push(cur.toISOString().slice(0,7)); cur.setMonth(cur.getMonth()+1); }
    return months;
  };

  const toggleMonth = async (mk) => {
    const existing=payments.find(p=>p.month===mk);
    let newP;
    if(existing){ newP=payments.map(p=>p.month===mk?{...p,paid:!p.paid}:p); }
    else{ newP=[...payments,{month:mk,paid:true,amount:payments.length===0?80000:60000}]; }
    setPayments(newP);
    setLoading(true);
    try{ await saveStudent({...student,payments:newP}); onUpdate(); }
    finally{ setLoading(false); }
  };

  const addNextMonth = async () => {
    const months=allMonths();
    const last=months[months.length-1];
    const [y,mo]=last.split('-');
    const next=new Date(parseInt(y),parseInt(mo),1).toISOString().slice(0,7);
    const newP=[...payments,{month:next,paid:false,amount:60000}];
    setPayments(newP);
    await saveStudent({...student,payments:newP});
    onUpdate();
  };

  const totalPaid=payments.filter(p=>p.paid).reduce((s,p)=>s+p.amount,0);
  const totalPending=payments.filter(p=>!p.paid).reduce((s,p)=>s+p.amount,0);
  const months=allMonths();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-md animate-slide-up max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="font-display font-semibold text-white">📅 Historial de pagos</h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{student.name} · Inicio: {fmt(student.startDate)}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-2">
          {months.map((mk,idx)=>{
            const p=payments.find(x=>x.month===mk);
            const paid=p?.paid;
            const amt=p?.amount||(idx===0?80000:60000);
            const [y,mo]=mk.split('-');
            const label=new Date(parseInt(y),parseInt(mo)-1).toLocaleDateString('es-CO',{month:'long',year:'numeric'});
            return (
              <div key={mk} className="flex items-center justify-between p-3 rounded-xl bg-obsidian-700 border border-white/5">
                <div>
                  <div className="text-sm font-display text-slate-200 capitalize">{label}{idx===0?' (inicio)':''}</div>
                  <div className="text-xs font-mono text-jade-400">{money(amt)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <PayBadge paid={paid} m={mk}/>
                  <button onClick={()=>toggleMonth(mk)} disabled={loading}
                    className="px-2.5 py-1 rounded-lg text-xs font-display font-semibold bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                    {paid?'Revertir':'✓ Pagado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-white/5">
          <div className="flex justify-between text-xs font-mono mb-3">
            <span className="text-slate-500">Total pagado: <span className="text-jade-400">{money(totalPaid)}</span></span>
            <span className="text-slate-500">Pendiente: <span className="text-amber-400">{money(totalPending)}</span></span>
            <span className="text-slate-500">{months.length} mes{months.length!==1?'es':''} en total</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="btn-ghost">Cerrar</button>
            <button onClick={addNextMonth} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4"/> Agregar mes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ad Modal
function AdModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', platform:'Facebook Ads', amount:'', date:today() });
  const [loading, setLoading] = useState(false);
  const platforms = ['Facebook Ads','Google Ads','Instagram','TikTok Ads','Otro'];
  const handleSave = async () => {
    if(!form.name||!form.amount) return;
    setLoading(true);
    try{ await onSave({id:'ad_'+Date.now().toString(36),...form,amount:parseInt(form.amount)}); onClose(); }
    finally{ setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">📢 Registrar gasto</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Plataforma</label>
            <select className="input-field" value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))}>
              {platforms.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Descripción</label>
            <input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="1ra Campaña, Meta Ads..."/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Monto (COP)</label>
              <input className="input-field font-mono" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="50000"/>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Fecha</label>
              <input className="input-field text-sm" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading||!form.name||!form.amount} className="btn-primary flex items-center gap-2">
            {loading?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<Check className="w-4 h-4"/>}
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Account Detail View
function AccountDetail({ account, students, accounts, onBack, onRefresh }) {
  const m = month();
  const active = students.filter(s=>!s.deletedAt);
  const [showPass, setShowPass] = useState(false);
  const [modal, setModal] = useState(null);

  const slots = Object.entries(account.slots||{}).sort(([a],[b])=>parseInt(a)-parseInt(b));
  const occupied = slots.filter(([,sid])=>sid).length;

  const handleNewStudent = async (_, form) => {
    const newSt = { id: uid(), ...form, payments:[], deletedAt:null };
    await saveStudent(newSt);
    await assignStudentToAccount(accounts, account.id, newSt.id);
    onRefresh();
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4"/> Volver a cuentas
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`w-3 h-3 rounded-full ${statusAccount(account.expiresAt)==='active'?'bg-jade-400':statusAccount(account.expiresAt)==='expiring'?'bg-amber-400':'bg-red-400'}`}/>
          <h2 className="font-mono text-xl font-bold text-white">{account.email}</h2>
          <StatusBadge exp={account.expiresAt}/>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setModal({type:'edit'})} className="btn-ghost flex items-center gap-1.5 text-sm">
            <Pencil className="w-3.5 h-3.5"/> Editar
          </button>
          <button onClick={()=>setModal({type:'renew'})}
            className="px-4 py-2 rounded-xl text-sm font-display font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-all">
            🔄 Renovar
          </button>
        </div>
      </div>

      {/* Info boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label:'Correo', val:account.email, copyVal:account.email },
          { label:'Contraseña', val:showPass?account.password:'••••••••', copyVal:account.password, toggle:()=>setShowPass(s=>!s), isPass:true },
          { label:'Clave 2FA', val:account.twoFactorKey||'—', copyVal:account.twoFactorKey },
          { label:'Creada', val:fmt(account.createdAt) },
          { label:'Vence', val:fmt(account.expiresAt) },
        ].map(({label,val,copyVal,toggle,isPass})=>(
          <div key={label} className="card p-3">
            <div className="text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">{label}</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-mono text-slate-200 break-all leading-snug">{val}</span>
              {copyVal && copyVal!=='—' && (
                <button onClick={()=>cp(copyVal)} className="text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0" title="Copiar">
                  <Copy className="w-3 h-3"/>
                </button>
              )}
              {isPass && (
                <button onClick={toggle} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
                  {showPass?<EyeOff className="w-3 h-3"/>:<Eye className="w-3 h-3"/>}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Slots */}
      <div className="mb-4">
        <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider text-slate-400">
          Slots de usuarios — {occupied}/5 ocupados
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {slots.map(([i, sid])=>{
          const st = sid ? active.find(s=>s.id===sid) : null;
          if (!st) return (
            <button key={i} onClick={()=>setModal({type:'newStudent'})}
              className="card border-dashed border-white/10 hover:border-brand-500/30 hover:bg-brand-500/5 flex flex-col items-center justify-center gap-2 min-h-[160px] transition-all cursor-pointer">
              <Plus className="w-6 h-6 text-slate-600"/>
              <span className="text-xs text-slate-600">Slot {parseInt(i)+1} — Asignar</span>
            </button>
          );
          const pay=(st.payments||[]).find(p=>p.month===m);
          const paid=pay?.paid;
          return (
            <div key={i} className="card flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="text-xs font-mono text-slate-600 mb-1">Slot {parseInt(i)+1}</div>
                <div className="font-display font-semibold text-white text-sm mb-1">{st.name}</div>
                <div className="text-xs font-mono text-slate-500">📱 {st.whatsapp}</div>
                {st.email&&<div className="text-xs font-mono text-slate-500 truncate">📧 {st.email}</div>}
                <div className="text-xs font-mono text-slate-500">📅 Desde {fmt(st.startDate)}</div>
              </div>
              <div className="mt-3">
                <PayBadge paid={paid} m={m}/>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={()=>setModal({type:'editStudent',student:st})}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                    <Pencil className="w-3 h-3"/> Editar
                  </button>
                  <button onClick={()=>setModal({type:'pay',student:st})}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-all">
                    <Calendar className="w-3 h-3"/> Pagos
                  </button>
                  <button onClick={async()=>{
                    if(!confirm(`¿Mover ${st.name} a papelera?`)) return;
                    await removeStudentFromAccount(accounts, st.id);
                    await saveStudent({...st, deletedAt:new Date().toISOString(), accountId:null});
                    onRefresh();
                  }} className="p-1 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                    <Trash2 className="w-3 h-3"/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {modal?.type==='edit' && (
        <AccountModal account={account} onClose={()=>setModal(null)} onSave={async acc=>{await saveAccount(acc);onRefresh();}}/>
      )}
      {modal?.type==='renew' && (
        <RenewModal account={account} onClose={()=>setModal(null)} onSave={async(id,date)=>{
          const accs=await getAccounts();
          const a=accs.find(x=>x.id===id);
          if(a){ a.createdAt=date; a.expiresAt=add30(date); await saveAccount(a); onRefresh(); }
        }}/>
      )}
      {modal?.type==='newStudent' && (
        <StudentModal accounts={accounts} onClose={()=>setModal(null)} onSave={handleNewStudent}/>
      )}
      {modal?.type==='editStudent' && (
        <StudentModal student={modal.student} accounts={accounts} onClose={()=>setModal(null)}
          onSave={async(existing,form)=>{await saveStudent({...existing,...form});onRefresh();}}/>
      )}
      {modal?.type==='pay' && (
        <PayCalendarModal student={modal.student} onClose={()=>setModal(null)} onUpdate={onRefresh}/>
      )}
    </div>
  );
}

// ── MAIN
export default function AdminLogistics() {
  const [tab, setTab] = useState('home');
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
      const [a,s,ad] = await Promise.all([getAccounts(), getStudents(), getAds()]);
      setAccounts(a); setStudents(s); setAds(ad);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = students.filter(s=>!s.deletedAt);
  const trashed = students.filter(s=>s.deletedAt);
  const m = month();

  const mPaid = active.reduce((sum,st)=>{
    const p=(st.payments||[]).find(x=>x.month===m&&x.paid);
    return sum+(p?p.amount:0);
  },0);
  const mPending = active.reduce((sum,st)=>{
    const pays=st.payments||[];
    const p=pays.find(x=>x.month===m);
    if(p?.paid) return sum;
    return sum+(p?.amount||(pays.length>1?60000:80000));
  },0);
  const totalAdsAll = ads.reduce((s,a)=>s+a.amount,0);
  const totalAdsMonth = ads.filter(a=>a.date?.slice(0,7)===m).reduce((s,a)=>s+a.amount,0);
  const totalHistoric = active.reduce((sum,st)=>sum+(st.payments||[]).filter(p=>p.paid).reduce((a,p)=>a+p.amount,0),0);
  const netMonth = mPaid - totalAdsMonth;
  const netTotal = totalHistoric - totalAdsAll;

  // Group ads by platform
  const adsByPlatform = ads.reduce((acc,a)=>{
    acc[a.platform]=(acc[a.platform]||0)+a.amount;
    return acc;
  },{});

  const filteredStudents = active.filter(s=>{
    if(search && !s.name?.toLowerCase().includes(search.toLowerCase()) && !s.whatsapp?.includes(search)) return false;
    if(stFilter==='paid'){ const p=(s.payments||[]).find(x=>x.month===m); return p?.paid; }
    if(stFilter==='pending'){ const p=(s.payments||[]).find(x=>x.month===m); return !p?.paid; }
    return true;
  });

  const handleSaveStudent = async (existing, form) => {
    if(existing){
      await saveStudent({...existing,...form});
    } else {
      const newSt={id:uid(),...form,payments:[],deletedAt:null};
      await saveStudent(newSt);
      if(form.accountId) await assignStudentToAccount(accounts, form.accountId, newSt.id);
    }
    await load();
  };

  const handleTogglePay = async (st) => {
    const pays=[...(st.payments||[])];
    const idx=pays.findIndex(p=>p.month===m);
    if(idx>=0){ pays[idx]={...pays[idx],paid:!pays[idx].paid}; }
    else{ pays.push({month:m,paid:true,amount:pays.length===0?80000:60000}); }
    await saveStudent({...st,payments:pays});
    await load();
  };

  const tabs = [
    {id:'home',label:'🏠 Home'},
    {id:'accounts',label:'🔑 Cuentas'},
    {id:'students',label:'👥 Estudiantes'},
    {id:'torre',label:'📊 Torre'},
    {id:'trash',label:'🗑️ Papelera'},
  ];

  return (
    <div className="flex min-h-screen">
      <AdminNav/>
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-white">Logística</h1>
            <p className="text-slate-500 text-sm mt-1">Cuentas · Estudiantes · Contabilidad</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setSelectedAccount(null);}}
                className={`px-4 py-2 rounded-xl text-sm font-display font-semibold whitespace-nowrap transition-all
                  ${tab===t.id?'bg-brand-500/15 text-brand-300 border border-brand-500/20':'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/>
            </div>
          ) : <>

          {/* ── HOME */}
          {tab==='home' && (
            <div className="animate-slide-up space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  {label:'Estudiantes activos', val:active.length, color:'text-jade-400'},
                  {label:'Cuentas activas', val:accounts.filter(a=>statusAccount(a.expiresAt)!=='expired').length, sub:`${accounts.filter(a=>statusAccount(a.expiresAt)==='expired').length} vencidas`, color:'text-brand-400'},
                  {label:'Recaudado total', val:money(totalHistoric), color:'text-jade-400'},
                  {label:`Recaudado ${m}`, val:money(mPaid), sub:'este mes', color:'text-brand-400'},
                  {label:`Por cobrar ${m}`, val:money(mPending), sub:`${active.filter(s=>!(s.payments||[]).find(p=>p.month===m&&p.paid)).length} pendientes`, color:'text-amber-400'},
                ].map(({label,val,sub,color})=>(
                  <div key={label} className="card">
                    <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider leading-tight">{label}</div>
                    <div className={`font-display text-2xl font-bold ${color}`}>{val}</div>
                    {sub&&<div className="text-xs text-slate-500 mt-0.5 font-mono">{sub}</div>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent students */}
                <div className="card">
                  <h3 className="font-display font-semibold text-white text-sm mb-4">Últimos estudiantes agregados</h3>
                  <div className="space-y-3">
                    {active.slice(0,6).map(st=>{
                      const acc=accounts.find(a=>a.id===st.accountId);
                      const pay=(st.payments||[]).find(p=>p.month===m);
                      return (
                        <div key={st.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-display text-slate-200">{st.name}</div>
                            <div className="text-xs font-mono text-slate-500">{st.whatsapp} · {acc?.email||'—'}</div>
                          </div>
                          <PayBadge paid={pay?.paid} m={m}/>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Account summary */}
                <div className="card">
                  <h3 className="font-display font-semibold text-white text-sm mb-4">Resumen de cuentas</h3>
                  <div className="space-y-3">
                    {accounts.map(acc=>{
                      const occupied=Object.values(acc.slots||{}).filter(Boolean).length;
                      return (
                        <div key={acc.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/2"
                          onClick={()=>{setSelectedAccount(acc);setTab('accounts');}}>
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusAccount(acc.expiresAt)==='active'?'bg-jade-400':statusAccount(acc.expiresAt)==='expiring'?'bg-amber-400':'bg-red-400'}`}/>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-mono text-slate-200">{acc.email}</div>
                            <div className="text-xs text-slate-500 font-mono">Vence {fmt(acc.expiresAt)}</div>
                          </div>
                          <div className="flex gap-0.5">
                            {[0,1,2,3,4].map(i=>(
                              <div key={i} className={`w-4 h-1.5 rounded-full ${acc.slots?.[i]?'bg-brand-500':'bg-obsidian-600'}`}/>
                            ))}
                          </div>
                          <StatusBadge exp={acc.expiresAt}/>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ACCOUNTS */}
          {tab==='accounts' && !selectedAccount && (
            <div className="animate-slide-up">
              <div className="flex justify-between items-center mb-5">
                <span className="text-slate-500 text-sm">{accounts.length} cuentas</span>
                <button onClick={()=>setModal({type:'account'})} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4"/> Nueva cuenta
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {accounts.map(acc=>{
                  const occupied=Object.values(acc.slots||{}).filter(Boolean).length;
                  const st=statusAccount(acc.expiresAt);
                  return (
                    <div key={acc.id} className="card group cursor-pointer hover:bg-obsidian-700/60 transition-all"
                      onClick={()=>setSelectedAccount(acc)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-3 h-3 rounded-full mt-0.5 ${st==='active'?'bg-jade-400':st==='expiring'?'bg-amber-400':'bg-red-400'}`}/>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>setModal({type:'renew',acc})}
                            className="px-2 py-1 rounded-lg text-xs font-display font-semibold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-all">
                            Renovar
                          </button>
                          <button onClick={async()=>{
                            if(!confirm(`¿Eliminar "${acc.email}"?`)) return;
                            if(active.some(s=>s.accountId===acc.id)){alert('Elimina los estudiantes primero.');return;}
                            await deleteAccount(acc.id); await load();
                          }} className="px-2 py-1 rounded-lg text-xs font-display font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all">
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-white text-sm font-semibold mb-1 truncate">{acc.email}</div>
                      <StatusBadge exp={acc.expiresAt}/>
                      <div className="mt-3 text-xs font-mono text-slate-500">
                        📅 {fmt(acc.createdAt)} &nbsp;🕐 Vence {fmt(acc.expiresAt)}
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs font-mono text-slate-500 mb-1">
                          <span>{occupied}/5 slots</span>
                        </div>
                        <div className="flex gap-1">
                          {[0,1,2,3,4].map(i=>(
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${acc.slots?.[i]?'bg-brand-500':'bg-obsidian-600'}`}/>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>setModal({type:'editAcc',acc})}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                          <Pencil className="w-3 h-3"/> Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab==='accounts' && selectedAccount && (
            <AccountDetail
              account={accounts.find(a=>a.id===selectedAccount.id)||selectedAccount}
              students={students}
              accounts={accounts}
              onBack={()=>setSelectedAccount(null)}
              onRefresh={load}
            />
          )}

          {/* ── STUDENTS */}
          {tab==='students' && (
            <div className="animate-slide-up">
              <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                <div className="flex gap-2">
                  {['all','paid','pending'].map(f=>(
                    <button key={f} onClick={()=>setStFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all
                        ${stFilter===f?'bg-brand-500/15 text-brand-300 border border-brand-500/20':'text-slate-500 hover:bg-white/5'}`}>
                      {f==='all'?'Todos':f==='paid'?'Pagados':'Pendientes'}
                    </button>
                  ))}
                </div>
                <button onClick={()=>setModal({type:'student'})} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4"/> Agregar estudiante
                </button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input className="input-field pl-11" placeholder="Buscar por nombre o WhatsApp..."
                  value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Nombre','WhatsApp','Cuenta','Inicio','Total pagado','Mes actual','Acciones'].map(h=>(
                          <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredStudents.map(st=>{
                        const acc=accounts.find(a=>a.id===st.accountId);
                        const pays=st.payments||[];
                        const pay=pays.find(p=>p.month===m);
                        const total=pays.filter(p=>p.paid).reduce((s,p)=>s+p.amount,0);
                        return (
                          <tr key={st.id} className="hover:bg-white/2 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-display text-sm text-slate-200">{st.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{fmt(st.startDate)}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-slate-300">{st.whatsapp}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[130px] truncate">{acc?.email||'—'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{fmt(st.startDate)}</td>
                            <td className="px-4 py-3 font-mono text-sm text-jade-400">{money(total)}</td>
                            <td className="px-4 py-3"><PayBadge paid={pay?.paid} m={m}/></td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={()=>handleTogglePay(st)}
                                  className={`px-2 py-1 rounded-lg text-xs font-display font-semibold transition-all
                                    ${pay?.paid?'bg-white/5 text-slate-400 hover:bg-white/10':'bg-jade-500/15 text-jade-400 hover:bg-jade-500/25'}`}>
                                  {pay?.paid?'Revertir':'✓ Pagado'}
                                </button>
                                <button onClick={()=>setModal({type:'pay',student:st})}
                                  className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                                  <Calendar className="w-3.5 h-3.5"/>
                                </button>
                                <button onClick={()=>setModal({type:'student',data:st})}
                                  className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors">
                                  <Pencil className="w-3.5 h-3.5"/>
                                </button>
                                <button onClick={async()=>{
                                  if(!confirm(`¿Mover ${st.name} a papelera?`)) return;
                                  await removeStudentFromAccount(accounts, st.id);
                                  await saveStudent({...st,deletedAt:new Date().toISOString(),accountId:null});
                                  await load();
                                }} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredStudents.length===0&&<div className="text-center py-12 text-slate-500 text-sm">Sin estudiantes</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── TORRE LOGÍSTICA */}
          {tab==='torre' && (
            <div className="animate-slide-up space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {[
                  {label:'Estudiantes activos', val:active.length, color:'text-jade-400'},
                  {label:'Cuentas activas', val:accounts.filter(a=>statusAccount(a.expiresAt)!=='expired').length, color:'text-brand-400'},
                  {label:`Ingresos ${m}`, val:money(mPaid), color:'text-jade-400'},
                  {label:`Pendiente ${m}`, val:money(mPending), color:'text-amber-400'},
                  {label:`Publicidad ${m}`, val:money(totalAdsMonth), color:'text-red-400'},
                  {label:`Ganancia neta ${m}`, val:money(netMonth), color:'text-jade-400'},
                  {label:'Total histórico', val:money(totalHistoric), color:'text-jade-400'},
                  {label:'Ganancia neta total', val:money(netTotal), color:'text-jade-400'},
                ].map(({label,val,color})=>(
                  <div key={label} className="card p-3">
                    <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider leading-tight">{label}</div>
                    <div className={`font-display text-lg font-bold ${color}`}>{val}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Ads table */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-brand-400"/> Inversión en publicidad
                    </h3>
                    <button onClick={()=>setModal({type:'ad'})} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
                      <Plus className="w-3.5 h-3.5"/> Registrar gasto
                    </button>
                  </div>
                  {ads.length===0?(
                    <p className="text-slate-500 text-xs">Sin gastos registrados</p>
                  ):(
                    <div>
                      <div className="grid grid-cols-4 gap-2 mb-3 text-xs font-mono text-slate-500 uppercase">
                        <span>Fecha</span><span>Plataforma</span><span>Descripción</span><span>Monto</span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {ads.sort((a,b)=>b.date?.localeCompare(a.date||'')).map(ad=>(
                          <div key={ad.id} className="grid grid-cols-4 gap-2 items-center py-2 border-b border-white/5 last:border-0">
                            <span className="text-xs font-mono text-slate-500">{fmt(ad.date)}</span>
                            <span className="text-xs font-mono">
                              <span className="px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-400 text-xs">{ad.platform||'Otro'}</span>
                            </span>
                            <span className="text-xs font-body text-slate-300 truncate">{ad.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono text-red-400">{money(ad.amount)}</span>
                              <button onClick={async()=>{await deleteAd(ad.id);await load();}} className="p-1 text-slate-600 hover:text-red-400 transition-colors ml-auto">
                                <Trash2 className="w-3 h-3"/>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Resumen publicitario */}
                <div className="card">
                  <h3 className="font-display font-semibold text-white text-sm mb-4">📊 Resumen publicitario</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      {label:'Total invertido', val:money(totalAdsAll), color:'text-red-400'},
                      {label:'Este mes', val:money(totalAdsMonth), color:'text-amber-400'},
                      {label:'Últimos 7 días', val:money(ads.filter(a=>{const d=new Date(a.date||'');const n=new Date();return(n-d)/86400000<=7;}).reduce((s,a)=>s+a.amount,0)), color:'text-amber-400'},
                      {label:'Registros', val:ads.length, color:'text-slate-300'},
                    ].map(({label,val,color})=>(
                      <div key={label} className="bg-obsidian-700 rounded-xl p-3">
                        <div className="text-xs font-mono text-slate-500 mb-1 uppercase">{label}</div>
                        <div className={`font-display text-lg font-bold ${color}`}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-500 uppercase mb-2">Por plataforma</div>
                    {Object.entries(adsByPlatform).map(([platform, total])=>(
                      <div key={platform} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400">{platform}</span>
                        <span className="text-sm font-mono text-red-400">{money(total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seguimiento mensual */}
              <div className="card overflow-hidden p-0">
                <div className="p-4 border-b border-white/5 flex flex-wrap gap-2 items-center justify-between">
                  <h3 className="font-display font-semibold text-white text-sm">Seguimiento {m}</h3>
                  <div className="flex gap-2">
                    {['all','paid','pending'].map(f=>(
                      <button key={f} onClick={()=>setStFilter(f)}
                        className={`px-3 py-1 rounded-lg text-xs font-display font-semibold transition-all
                          ${stFilter===f?'bg-brand-500/15 text-brand-300 border border-brand-500/20':'text-slate-500 hover:bg-white/5'}`}>
                        {f==='all'?'Todos':f==='paid'?'Pagados':'Pendientes'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-white/5">
                      {['Nombre','WhatsApp','Cuenta','Mes','Monto','Estado','Acción'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredStudents.map(st=>{
                        const acc=accounts.find(a=>a.id===st.accountId);
                        const pay=(st.payments||[]).find(p=>p.month===m);
                        const amt=pay?.amount||(( st.payments||[]).length<=1?80000:60000);
                        return (
                          <tr key={st.id} className="hover:bg-white/2 transition-colors">
                            <td className="px-4 py-3 font-display text-sm text-slate-200">{st.name}</td>
                            <td className="px-4 py-3 font-mono text-sm text-slate-300">{st.whatsapp}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[130px] truncate">{acc?.email||'—'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{m}</td>
                            <td className="px-4 py-3 font-mono text-sm text-jade-400">{money(amt)}</td>
                            <td className="px-4 py-3"><PayBadge paid={pay?.paid} m={m}/></td>
                            <td className="px-4 py-3">
                              <button onClick={()=>handleTogglePay(st)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all
                                  ${pay?.paid?'bg-white/5 text-slate-400 hover:bg-white/10':'bg-jade-500/15 text-jade-400 hover:bg-jade-500/25'}`}>
                                {pay?.paid?'Revertir':'✓ Marcar pagado'}
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

          {/* ── PAPELERA */}
          {tab==='trash' && (
            <div className="animate-slide-up">
              <h3 className="font-display font-semibold text-white text-sm mb-4">Papelera — {trashed.length} estudiante{trashed.length!==1?'s':''}</h3>
              {trashed.length===0?(
                <div className="card text-center py-16">
                  <Trash2 className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                  <p className="text-slate-500 text-sm">Papelera vacía</p>
                </div>
              ):(
                <div className="card overflow-hidden p-0">
                  <div className="divide-y divide-white/5">
                    {trashed.map(st=>(
                      <div key={st.id} className="flex items-center gap-3 px-4 py-4 hover:bg-white/2">
                        <div className="w-9 h-9 rounded-full bg-obsidian-700 border border-white/10 flex items-center justify-center text-slate-500 font-bold text-sm">
                          {st.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-display text-slate-300">{st.name}</div>
                          <div className="text-xs font-mono text-slate-500">{st.whatsapp}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async()=>{await saveStudent({...st,deletedAt:null});await load();}}
                            className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold bg-jade-500/15 text-jade-400 border border-jade-500/20 hover:bg-jade-500/25 transition-all">
                            Restaurar
                          </button>
                          <button onClick={async()=>{
                            if(!confirm(`¿Eliminar permanentemente a "${st.name}"? Esto también eliminará su acceso a la plataforma.`)) return;
                            // Delete from Firebase Auth if has uid
                            if(st.uid){
                              try{
                                const {apiDeleteUser} = await import('../../lib/api');
                                await apiDeleteUser(st.uid);
                              }catch(e){ console.warn('Auth delete:', e.message); }
                            }
                            await deleteStudent(st.id);
                            await load();
                          }}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </>}
        </div>

        {/* Global Modals */}
        {modal?.type==='account' && <AccountModal onClose={()=>setModal(null)} onSave={async acc=>{await saveAccount(acc);await load();}}/>}
        {modal?.type==='editAcc' && <AccountModal account={modal.acc} onClose={()=>setModal(null)} onSave={async acc=>{await saveAccount(acc);await load();}}/>}
        {modal?.type==='renew' && <RenewModal account={modal.acc} onClose={()=>setModal(null)} onSave={async(id,date)=>{
          const accs=await getAccounts();
          const a=accs.find(x=>x.id===id);
          if(a){a.createdAt=date;a.expiresAt=add30(date);await saveAccount(a);await load();}
        }}/>}
        {modal?.type==='student' && <StudentModal student={modal.data} accounts={accounts} onClose={()=>setModal(null)} onSave={handleSaveStudent}/>}
        {modal?.type==='pay' && <PayCalendarModal student={modal.student} onClose={()=>setModal(null)} onUpdate={load}/>}
        {modal?.type==='ad' && <AdModal onClose={()=>setModal(null)} onSave={async ad=>{await saveAd(ad);await load();}}/>}
      </main>
    </div>
  );
}
