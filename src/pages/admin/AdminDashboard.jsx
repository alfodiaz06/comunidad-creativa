import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, getAllCourses } from '../../lib/db';
import AdminNav from '../../components/admin/AdminNav';
import { Users, BookOpen, ChevronRight, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, courses: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, courses] = await Promise.all([getAllUsers(), getAllCourses()]);
        setStats({ users: users.length, courses: courses.length });
        setRecentUsers(users.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-2xl font-bold text-white">Panel de administración</h1>
            <p className="text-slate-500 text-sm font-body mt-1">Gestiona usuarios, cursos y contenido.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-slide-up">
            {[
              { icon: Users, label: 'Usuarios registrados', value: stats.users, color: 'aurora', link: '/admin/users' },
              { icon: BookOpen, label: 'Cursos creados', value: stats.courses, color: 'jade', link: '/admin/courses' },
              { icon: TrendingUp, label: 'Plataforma activa', value: '✓', color: 'ember', link: null },
            ].map(({ icon: Icon, label, value, color, link }) => {
              const colorMap = { aurora: 'text-aurora-400 bg-aurora-500/10 border-aurora-500/20', jade: 'text-jade-400 bg-jade-500/10 border-jade-500/20', ember: 'text-ember-400 bg-ember-500/10 border-ember-500/20' };
              const card = (
                <div className={`card flex items-center gap-4 ${link ? 'cursor-pointer hover:bg-obsidian-700/60 transition-colors' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`font-display text-2xl font-bold ${colorMap[color].split(' ')[0]}`}>
                      {loading ? '–' : value}
                    </div>
                    <div className="text-xs text-slate-500 font-body">{label}</div>
                  </div>
                  {link && <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />}
                </div>
              );
              return link ? <Link key={label} to={link}>{card}</Link> : <div key={label}>{card}</div>;
            })}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Link to="/admin/courses" className="card-hover flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-aurora-500/10 border border-aurora-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-aurora-400" />
              </div>
              <div>
                <div className="font-display font-semibold text-white text-sm">Gestionar cursos</div>
                <div className="text-xs text-slate-500 font-body">Crear módulos y lecciones</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
            </Link>
            <Link to="/admin/users" className="card-hover flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-jade-500/10 border border-jade-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-jade-400" />
              </div>
              <div>
                <div className="font-display font-semibold text-white text-sm">Gestionar usuarios</div>
                <div className="text-xs text-slate-500 font-body">Crear accesos y asignar cursos</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
            </Link>
          </div>

          {/* Recent users */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-white text-sm">Usuarios recientes</h2>
              <Link to="/admin/users" className="text-xs text-aurora-400 hover:text-aurora-300 transition-colors font-body">
                Ver todos →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 shimmer-loading rounded-lg" />)}
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="text-slate-500 text-sm font-body text-center py-6">Sin usuarios aún.</p>
            ) : (
              <div className="space-y-2">
                {recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-obsidian-600 border border-white/10 flex items-center justify-center text-xs font-display font-bold text-slate-400">
                      {(u.displayName || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-display text-slate-200 truncate">{u.displayName || '–'}</div>
                      <div className="text-xs font-mono text-slate-500 truncate">{u.email}</div>
                    </div>
                    <span className={u.role === 'admin' ? 'badge-aurora' : 'badge bg-white/5 text-slate-500 border border-white/10'}>
                      {u.role || 'student'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
