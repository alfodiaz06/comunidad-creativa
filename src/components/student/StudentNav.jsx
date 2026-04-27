import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Flame, LogOut, Shield } from 'lucide-react';

export default function StudentNav() {
  const { profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <nav className="sticky top-0 z-40 glass-strong border-b border-white/5 px-4 sm:px-6 h-14 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
          <Flame className="w-3.5 h-3.5 text-brand-400" />
        </div>
        <span className="font-display font-bold text-white text-sm sm:text-base truncate">Comunidad Creativa</span>
      </Link>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isAdmin && (
          <Link to="/admin" className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3">
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}
        <div className="flex items-center gap-2 pl-2 border-l border-white/5">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-display font-semibold text-slate-200 leading-tight">{profile?.displayName || 'Usuario'}</div>
            <div className="text-xs text-slate-500 font-mono leading-tight">{profile?.email}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-display font-bold text-sm">
            {(profile?.displayName || profile?.email || 'U')[0].toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn-ghost p-2" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
