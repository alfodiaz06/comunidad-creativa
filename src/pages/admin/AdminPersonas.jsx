import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllCourses, getUserAssignedCourses, assignCourseToUser, removeCourseFromUser } from '../../lib/db';
import { getAccounts, getStudents, saveStudent, deleteStudent, removeStudentFromAccount, assignStudentToAccount, statusAccount, fmt, month, money, today, uid, add30 } from '../../lib/logistics';
import { apiCreateUser } from '../../lib/api';
import AdminNav from '../../components/admin/AdminNav';
import { Plus, Pencil, Trash2, X, Check, Search, Calendar, Eye, EyeOff, Copy, RefreshCw, AlertCircle } from 'lucide-react';

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function PayBadge({ paid }) {
  return paid
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-jade-500/15 text-jade-400 border border-jade-500/20"><Check className="w-2.5 h-2.5"/>Pagado</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/15 text-amber-400 border border-amber-500/20"><AlertCircle className="w-2.5 h-2.5"/>Pendiente</span>;
}

// ── Edit Pay Modal
function EditPayModal({ payment, onClose, onSave }) {
  const [form, setForm] = useState({ amount: payment?.amount || 80000, paid: payment?.paid || false });
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-xs animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">Editar pago</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Monto (COP)</label>
            <input className="input-field font-mono" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:parseInt(e.target.value)||0}))}/>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setForm(f=>({...f,paid:!f.paid}))}
              className={`w-10 h-6 rounded-full transition-all relative ${form.paid?'bg-jade-500':'bg-obsidian-600'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.paid?'left-5':'left-1'}`}/>
            </button>
            <span className="text-sm font-body text-slate-300">{form.paid ? 'Pagado' : 'Pendiente'}</span>
          </div>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={async()=>{setLoading(true);try{await onSave(form);}finally{setLoading(false);}}}
            disabled={loading} className="btn-primary flex items-center gap-2">
            {loading?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<Check className="w-4 h-4"/>}
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
  const [editingPay, setEditingPay] = useState(null);
  const m = month();

  const allMonths = () => {
    const months=[];
    const start=new Date(student.startDate||today());
    const now=new Date();
    let cur=new Date(start.getFullYear(),start.getMonth(),1);
    while(cur<=now){ months.push(cur.toISOString().slice(0,7)); cur.setMonth(cur.getMonth()+1); }
    return months;
  };

  const savePayments = async (newP) => {
    setPayments(newP);
    setLoading(true);
    try { await saveStudent({...student,payments:newP}); onUpdate(); }
    finally { setLoading(false); }
  };

  const toggleMonth = async (mk) => {
    const existing=payments.find(p=>p.month===mk);
    let newP;
    if(existing){ newP=payments.map(p=>p.month===mk?{...p,paid:!p.paid}:p); }
    else{ newP=[...payments,{month:mk,paid:true,amount:payments.length===0?80000:60000}]; }
    await savePayments(newP);
  };

  const handleEditPay = async (mk, form) => {
    const existing=payments.find(p=>p.month===mk);
    let newP;
    if(existing){ newP=payments.map(p=>p.month===mk?{...p,...form}:p); }
    else{ newP=[...payments,{month:mk,...form}]; }
    await savePayments(newP);
    setEditingPay(null);
  };

  const addNextMonth = async () => {
    const months=allMonths();
    const last=months[months.length-1];
    const [y,mo]=last.split('-');
    const next=new Date(parseInt(y),parseInt(mo),1).toISOString().slice(0,7);
    await savePayments([...payments,{month:next,paid:false,amount:60000}]);
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
                <div className="flex items-center gap-1.5">
                  <PayBadge paid={paid}/>
                  <button onClick={()=>setEditingPay({mk, p:{amount:amt,paid:paid||false}})}
                    className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors" title="Editar pago">
                    <Pencil className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={()=>toggleMonth(mk)} disabled={loading}
                    className="px-2.5 py-1 rounded-lg text-xs font-display font-semibold bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                    {paid?'Revertir':'✓'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-white/5">
          <div className="flex justify-between text-xs font-mono mb-3">
            <span className="text-slate-500">Pagado: <span className="text-jade-400">{money(totalPaid)}</span></span>
            <span className="text-slate-500">Pendiente: <span className="text-amber-400">{money(totalPending)}</span></span>
            <span className="text-slate-500">{months.length} mes{months.length!==1?'es':''}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="btn-ghost">Cerrar</button>
            <button onClick={addNextMonth} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4"/> Agregar mes
            </button>
          </div>
        </div>
      </div>
      {editingPay && (
        <EditPayModal
          payment={editingPay.p}
          onClose={()=>setEditingPay(null)}
          onSave={(form)=>handleEditPay(editingPay.mk, form)}
        />
      )}
    </div>
  );
}

