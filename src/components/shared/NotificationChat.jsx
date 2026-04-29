import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getStudents } from '../../lib/logistics';
import { listenNotifications, markAllRead, getLastRead, timeAgo } from '../../lib/notifications';
import { MessageCircle, X, Bell, Check, CheckCheck, Zap, Key, Mail } from 'lucide-react';

const ICON_MAP = {
  credentials: Key,
  password: Key,
  email: Mail,
  update: Zap,
  default: Bell,
};

function NotifIcon({ type }) {
  const Icon = ICON_MAP[type] || ICON_MAP.default;
  const colors = {
    credentials: 'bg-brand-500/20 text-brand-400',
    password: 'bg-amber-500/20 text-amber-400',
    email: 'bg-blue-500/20 text-blue-400',
    update: 'bg-jade-500/20 text-jade-400',
    default: 'bg-slate-500/20 text-slate-400',
  };
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colors[type] || colors.default}`}>
      <Icon className="w-4 h-4"/>
    </div>
  );
}

export default function NotificationChat() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const isAdmin = profile?.role === 'admin';

  // Find student's accountId
  useEffect(() => {
    if (!user || isAdmin) return;
    const findAccount = async () => {
      try {
        const students = await getStudents();
        const me = students.find(s => s.uid === user.uid || s.email === user.email);
        if (me?.accountId) setAccountId(me.accountId);
      } catch(e) { console.error(e); }
    };
    findAccount();
  }, [user, isAdmin]);

  // Listen to notifications
  useEffect(() => {
    if (!accountId) return;
    const unsub = listenNotifications(accountId, (notifs) => {
      setNotifications(notifs);
      const lastRead = getLastRead(accountId);
      const newUnread = notifs.filter(n => (n.createdAt || 0) > lastRead).length;
      setUnread(newUnread);
    });
    return unsub;
  }, [accountId]);

  // Scroll to bottom when new messages
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notifications, open]);

  // Mark read when opened
  useEffect(() => {
    if (open && accountId) {
      markAllRead(accountId);
      setUnread(0);
    }
  }, [open, accountId]);

  // Don't show for admin or if no account
  if (isAdmin || !accountId) return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-80 sm:w-96 animate-slide-up">
          <div className="glass-strong rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden" style={{maxHeight:'480px'}}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-brand-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-jade-400 animate-pulse"/>
                <div>
                  <div className="font-display font-semibold text-white text-sm">Notificaciones</div>
                  <div className="text-xs text-slate-500 font-mono">Actualizaciones de tu cuenta</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-white transition-colors p-1">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{minHeight:'200px'}}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Bell className="w-8 h-8 text-slate-700 mb-2"/>
                  <p className="text-slate-500 text-xs font-body">Sin notificaciones todavía</p>
                  <p className="text-slate-600 text-xs mt-1">Aquí verás actualizaciones de tu cuenta</p>
                </div>
              ) : (
                notifications.map((n, idx) => {
                  const lastRead = getLastRead(accountId);
                  const isNew = (n.createdAt || 0) > lastRead && !open;
                  return (
                    <div key={n.id || idx}
                      className={`flex gap-3 p-3 rounded-xl transition-all ${isNew ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-obsidian-700/50'}`}>
                      <NotifIcon type={n.type}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-display font-semibold text-white text-xs">{n.title}</span>
                          <span className="text-xs font-mono text-slate-600 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-xs font-body text-slate-400 leading-relaxed">{n.message}</p>
                        {/* Credentials box */}
                        {(n.email || n.password) && (
                          <div className="mt-2 p-2 rounded-lg bg-obsidian-900 border border-white/5 space-y-1">
                            {n.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-slate-500 flex-shrink-0"/>
                                <span className="text-xs font-mono text-slate-300">{n.email}</span>
                                <button onClick={() => navigator.clipboard.writeText(n.email)}
                                  className="ml-auto text-brand-400 hover:text-brand-300 transition-colors">
                                  <Check className="w-3 h-3"/>
                                </button>
                              </div>
                            )}
                            {n.password && (
                              <div className="flex items-center gap-2">
                                <Key className="w-3 h-3 text-slate-500 flex-shrink-0"/>
                                <span className="text-xs font-mono text-slate-300">{n.password}</span>
                                <button onClick={() => navigator.clipboard.writeText(n.password)}
                                  className="ml-auto text-brand-400 hover:text-brand-300 transition-colors">
                                  <Check className="w-3 h-3"/>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600">{notifications.length} mensaje{notifications.length!==1?'s':''}</span>
              {notifications.length > 0 && (
                <button onClick={() => { markAllRead(accountId); setUnread(0); }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <CheckCheck className="w-3 h-3"/> Marcar todo leído
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating bubble button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
          ${open ? 'bg-obsidian-700 border border-white/10 rotate-0' : 'bg-brand-500 hover:bg-brand-400 hover:scale-110'}`}>
        {open
          ? <X className="w-5 h-5 text-white"/>
          : <MessageCircle className="w-6 h-6 text-white"/>
        }
        {/* Unread badge */}
        {!open && unread > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-obsidian-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">{unread > 9 ? '9+' : unread}</span>
          </div>
        )}
        {/* Pulse ring when unread */}
        {!open && unread > 0 && (
          <div className="absolute inset-0 rounded-full bg-brand-500/40 animate-ping"/>
        )}
      </button>
    </>
  );
}
