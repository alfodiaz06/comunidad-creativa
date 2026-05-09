import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, getAllCourses } from '../../lib/db';
import { getAccounts, getStudents, getAds, statusAccount, money, month, fmt } from '../../lib/logistics';
import AdminNav from '../../components/admin/AdminNav';
import { Users, BookOpen, ChevronRight, TrendingUp, DollarSign, AlertCircle, Check } from 'lucide-react';
import DateRangePicker, { getRange, parseDateKey } from '../../components/shared/DateRangePicker';

function KpiCard({ label, value, sub, color = 'brand', onClick }) {
  const colors = { brand: 'text-brand-400', jade: 'text-jade-400', amber: 'text-amber-400', red: 'text-red-400', slate: 'text-slate-300' };
  return (
    <div className={`card ${onClick ? 'cursor-pointer hover:bg-obsidian-700/60 transition-all' : ''}`} onClick={onClick}>
      <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider leading-tight">{label}</div>
      <div className={`font-display text-2xl font-bold ${colors[color]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5 font-mono">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState('30d');
  const [rangeCustom, setRangeCustom] = useState({});

  const handleRangeChange = (key, custom) => {
    setRangeKey(key);
    setRangeCustom(custom || {});
  };
  const m = month();

  useEffect(() => {
    const load = async () => {
      try {
        const [users, courses, accounts, students, ads] = await Promise.all([
          getAllUsers(), getAllCourses(), getAccounts(), getStudents(), getAds()
        ]);
        const active = students.filter(s => !s.deletedAt);
        // Get most recent payment for each student (current 30-day period)
        const getCurrentPay = (st) => {
          const pays = st.payments || [];
          if (!pays.length) return null;
          return [...pays].sort((a, b) => {
            const da = new Date(a.month?.length === 7 ? a.month + '-01' : a.month || 0);
            const db = new Date(b.month?.length === 7 ? b.month + '-01' : b.month || 0);
            return db - da;
          })[0];
        };
        const mPaid = active.reduce((sum, st) => {
          const p = getCurrentPay(st);
          return sum + (p?.paid ? p.amount : 0);
        }, 0);
        const mPending = active.reduce((sum, st) => {
          const pays = st.payments || [];
          const p = getCurrentPay(st);
          if (p?.paid) return sum;
          return sum + (p?.amount || (pays.length > 1 ? 60000 : 80000));
        }, 0);
        const totalHistoric = active.reduce((sum, st) =>
          sum + (st.payments || []).filter(p => p.paid).reduce((a, p) => a + p.amount, 0), 0);
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30);
        const totalAdsMonth = ads.filter(a => a.date && new Date(a.date) >= thirtyDaysAgo).reduce((s, a) => s + a.amount, 0);
        setData({ users, courses, accounts, active, mPaid, mPending, totalHistoric, totalAdsMonth, ads });
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <AdminNav />
      <main className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
      </main>
    </div>
  );

  const { users, courses, accounts, active, mPaid, mPending, totalHistoric, totalAdsMonth } = data;

  const getCurrentPaySimple = (st) => {
    const pays = st.payments || [];
    if (!pays.length) return null;
    return [...pays].sort((a,b) => new Date(b.month?.length===7?b.month+'-01':b.month||0) - new Date(a.month?.length===7?a.month+'-01':a.month||0))[0];
  };


  // ── CORE CALCULATION ENGINE ──
  const range = getRange(rangeKey, rangeCustom);

  const parseKey = (key) => {
    if (!key) return null;
    if (key.length === 7) { const [y,m] = key.split('-').map(Number); return new Date(y, m-1, 1); }
    if (key.length === 10) { const [y,m,d] = key.split('-').map(Number); return new Date(y, m-1, d); }
    return null;
  };

  const inRange = (dateKey) => {
    const d = parseKey(dateKey);
    if (!d) return false;
    return d.getTime() >= range.from.getTime() && d.getTime() <= range.to.getTime();
  };

  const getLatestPay = (st) => {
    const pays = [...(st.payments||[])].sort((a,b)=>{
      const da = parseKey(a.month)||new Date(0);
      const db = parseKey(b.month)||new Date(0);
      return db-da;
    });
    return pays[0]||null;
  };

  // Ingresos = pagos pagados dentro del rango
  const ingresos = active.reduce((sum,st)=>
    sum+(st.payments||[]).filter(p=>p.paid&&inRange(p.month)).reduce((s,p)=>s+(p.amount||0),0),0);

  // Pendiente = estudiantes cuyo último pago no está pagado
  const pendingStudents = active.filter(st=>!getLatestPay(st)?.paid);
  const pendiente = pendingStudents.reduce((sum,st)=>{
    const p=getLatestPay(st);
    const pays=st.payments||[];
    return sum+(p?.amount||(pays.length>0?60000:80000));
  },0);

  // Publicidad dentro del rango
  const publicidad = ads.filter(a=>inRange(a.date)).reduce((s,a)=>s+(a.amount||0),0);

  // Históricos (siempre todo)
  const totalHistorico = active.reduce((sum,st)=>
    sum+(st.payments||[]).filter(p=>p.paid).reduce((s,p)=>s+(p.amount||0),0),0);
  const publicidadTotal = ads.reduce((s,a)=>s+(a.amount||0),0);

  // Ganancias
  const gananciaNeta = ingresos - publicidad;
  const gananciaTotalHistorica = totalHistorico - publicidadTotal;


  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <AdminNav />
      <main className="flex-1 lg:overflow-auto p-4 pt-16 lg:pt-8 sm:px-6 lg:px-8 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-fade-in flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Panel de administración</h1>
              <p className="text-slate-500 text-sm mt-1">Vista general de toda la plataforma</p>
            </div>
            <DateRangePicker value={rangeKey} onChange={handleRangeChange}/>
          </div>

          {/* KPIs principales */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 animate-slide-up">
            <KpiCard label="Personas registradas" value={active.length} sub={`${users.length} con acceso`} color="brand" />
            <KpiCard label="Cuentas activas" value={activeAccounts.length} sub={`${accounts.filter(a=>statusAccount(a.expiresAt)==='expired').length} vencidas`} color="jade" />
            <KpiCard label="Cursos" value={courses.length} color="slate" />
            <KpiCard label="Ingresos" value={money(ingresos)} sub="período seleccionado" color="jade" />
            <KpiCard label="Pendiente actual" value={money(pendiente)} sub={`${pendingStudents.length} persona${pendingStudents.length!==1?'s':''}`} color="amber" />
            <KpiCard label="Ganancia neta" value={money(gananciaNeta)} sub="ingresos - publicidad" color="jade" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* Accesos rápidos */}
            <div className="card lg:col-span-1">
              <h2 className="font-display font-semibold text-white text-sm mb-4">Accesos rápidos</h2>
              <div className="space-y-2">
                {[
                  { to: '/admin/personas', icon: Users, label: 'Gestionar personas', sub: `${active.length} registradas`, color: 'text-brand-400' },
                  { to: '/admin/cuentas', icon: BookOpen, label: 'Gestionar cuentas', sub: `${activeAccounts.length} activas`, color: 'text-jade-400' },
                  { to: '/admin/courses', icon: BookOpen, label: 'Gestionar cursos', sub: `${courses.length} cursos`, color: 'text-slate-400' },
                  { to: '/admin/torre', icon: TrendingUp, label: 'Torre logística', sub: `${money(totalHistoric)} histórico`, color: 'text-amber-400' },
                ].map(({ to, icon: Icon, label, sub, color }) => (
                  <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-display text-slate-200">{label}</div>
                      <div className="text-xs font-mono text-slate-500">{sub}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Pendientes de pago */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" /> Pendientes de pago
                </h2>
                <Link to="/admin/torre" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Ver todo →</Link>
              </div>
              {pendingStudents.length === 0 ? (
                <div className="flex items-center gap-2 text-jade-400 text-sm font-body">
                  <Check className="w-4 h-4" /> Todos al día
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingStudents.slice(0, 8).map(st => {
                    const acc = accounts.find(a => a.id === st.accountId);
                    const pays = st.payments || [];
                    const currentPay = getCurrentPaySimple(st); const amt = currentPay?.amount || (pays.length > 1 ? 60000 : 80000);
                    return (
                      <div key={st.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0">
                          {st.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-display text-slate-200">{st.name}</div>
                          <div className="text-xs font-mono text-slate-500">{st.whatsapp} · {acc?.email || '—'}</div>
                        </div>
                        <span className="text-sm font-mono text-amber-400 flex-shrink-0">{money(amt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Resumen de cuentas */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-white text-sm">Resumen de cuentas</h2>
              <Link to="/admin/cuentas" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Gestionar →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {accounts.map(acc => {
                const occupied = Object.values(acc.slots || {}).filter(Boolean).length;
                const st = statusAccount(acc.expiresAt);
                return (
                  <Link key={acc.id} to="/admin/cuentas" className="p-3 rounded-xl bg-obsidian-700 border border-white/5 hover:border-brand-500/20 transition-all block">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${st === 'active' ? 'bg-jade-400' : st === 'expiring' ? 'bg-amber-400' : 'bg-red-400'}`} />
                      <span className="text-xs font-mono text-slate-300 truncate">{acc.email}</span>
                    </div>
                    <div className="flex gap-0.5 mb-1">
                      {[0,1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${acc.slots?.[i] ? 'bg-brand-500' : 'bg-obsidian-600'}`} />
                      ))}
                    </div>
                    <div className="text-xs font-mono text-slate-500">{occupied}/5 · Vence {fmt(acc.expiresAt)}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
