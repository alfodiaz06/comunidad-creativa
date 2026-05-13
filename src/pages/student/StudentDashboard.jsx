import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAssignedCourses, getCourse, getAllUserProgress, assignCourseToUser } from '../../lib/db';
import { getStudents, saveStudent, getAccounts } from '../../lib/logistics';
import StudentNav from '../../components/student/StudentNav';
import { BookOpen, ChevronRight, Award, Clock, BarChart2, Copy, Check, ExternalLink } from 'lucide-react';

function CourseCard({ course, completedLessons, totalLessons }) {
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isComplete = pct === 100;

  return (
    <Link to={`/course/${course.id}`} className="card-hover group block">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.2)' }}>
          {course.emoji || '📚'}
        </div>
        {isComplete && (
          <span className="badge-jade flex items-center gap-1">
            <Award className="w-3 h-3" /> Completado
          </span>
        )}
      </div>

      <h3 className="font-display font-semibold text-white text-base mb-1 group-hover:text-brand-300 transition-colors">
        {course.title}
      </h3>
      <p className="text-slate-500 text-xs font-body line-clamp-2 mb-4">
        {course.description || 'Sin descripción'}
      </p>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-slate-500">{completedLessons}/{totalLessons} lecciones</span>
          <span className="text-xs font-mono text-brand-400">{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-1 mt-4 text-xs text-slate-500 group-hover:text-brand-400 transition-colors">
        Continuar <ChevronRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [account, setAccount] = useState(null); // student's Gemini account
  const [studentData, setStudentData] = useState(null); // RTDB student record
  const [copiedField, setCopiedField] = useState(null);
  const pollRef = useRef(null);

  // Master sync — runs on load and every 30s
  const syncAll = async () => {
    if (!user) return;
    try {
      const students = await getStudents();
      // Find by uid first, then by email (active only)
      let me = students.find(s => s.uid === user.uid && !s.deletedAt);
      if (!me) me = students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase() && !s.deletedAt);
      if (!me) return;

      // Fix uid if missing or wrong
      if (!me.uid || me.uid !== user.uid) {
        await saveStudent({ ...me, uid: user.uid });
        me = { ...me, uid: user.uid };
      }
      setStudentData(me);

      // Load account credentials
      if (me.accountId) {
        const accounts = await getAccounts();
        const acc = accounts.find(a => a.id === me.accountId);
        if (acc) setAccount(acc);
      } else {
        setAccount(null);
      }

      // Sync missing courses to Firestore
      if (me.courseIds?.length > 0) {
        const assigned = await getUserAssignedCourses(user.uid);
        const missing = me.courseIds.filter(id => !assigned.includes(id));
        if (missing.length > 0) {
          await Promise.all(missing.map(id => assignCourseToUser(user.uid, id)));
          // Reload courses after sync
          const updatedIds = await getUserAssignedCourses(user.uid);
          const updatedData = await Promise.all(updatedIds.map(id => getCourse(id)));
          setCourses(updatedData.filter(Boolean).sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
        }
      }
    } catch(e) { console.error('syncAll:', e); }
  };

  useEffect(() => {
    syncAll();
    pollRef.current = setInterval(syncAll, 30000);
    return () => clearInterval(pollRef.current);
  }, [user]);

  const copyField = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        // Load courses from Firestore immediately (fast)
        const courseIds = await getUserAssignedCourses(user.uid);
        const courseData = await Promise.all(courseIds.map(id => getCourse(id)));
        const validCourses = courseData.filter(Boolean).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setCourses(validCourses);

        const allProgress = await getAllUserProgress(user.uid);
        const map = {};
        allProgress.forEach(p => {
          if (!map[p.courseId]) map[p.courseId] = new Set();
          map[p.courseId].add(p.lessonId);
        });
        setProgressMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }

      // Sync in background (doesn't block UI)
      try {
        const students = await getStudents();
        let student = students.find(s => s.uid === user.uid);
        if (!student) student = students.find(s => s.email?.toLowerCase() === user.email?.toLowerCase() && !s.deletedAt);
        if (student) {
          if (!student.uid) await saveStudent({ ...student, uid: user.uid });
          if (student.courseIds?.length > 0) {
            const already = await getUserAssignedCourses(user.uid);
            const missing = student.courseIds.filter(id => !already.includes(id));
            if (missing.length > 0) {
              await Promise.all(missing.map(id => assignCourseToUser(user.uid, id)));
              // Reload courses if new ones were added
              const updatedIds = await getUserAssignedCourses(user.uid);
              const updatedData = await Promise.all(updatedIds.map(id => getCourse(id)));
              setCourses(updatedData.filter(Boolean).sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
            }
          }
        }
      } catch (err) {
        console.error('Background sync:', err);
      }
    };
    load();
  }, [user]);

  const totalCompleted = Object.values(progressMap).reduce((acc, s) => acc + s.size, 0);

  return (
    <div className="min-h-screen">
      <StudentNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Hola, {profile?.displayName?.split(' ')[0] || 'estudiante'} 👋
          </h1>
          <p className="text-slate-500 font-body">Continúa tu aprendizaje donde lo dejaste.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10 animate-slide-up">
          {[
            { icon: BookOpen, label: 'Cursos asignados', value: courses.length, color: 'text-brand-400' },
            { icon: BarChart2, label: 'Lecciones completadas', value: totalCompleted, color: 'text-jade-400' },
            { icon: Clock, label: 'En progreso', value: courses.filter(c => {
              const done = progressMap[c.id]?.size || 0;
              return done > 0 && done < (c.totalLessons || 0);
            }).length, color: 'text-ember-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 font-body">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick access */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Recursos card */}
            <Link to="/resources"
              className="card hover:bg-obsidian-700/60 hover:border-brand-500/20 transition-all flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                📁
              </div>
              <div>
                <h3 className="font-display font-semibold text-white text-sm">Recursos de referencia</h3>
                <p className="text-xs text-slate-500 mt-0.5">Imágenes y materiales de apoyo para tus diseños</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 ml-auto flex-shrink-0"/>
            </Link>

            {/* Account credentials card */}
            <div className={`card border ${studentData?.expiresAt && new Date(studentData.expiresAt) < new Date() ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}>
              {(() => {
                const now = new Date(); now.setHours(0,0,0,0);
                const exp = studentData?.expiresAt ? new Date(studentData.expiresAt) : null;
                if (exp) exp.setHours(0,0,0,0);
                const daysLeft = exp ? Math.round((exp - now) / 86400000) : null;
                const isExpired = daysLeft !== null && daysLeft < 0;
                const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;

                return (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-400' : isExpiring ? 'bg-amber-400 animate-pulse' : 'bg-jade-400 animate-pulse'}`}/>
                        <h3 className="font-display font-semibold text-white text-sm">Tu cuenta actualizada</h3>
                      </div>
                      {daysLeft !== null && (
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                          isExpired ? 'bg-red-500/20 text-red-400' :
                          isExpiring ? 'bg-amber-500/20 text-amber-400' :
                          'bg-jade-500/20 text-jade-400'
                        }`}>
                          {isExpired ? `Venció hace ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Vence hoy' : `${daysLeft} días`}
                        </span>
                      )}
                    </div>

                    {isExpired ? (
                      /* ── EXPIRED STATE ── */
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                          <p className="text-sm font-display font-bold text-red-400 mb-1">⏰ Se cumplió tu mes</p>
                          <p className="text-xs text-slate-400">Tu acceso sigue activo — renueva para continuar sin interrupciones</p>
                        </div>
                        <div className="p-3 rounded-xl bg-obsidian-900 border border-white/5 space-y-2">
                          <p className="text-xs font-mono font-semibold text-brand-400">💳 Para renovar paga $60.000</p>
                          <div className="space-y-1.5 mt-2">
                            <div className="flex items-start gap-2">
                              <span className="text-xs">🔑</span>
                              <div>
                                <p className="text-xs font-mono text-slate-300 font-semibold">Nequi / Daviplata</p>
                                <p className="text-xs font-mono text-brand-300">3144444958</p>
                              </div>
                              <button onClick={() => copyField('3144444958', 'nequi')}
                                className={`ml-auto p-1 rounded ${copiedField==='nequi'?'text-jade-400':'text-slate-500 hover:text-brand-400'}`}>
                                {copiedField==='nequi'?<Check className="w-3 h-3"/>:<Copy className="w-3 h-3"/>}
                              </button>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs">🏦</span>
                              <div>
                                <p className="text-xs font-mono text-slate-300 font-semibold">Bancolombia — Alfonso Díaz</p>
                                <p className="text-xs font-mono text-slate-400">Cuenta de ahorros</p>
                                <p className="text-xs font-mono text-brand-300">912-777594-09</p>
                              </div>
                              <button onClick={() => copyField('912-777594-09', 'banco')}
                                className={`ml-auto p-1 rounded ${copiedField==='banco'?'text-jade-400':'text-slate-500 hover:text-brand-400'}`}>
                                {copiedField==='banco'?<Check className="w-3 h-3"/>:<Copy className="w-3 h-3"/>}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">Envía el comprobante a tu administrador para activar la renovación.</p>
                        </div>
                      </div>
                    ) : account ? (
                      /* ── ACTIVE STATE ── */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-obsidian-700 border border-white/5">
                          <span className="text-xs text-slate-500 font-mono w-20 flex-shrink-0">Correo:</span>
                          <span className="text-xs font-mono text-slate-200 flex-1 truncate">{account.email}</span>
                          <button onClick={() => copyField(account.email, 'email')}
                            className={`p-1 rounded transition-colors flex-shrink-0 ${copiedField==='email'?'text-jade-400':'text-slate-500 hover:text-brand-400'}`}>
                            {copiedField==='email' ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-obsidian-700 border border-white/5">
                          <span className="text-xs text-slate-500 font-mono w-20 flex-shrink-0">Contraseña:</span>
                          <span className="text-xs font-mono text-slate-200 flex-1 truncate">{account.password}</span>
                          <button onClick={() => copyField(account.password, 'password')}
                            className={`p-1 rounded transition-colors flex-shrink-0 ${copiedField==='password'?'text-jade-400':'text-slate-500 hover:text-brand-400'}`}>
                            {copiedField==='password' ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                          </button>
                        </div>
                        <div className="mt-2 p-3 rounded-lg bg-obsidian-900 border border-white/5 space-y-1.5">
                          <p className="text-xs font-mono text-brand-400 font-semibold mb-2">📋 Reglas de uso</p>
                          <p className="text-xs font-body text-slate-400 leading-relaxed">• Crea un proyecto con tu nombre y trabaja desde ahí</p>
                          <p className="text-xs font-body text-slate-400 leading-relaxed">• No cambiar contraseña ni borrar proyectos</p>
                          <p className="text-xs font-body text-slate-400 leading-relaxed">• Para generación de video usa el generador <span className="text-slate-300 font-mono">Lower priority</span></p>
                          <p className="text-xs font-body text-slate-400 leading-relaxed">• Tienes acceso a <span className="text-brand-300 font-mono font-semibold">5.000 créditos</span> — procura no consumir de más</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 font-mono">Sin cuenta asignada</div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </section>

        {/* Courses */}
        <section>
          <h2 className="font-display text-lg font-semibold text-white mb-5">Mis cursos</h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="card h-48 shimmer-loading" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="card text-center py-16">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-body text-sm">No tienes cursos asignados aún.</p>
              <p className="text-slate-600 text-xs mt-1">Contacta al administrador para que te asigne cursos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  completedLessons={progressMap[course.id]?.size || 0}
                  totalLessons={course.totalLessons || 0}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
