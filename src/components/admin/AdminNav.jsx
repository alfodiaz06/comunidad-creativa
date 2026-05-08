import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Users, LayoutDashboard, LogOut, ChevronRight, Shield, Flame, KeyRound, TrendingUp, Trash2, Menu, X, Image } from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/personas', label: 'Personas', icon: Users },
  { to: '/admin/cuentas', label: 'Cuentas', icon: KeyRound },
  { to: '/admin/courses', label: 'Cursos', icon: BookOpen },
  { to: '/admin/resources', label: 'Recursos', icon: Image },
  { to: '/admin/torre', label: 'Torre', icon: TrendingUp },
  { to: '/admin/papelera', label: 'Papelera', icon: Trash2 },
];

export default function AdminNav() {
  const { pathname } = useLocation();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const isActive = (item) => item.exact ? pathname === item.to : pathname.startsWith(item.to);

  const NavContent = () => (
    <>
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#1a64ff,#ff7c00)"}}>
              <Flame className="w-4 h-4 text-white"/>
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm leading-tight">Comunidad</div>
              <div className="font-display font-bold text-brand-400 text-sm leading-tight">Creativa</div>
            </div>
          </div>
          {/* Close button mobile */}
          <button onClick={()=>setOpen(false)} className="lg:hidden text-slate-500 hover:text-white p-1">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-brand-400/70 font-mono">
          <Shield className="w-2.5 h-2.5"/> Panel Admin
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <Link key={item.to} to={item.to}
            onClick={()=>setOpen(false)}
            className={isActive(item)?'sidebar-item-active':'sidebar-item-inactive'}>
            <item.icon className="w-4 h-4 flex-shrink-0"/>
            <span className="text-sm">{item.label}</span>
            {isActive(item)&&<ChevronRight className="w-3.5 h-3.5 ml-auto"/>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <Link to="/dashboard" onClick={()=>setOpen(false)} className="sidebar-item-inactive mb-2 text-xs">← Vista de estudiante</Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
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
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 glass-strong border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:"linear-gradient(135deg,#1a64ff,#ff7c00)"}}>
            <Flame className="w-3.5 h-3.5 text-white"/>
          </div>
          <span className="font-display font-bold text-white text-sm">Comunidad <span className="text-brand-400">Creativa</span></span>
        </div>
        <button onClick={()=>setOpen(true)} className="text-slate-400 hover:text-white p-1">
          <Menu className="w-5 h-5"/>
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setOpen(false)}/>
          <aside className="relative w-64 h-full glass-strong border-r border-white/5 flex flex-col z-10">
            <NavContent/>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 xl:w-60 h-screen sticky top-0 glass-strong border-r border-white/5 flex-col flex-shrink-0 overflow-y-auto">
        <NavContent/>
      </aside>
    </>
  );
}
