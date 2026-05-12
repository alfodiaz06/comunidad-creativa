import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getStudents } from '../../lib/logistics';
import { getNotifications, markAllRead, getLastRead, timeAgo } from '../../lib/notifications';
import { MessageCircle, X, Bell, Key, Mail, CheckCheck } from 'lucide-react';

export default function NotificationChat() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const intervalRef = useRef(null);
  const isAdmin = profile?.role === 'admin';

  // Find student's accountId by uid OR email
  useEffect(() => {
    if (!user || isAdmin) return;
    const findAccount = async () => {
      try {
        const students = await getStudents();
        const activeStudents = students.filter(s => !s.deletedAt);
        let me = activeStudents.find(s => s.uid === user.uid);
        if (!me) me = activeStudents.find(s => s.email?.toLowerCase() === user.email?.toLowerCase());
        if (me?.accountId) setAccountId(me.accountId);
      } catch(e) { console.error(e); }
    };
    findAccount();
  }, [user, isAdmin]);

  const fetchNotifications = useCallback(async () => {
    if (!accountId) return;
    try {
      const notifs = await getNotifications(accountId);
      setNotifications(notifs);
      const lastRead = getLastRead(accountId);
      const newCount = notifs.filter(n => (n.createdAt || 0) > lastRead).length;
      setUnread(newCount);
    } catch(e) { /* silent */ }
  }, [accountId]);

  // Poll every 10 seconds for new notifications
  useEffect(() => {
    if (!accountId) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalRef.current);
  }, [accountId, fetchNotifications]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open && bottomRef.current) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [notifications, open]);

  // Mark read when opened
  useEffect(() => {
    if (open && accountId) {
      markAllRead(accountId);
      setUnread(0);
    }
  }, [open, accountId]);

  // Don't show for admins or users without account
  if (isAdmin || !accountId) return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-80 sm:w-96 animate-slide-up">
          <div className="glass-strong rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
            style={{maxHeight:'480px'}}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-brand-500/10 flex-shrink-0">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Bell className="w-8 h-8 text-slate-700 mb-2"/>
                  <p className="text-slate-500 text-xs">Sin notificaciones todavía</p>
                  <p className="text-slate-600 text-xs mt-1">Aquí verás actualizaciones de tu cuenta</p>
                </div>
              ) : (
                notifications.map((n, idx) => (
                  <div key={n.id || idx}
                    className="flex gap-3 p-3 rounded-xl bg-obsidian-700/60 border border-white/5">
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <Key className="w-4 h-4 text-brand-400"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-display font-semibold text-white text-xs">{n.title}</span>
                        <span className="text-xs font-mono text-slate-600 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{n.message}</p>
                      {/* Credentials box */}
                      {(n.email || n.password) && (
                        <div className="p-2.5 rounded-lg bg-obsidian-900 border border-white/5 space-y-1.5">
                          {n.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-slate-500 flex-shrink-0"/>
                              <span className="text-xs font-mono text-slate-200 flex-1 truncate">{n.email}</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(n.email)}
                                className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                                Copiar
                              </button>
                            </div>
                          )}
                          {n.password && (
                            <div className="flex items-center gap-2">
                              <Key className="w-3 h-3 text-slate-500 flex-shrink-0"/>
                              <span className="text-xs font-mono text-slate-200 flex-1">{n.password}</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(n.password)}
                                className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                                Copiar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-mono text-slate-600">
                {notifications.length} mensaje{notifications.length !== 1 ? 's' : ''}
              </span>
              {unread > 0 && (
                <button onClick={() => { markAllRead(accountId); setUnread(0); }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <CheckCheck className="w-3 h-3"/> Marcar leído
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
          ${open ? 'bg-obsidian-700 border border-white/10' : 'bg-brand-500 hover:bg-brand-400 hover:scale-110'}`}>
        {open
          ? <X className="w-5 h-5 text-white"/>
          : <MessageCircle className="w-6 h-6 text-white"/>
        }
        {/* Badge */}
        {!open && unread > 0 && (
          <>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-obsidian-900 flex items-center justify-center z-10">
              <span className="text-white text-xs font-bold leading-none">{unread > 9 ? '9+' : unread}</span>
            </div>
            <div className="absolute inset-0 rounded-full bg-brand-500/40 animate-ping"/>
          </>
        )}
      </button>
    </>
  );
}
