import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Users, LayoutDashboard, LogOut, ChevronRight, Shield, Flame, KeyRound, TrendingUp, Trash2 } from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/personas', label: 'Personas', icon: Users },
  { to: '/admin/cuentas', label: 'Cuentas', icon: KeyRound },
  { to: '/admin/courses', label: 'Cursos', icon: BookOpen },
  { to: '/admin/torre', label: 'Torre', icon: TrendingUp },
];

export default function AdminNav() {
  const { pathname } = useLocation();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const isActive = (item) => item.exact ? pathname === item.to : pathname.startsWith(item.to);

  return (
    <aside className="w-56 xl:w-60 min-h-screen glass-strong border-r border-white/5 flex flex-col flex-shrink-0">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
            <Flame className="w-4 h-4 text-brand-400"/>
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm leading-tight">Comunidad</div>
            <div className="font-display font-bold text-brand-400 text-sm leading-tight">Creativa</div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-brand-400/70 font-mono">
          <Shield className="w-2.5 h-2.5"/> Panel Admin
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <Link key={item.to} to={item.to} className={isActive(item)?'sidebar-item-active':'sidebar-item-inactive'}>
            <item.icon className="w-4 h-4 flex-shrink-0"/>
            <span className="text-sm">{item.label}</span>
            {isActive(item)&&<ChevronRight className="w-3.5 h-3.5 ml-auto"/>}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/5">
        <Link to="/dashboard" className="sidebar-item-inactive mb-2 text-xs">← Vista de estudiante</Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
            {(profile?.displayName||profile?.email||'A')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-display font-semibold text-slate-200 truncate">{profile?.displayName||'Admin'}</div>
            <div className="text-xs text-slate-500 truncate font-mono">{profile?.email}</div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1">
            <LogOut className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
    </aside>
  );
}
