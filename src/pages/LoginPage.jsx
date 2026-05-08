import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Navigate after login — isAdmin will be updated
      // We check profile role after login
      navigate('/dashboard');
    } catch (err) {
      const messages = {
        'auth/invalid-credential': 'Credenciales incorrectas.',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
        'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
      };
      setError(messages[err.code] || err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-aurora-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-jade-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-aurora-500/10 border border-aurora-500/20 mb-4">
            <BookOpen className="w-7 h-7 text-aurora-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Comunidad Creativa</h1>
          <p className="text-slate-500 text-sm mt-1 font-body">Plataforma de aprendizaje privada</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8">
          <h2 className="font-display text-lg font-semibold text-white mb-6">Iniciar sesión</h2>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6 font-body">
            Acceso solo por invitación del administrador
          </p>
        </div>
      </div>
    </div>
  );
}