// ── Person Modal
function PersonModal({ person, accounts, courses, onClose, onSave }) {
  const availableAccounts = accounts.filter(a =>
    (!a.blocked && Object.values(a.slots||{}).some(s=>s===null)) ||
    (person?.studentId && Object.values(a.slots||{}).includes(person.studentId))
  );
  const [form, setForm] = useState({
    displayName: person?.displayName || '',
    whatsapp: person?.whatsapp || '',
    email: person?.email || '',
    startDate: person?.startDate || today(),
    accountId: person?.accountId || availableAccounts[0]?.id || '',
    role: person?.role || 'student',
    disabled: person?.disabled || false,
  });
  const [password] = useState(generatePassword());
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);
  const [assignedCourseIds, setAssignedCourseIds] = useState(person?.courseIds || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState('info');

  const toggleCourse = id => setAssignedCourseIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const copyPassword = () => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const handleSave = async () => {
    if (!form.displayName) { setError('El nombre es requerido.'); return; }
    if (!person && !form.email) { setError('El correo es requerido para crear acceso.'); return; }
    setLoading(true);
    try { await onSave(person, form, assignedCourseIds, password); onClose(); }
    catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg animate-slide-up max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{person?`✏️ ${person.displayName}`:'➕ Nueva persona'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex gap-1 px-5 pt-4">
          {['info','logistica','acceso'].map(s=>(
            <button key={s} onClick={()=>setSection(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all capitalize
                ${section===s?'bg-brand-500/15 text-brand-300 border border-brand-500/20':'text-slate-500 hover:bg-white/5'}`}>
              {s==='info'?'Información':s==='logistica'?'Logística':'Acceso'}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {error&&<div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          {section==='info'&&<>
            <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Nombre completo</label>
              <input className="input-field" value={form.displayName} onChange={e=>setForm(f=>({...f,displayName:e.target.value}))} placeholder="Juan García"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">WhatsApp</label>
                <input className="input-field font-mono" value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} placeholder="3001234567"/></div>
              <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Fecha de inicio</label>
                <input className="input-field text-sm" type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Rol</label>
                <select className="input-field" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                  <option value="student">Estudiante</option>
                  <option value="admin">Administrador</option>
                </select></div>
              <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Estado</label>
                <select className="input-field" value={form.disabled?'disabled':'active'} onChange={e=>setForm(f=>({...f,disabled:e.target.value==='disabled'}))}>
                  <option value="active">Activo</option>
                  <option value="disabled">Deshabilitado</option>
                </select></div>
            </div>
          </>}

          {section==='logistica'&&<>
            <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Cuenta logística asignada</label>
              <select className="input-field" value={form.accountId} onChange={e=>setForm(f=>({...f,accountId:e.target.value}))}>
                <option value="">Sin cuenta</option>
                {availableAccounts.map(a=>{
                  const free=Object.values(a.slots||{}).filter(s=>s===null).length;
                  return <option key={a.id} value={a.id}>{a.email} ({free} libre{free!==1?'s':''})</option>;
                })}
              </select>
            </div>
            <p className="text-xs text-slate-500">Solo se muestran cuentas con slots disponibles y no bloqueadas.</p>
          </>}

          {section==='acceso'&&<>
            <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Correo electrónico</label>
              <input className="input-field" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="correo@gmail.com" disabled={!!person?.uid}/></div>
            {!person?(
              <>
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs">✨ La cuenta de acceso se creará automáticamente.</div>
                <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Contraseña generada</label>
                  <div className="relative">
                    <input className="input-field font-mono text-sm pr-24" type={showPass?'text':'password'} value={password} readOnly/>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button onClick={()=>setShowPass(s=>!s)} className="p-1.5 text-slate-500 hover:text-slate-200">{showPass?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
                      <button onClick={copyPassword} className={`p-1.5 transition-colors ${copied?'text-jade-400':'text-slate-500 hover:text-brand-400'}`}>{copied?<Check className="w-3.5 h-3.5"/>:<Copy className="w-3.5 h-3.5"/>}</button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">📋 Copia esta contraseña para enviársela.</p>
                </div>
              </>
            ):(
              <div className="p-3 rounded-xl bg-obsidian-700 text-xs text-slate-400 font-mono">Para cambiar contraseña ve a Firebase Console → Authentication.</div>
            )}
            <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Cursos asignados</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {courses.map(c=>(
                  <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-obsidian-700 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${assignedCourseIds.includes(c.id)?'bg-brand-500 border-brand-500':'border-white/20'}`}>
                      {assignedCourseIds.includes(c.id)&&<Check className="w-2.5 h-2.5 text-white"/>}
                    </div>
                    <input type="checkbox" className="sr-only" checked={assignedCourseIds.includes(c.id)} onChange={()=>toggleCourse(c.id)}/>
                    <span className="text-xs font-body text-slate-300">{c.emoji} {c.title}</span>
                  </label>
                ))}
                {courses.length===0&&<p className="text-xs text-slate-500">Sin cursos disponibles</p>}
              </div>
            </div>
          </>}
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading||!form.displayName} className="btn-primary flex items-center gap-2">
            {loading?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<Check className="w-4 h-4"/>}
            {loading?'Guardando...':'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN
export default function AdminPersonas() {
  const [accounts, setAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [payModal, setPayModal] = useState(null);
  const m = month();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accs,sts,crs] = await Promise.all([getAccounts(), getStudents(), getAllCourses()]);
      setAccounts(accs); setStudents(sts); setCourses(crs);
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  const active = students.filter(s=>!s.deletedAt);
  const persons = active.map(st=>{
    const acc=accounts.find(a=>a.id===st.accountId);
    const pay=(st.payments||[]).find(p=>p.month===m);
    const total=(st.payments||[]).filter(p=>p.paid).reduce((s,p)=>s+p.amount,0);
    return { studentId:st.id, displayName:st.name, whatsapp:st.whatsapp, email:st.email||'', startDate:st.startDate, accountId:st.accountId, accountEmail:acc?.email||'—', payments:st.payments||[], paid:pay?.paid||false, payAmount:pay?.amount||((st.payments||[]).length>1?60000:80000), totalPaid:total, role:st.role||'student', disabled:st.disabled||false, uid:st.uid||null, courseIds:st.courseIds||[] };
  });

  const filtered = persons.filter(p=>{
    if(search&&!p.displayName?.toLowerCase().includes(search.toLowerCase())&&!p.whatsapp?.includes(search)&&!p.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if(filter==='paid') return p.paid;
    if(filter==='pending') return !p.paid;
    return true;
  });

  const handleSave = async (existing, form, courseIds, password) => {
    if(existing){
      const st=students.find(s=>s.id===existing.studentId);
      if(!st) return;
      const updated={...st,name:form.displayName,whatsapp:form.whatsapp,email:form.email,startDate:form.startDate,role:form.role,disabled:form.disabled,courseIds};
      if(form.accountId!==st.accountId){
        await removeStudentFromAccount(accounts,st.id);
        updated.accountId=form.accountId||null;
        await saveStudent(updated);
        if(form.accountId) await assignStudentToAccount(accounts,form.accountId,st.id);
      } else { await saveStudent(updated); }
      if(st.uid){
        const currentCourses=await getUserAssignedCourses(st.uid);
        const toAdd=courseIds.filter(id=>!currentCourses.includes(id));
        const toRemove=currentCourses.filter(id=>!courseIds.includes(id));
        await Promise.all([...toAdd.map(id=>assignCourseToUser(st.uid,id)),...toRemove.map(id=>removeCourseFromUser(st.uid,id))]);
      }
    } else {
      let uid_firebase=null;
      if(form.email){
        try{
          const result=await apiCreateUser({email:form.email,password,displayName:form.displayName,role:form.role});
          uid_firebase=result.uid;
          if(uid_firebase&&courseIds.length>0) await Promise.all(courseIds.map(id=>assignCourseToUser(uid_firebase,id)));
        }catch(e){ console.warn('Auth:',e.message); }
      }
      const newSt={id:uid(),name:form.displayName,whatsapp:form.whatsapp,email:form.email,startDate:form.startDate,accountId:form.accountId||null,payments:[],deletedAt:null,role:form.role,disabled:form.disabled,uid:uid_firebase,courseIds};
      await saveStudent(newSt);
      if(form.accountId) await assignStudentToAccount(accounts,form.accountId,newSt.id);
    }
    await load();
  };

  const handleTogglePay = async (person) => {
    const st=students.find(s=>s.id===person.studentId); if(!st) return;
    const pays=[...(st.payments||[])];
    const idx=pays.findIndex(p=>p.month===m);
    if(idx>=0){pays[idx]={...pays[idx],paid:!pays[idx].paid};}
    else{pays.push({month:m,paid:true,amount:pays.length===0?80000:60000});}
    await saveStudent({...st,payments:pays}); await load();
  };

  const handleDelete = async (person) => {
    if(!confirm(`¿Mover a "${person.displayName}" a la papelera?`)) return;
    const st=students.find(s=>s.id===person.studentId); if(!st) return;
    await removeStudentFromAccount(accounts,st.id);
    await saveStudent({...st,deletedAt:new Date().toISOString(),accountId:null});
    await load();
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav/>
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Personas</h1>
              <p className="text-slate-500 text-sm mt-1">{active.length} registradas · {persons.filter(p=>p.paid).length} pagadas este mes</p>
            </div>
            <button onClick={()=>setModal({type:'new'})} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4"/> Nueva persona
            </button>
          </div>
          <div className="flex flex-wrap gap-3 items-center mb-5">
            <div className="flex gap-2">
              {['all','paid','pending'].map(f=>(
                <button key={f} onClick={()=>setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all
                    ${filter===f?'bg-brand-500/15 text-brand-300 border border-brand-500/20':'text-slate-500 hover:bg-white/5'}`}>
                  {f==='all'?`Todos (${persons.length})`:f==='paid'?`Pagados (${persons.filter(p=>p.paid).length})`:`Pendientes (${persons.filter(p=>!p.paid).length})`}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
              <input className="input-field pl-11" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          {loading?(
            <div className="flex items-center justify-center h-48"><div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>
          ):(
            <div className="card overflow-hidden p-0 animate-slide-up">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-white/5">
                    {['Persona','WhatsApp','Cuenta','Inicio','Total',`${m}`,'Acciones'].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(p=>(
                      <tr key={p.studentId} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs flex-shrink-0">
                              {p.displayName[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-display text-sm text-slate-200">{p.displayName}</div>
                              <div className="text-xs font-mono text-slate-500">{p.email||'Sin correo'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-300">{p.whatsapp}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[140px] truncate">{p.accountEmail}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{fmt(p.startDate)}</td>
                        <td className="px-4 py-3 font-mono text-sm text-jade-400">{money(p.totalPaid)}</td>
                        <td className="px-4 py-3"><PayBadge paid={p.paid}/></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={()=>handleTogglePay(p)}
                              className={`px-2 py-1 rounded-lg text-xs font-display font-semibold transition-all whitespace-nowrap
                                ${p.paid?'bg-white/5 text-slate-400 hover:bg-white/10':'bg-jade-500/15 text-jade-400 hover:bg-jade-500/25'}`}>
                              {p.paid?'Revertir':'✓ Pagado'}
                            </button>
                            <button onClick={()=>{const st=students.find(s=>s.id===p.studentId);if(st)setPayModal(st);}}
                              className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors" title="Historial de pagos">
                              <Calendar className="w-3.5 h-3.5"/>
                            </button>
                            <button onClick={()=>setModal({type:'edit',person:p})}
                              className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors" title="Editar">
                              <Pencil className="w-3.5 h-3.5"/>
                            </button>
                            <button onClick={()=>handleDelete(p)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length===0&&<div className="text-center py-16 text-slate-500 text-sm">Sin personas</div>}
              </div>
            </div>
          )}
        </div>
      </main>
      {modal&&<PersonModal person={modal.type==='edit'?modal.person:null} accounts={accounts} courses={courses} onClose={()=>setModal(null)} onSave={handleSave}/>}
      {payModal&&<PayCalendarModal student={payModal} onClose={()=>setPayModal(null)} onUpdate={load}/>}
    </div>
  );
}
