import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminNav from '../../components/admin/AdminNav';
import { getAccounts, getStudents, getAds, saveAd, deleteAd, saveStudent, statusAccount, money, month, fmt, today } from '../../lib/logistics';
import { Plus, Trash2, X, Check, Megaphone, AlertCircle, UserCheck } from 'lucide-react';
import DateRangePicker, { getRange, parseDateKey } from '../../components/shared/DateRangePicker';

function AdModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', platform:'Facebook Ads', amount:'', date:today() });
  const [loading, setLoading] = useState(false);
  const platforms = ['Facebook Ads','Google Ads','Instagram','TikTok Ads','Otro'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">📢 Registrar gasto</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Plataforma</label>
            <select className="input-field" value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))}>
              {platforms.map(p=><option key={p}>{p}</option>)}
            </select></div>
          <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Descripción</label>
            <input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="1ra Campaña..."/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Monto (COP)</label>
              <input className="input-field font-mono" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="50000"/></div>
            <div><label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Fecha</label>
              <input className="input-field text-sm" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
          </div>
        </div>
        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={async()=>{if(!form.name||!form.amount) return;setLoading(true);try{await onSave({id:'ad_'+Date.now().toString(36),...form,amount:parseInt(form.amount)});onClose();}finally{setLoading(false);}}}
            disabled={loading||!form.name||!form.amount} className="btn-primary flex items-center gap-2">
            {loading?<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>:<Check className="w-4 h-4"/>}
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTorre() {
  const { profile } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [rangeKey, setRangeKey] = useState('30d');
  const [rangeCustom, setRangeCustom] = useState({});
  const [filter, setFilter] = useState('all');
  const m = month();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a,s,ad] = await Promise.all([getAccounts(), getStudents(), getAds()]);
      setAccounts(a); setStudents(s); setAds(ad);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = students.filter(s=>!s.deletedAt);
  // Find current period payment for each student (most recent, based on expiresAt cycle)
  const getCurrentPay = (st) => {
    const pays = st.payments||[];
    if(pays.length===0) return null;
    return [...pays].sort((a,b)=>{
      const da = new Date(a.month?.length===7 ? a.month+'-01' : a.month||0);
      const db = new Date(b.month?.length===7 ? b.month+'-01' : b.month||0);
      return db-da;
    })[0];
  };

  const range = getRange(rangeKey, rangeCustom);

  // Payments in selected range
  const mPaid = active.reduce((sum,st)=>{
    const pays = (st.payments||[]).filter(p => {
      const d = parseDateKey(p.month);
      return p.paid && d && d >= range.from && d <= range.to;
    });
    return sum + pays.reduce((s,p)=>s+p.amount,0);
  },0);

  const mPending = active.reduce((sum,st)=>{
    const pays=st.payments||[];
    const p=getCurrentPay(st);
    if(p?.paid) return sum;
    return sum+(p?.amount||(pays.length>1?60000:80000));
  },0);

  const totalAdsAll = ads.reduce((s,a)=>s+a.amount,0);
  // Ads in selected range
  const totalAdsMonth = ads.filter(a=>{
    if(!a.date) return false;
    const d = parseDateKey(a.date);
    return d >= range.from && d <= range.to;
  }).reduce((s,a)=>s+a.amount,0);

  const totalHistoric = active.reduce((sum,st)=>sum+(st.payments||[]).filter(p=>p.paid).reduce((a,p)=>a+p.amount,0),0);
  const netMonth = mPaid - totalAdsMonth;
  const netTotal = totalHistoric - totalAdsAll;
  const adsByPlatform = ads.reduce((acc,a)=>{acc[a.platform]=(acc[a.platform]||0)+a.amount;return acc;},{});

  // Stats by admin
  const byAdmin = active.reduce((acc, st) => {
    const key = st.addedBy || '—';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const byAdminEntries = Object.entries(byAdmin).sort((a, b) => b[1] - a[1]);
  const withoutAdmin = active.filter(s => !s.addedBy).length;

  const [assigning, setAssigning] = useState(false);
  const handleAssignAll = async () => {
    const adminName = profile?.displayName || profile?.email || 'Alfonso';
    if (!confirm(`¿Asignar "${adminName}" como admin de los ${withoutAdmin} estudiantes sin registro?`)) return;
    setAssigning(true);
    try {
      const unassigned = active.filter(s => !s.addedBy);
      await Promise.all(unassigned.map(st => saveStudent({ ...st, addedBy: adminName })));
      await load();
    } finally { setAssigning(false); }
  };

  const filteredStudents = active.filter(s=>{
    if(filter==='paid'){ const p=getCurrentPay(s); return p?.paid||false; }
    if(filter==='pending'){ const p=getCurrentPay(s); return !p?.paid; }
    return true;
  });


  const handleTogglePay = async (st) => {
    const pays=[...(st.payments||[])];
    const currentPay = getCurrentPay(st);
    const periodKey = currentPay?.month || st.expiresAt || m;
    const idx = pays.findIndex(p=>p.month===periodKey);
    if(idx>=0){pays[idx]={...pays[idx],paid:!pays[idx].paid};}
    else{pays.push({month:periodKey,paid:true,amount:pays.length===0?80000:60000});}
    await saveStudent({...st,payments:pays}); await load();
  };

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <AdminNav/>
      <main className="flex-1 lg:overflow-auto p-4 pt-16 lg:pt-8 sm:px-6 lg:px-8 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Torre Logística</h1>
              <p className="text-slate-500 text-sm mt-1">Contabilidad, pagos y publicidad</p>
            </div>
            <DateRangePicker value={rangeKey} onChange={(key,custom)=>{setRangeKey(key);setRangeCustom(custom||{});}}/>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/></div>
          ) : <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            {[
              {label:'Activos', val:active.length, color:'text-jade-400'},
              {label:'Cuentas', val:accounts.filter(a=>statusAccount(a.expiresAt)!=='expired').length, color:'text-brand-400'},
              {label:"Ingresos actuales", val:money(mPaid), color:'text-jade-400'},
              {label:"Pendiente actual", val:money(mPending), color:'text-amber-400'},
              {label:"Publicidad actual", val:money(totalAdsMonth), color:'text-red-400'},
              {label:"Ganancia neta actual", val:money(netMonth), color:'text-jade-400'},
              {label:'Total histórico', val:money(totalHistoric), color:'text-jade-400'},
              {label:'Ganancia neta total', val:money(netTotal), color:'text-jade-400'},
            ].map(({label,val,color})=>(
              <div key={label} className="card p-3">
                <div className="text-xs font-mono text-slate-500 mb-1 uppercase leading-tight">{label}</div>
                <div className={`font-display text-lg font-bold ${color}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Admin metrics table */}
          <div className="card mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white text-sm">👥 Estudiantes por administrador</h3>
              {withoutAdmin > 0 && (
                <button onClick={handleAssignAll} disabled={assigning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/20 hover:bg-brand-500/25 transition-all">
                  {assigning
                    ? <div className="w-3 h-3 rounded-full border-2 border-brand-400/30 border-t-brand-400 animate-spin"/>
                    : <UserCheck className="w-3.5 h-3.5"/>
                  }
                  Asignarme los {withoutAdmin} sin registro
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-2 text-left text-xs font-mono text-slate-500 uppercase">Administrador</th>
                    <th className="px-4 py-2 text-left text-xs font-mono text-slate-500 uppercase">Estudiantes</th>
                    <th className="px-4 py-2 text-left text-xs font-mono text-slate-500 uppercase">Participación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {byAdminEntries.map(([name, count]) => {
                    const pct = active.length > 0 ? Math.round((count / active.length) * 100) : 0;
                    return (
                      <tr key={name} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 font-display text-sm text-slate-200">{name}</td>
                        <td className="px-4 py-3 font-mono text-sm text-brand-400 font-bold">{count}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-obsidian-700 rounded-full h-2 max-w-[120px]">
                              <div className="h-2 rounded-full bg-brand-500" style={{width:`${pct}%`}}/>
                            </div>
                            <span className="text-xs font-mono text-slate-400">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {byAdminEntries.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-500">Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Ads */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-brand-400"/> Inversión en publicidad
                </h3>
                <button onClick={()=>setModal('ad')} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
                  <Plus className="w-3.5 h-3.5"/> Registrar gasto
                </button>
              </div>
              {ads.length===0 ? <p className="text-slate-500 text-xs">Sin gastos registrados</p> : (
                <div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {ads.sort((a,b)=>b.date?.localeCompare(a.date||'')).map(ad=>(
                      <div key={ad.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-400 font-mono">{ad.platform||'Otro'}</span>
                            <span className="text-xs font-body text-slate-300 truncate">{ad.name||ad.description||ad.desc||'Sin descripción'}</span>
                          </div>
                          <div className="text-xs font-mono text-slate-500 mt-0.5">{fmt(ad.date)}</div>
                        </div>
                        <span className="text-sm font-mono text-red-400 flex-shrink-0">{money(ad.amount)}</span>
                        <button onClick={async()=>{await deleteAd(ad.id);await load();}} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3"/>
                        </button>
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
                  {label:'Últimos 7 días', val:money(ads.filter(a=>{const d=new Date(a.date||'');return(new Date()-d)/86400000<=7;}).reduce((s,a)=>s+a.amount,0)), color:'text-amber-400'},
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
                {Object.entries(adsByPlatform).map(([platform,total])=>(
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
              <h3 className="font-display font-semibold text-white text-sm">Seguimiento actual</h3>
              <div className="flex gap-2">
                {['all','paid','pending'].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-display font-semibold transition-all
                      ${filter===f?'bg-brand-500/15 text-brand-300 border border-brand-500/20':'text-slate-500 hover:bg-white/5'}`}>
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
                    const pay=getCurrentPay(st);
                    const amt=pay?.amount||((st.payments||[]).length>1?60000:80000);
                    return (
                      <tr key={st.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 font-display text-sm text-slate-200">{st.name}</td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-300">{st.whatsapp}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 max-w-[130px] truncate">{acc?.email||'—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">Actual</td>
                        <td className="px-4 py-3 font-mono text-sm text-jade-400">{money(amt)}</td>
                        <td className="px-4 py-3">
                          {pay?.paid
                            ? <span className="text-xs font-mono text-jade-400 flex items-center gap-1"><Check className="w-3 h-3"/>Pagado</span>
                            : <span className="text-xs font-mono text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Pendiente</span>}
                        </td>
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
          </>}
        </div>
      </main>
      {modal==='ad' && <AdModal onClose={()=>setModal(null)} onSave={async ad=>{await saveAd(ad);await load();}}/>}
    </div>
  );
}
