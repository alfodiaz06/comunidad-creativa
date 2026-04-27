import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, LogOut, Settings, Shield } from 'lucide-react';

export default function StudentNav() {
  const { profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 glass-strong border-b border-white/5 px-6 h-14 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-aurora-500/15 border border-aurora-500/20 flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5 text-aurora-400" />
        </div>
        <span className="font-display font-bold text-white text-base">EduVault</span>
      </Link>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link to="/admin" className="btn-ghost flex items-center gap-1.5 text-xs">
            <Shield className="w-3.5 h-3.5 text-aurora-400" />
            Admin
          </Link>
        )}
        <div className="flex items-center gap-3 pl-3 border-l border-white/5">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-display font-semibold text-slate-200">{profile?.displayName || 'Usuario'}</div>
            <div className="text-xs text-slate-500 font-mono">{profile?.email}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-aurora-500/20 border border-aurora-500/30 flex items-center justify-center text-aurora-400 font-display font-bold text-sm">
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
