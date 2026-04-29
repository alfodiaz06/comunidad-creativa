import NotificationChat from '../../components/shared/NotificationChat';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCourse, getModules, getLessons,
  markLessonComplete, getUserCourseProgress
} from '../../lib/db';
import StudentNav from '../../components/student/StudentNav';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  ArrowLeft, PlayCircle, BarChart2, Menu, X
} from 'lucide-react';

function toEmbedUrl(url) {
  if (!url) return '';
  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  if (url.includes('/preview') || url.includes('embed')) return url;
  return url;
}

function ModuleSection({ module, lessons, activeLesson, completedIds, onSelect }) {
  const [open, setOpen] = useState(
    lessons.some(l => l.id === activeLesson?.id) || module.order === 1
  );
  const completedCount = lessons.filter(l => completedIds.includes(l.id)).length;

  return (
    <div className="border-b border-white/5 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/3 transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono text-slate-500 mb-0.5">Módulo {module.order}</div>
          <div className="text-sm font-display font-semibold text-slate-200 truncate">{module.title}</div>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <span className="text-xs font-mono text-slate-500">{completedCount}/{lessons.length}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="pb-1">
          {lessons.map(lesson => {
            const isActive = lesson.id === activeLesson?.id;
            const isDone = completedIds.includes(lesson.id);
            return (
              <button key={lesson.id} onClick={() => onSelect(lesson)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-200
                  ${isActive
                    ? 'bg-brand-500/10 border-l-2 border-brand-500'
                    : 'hover:bg-white/3 border-l-2 border-transparent'
                  }`}>
                <div className="mt-0.5 flex-shrink-0">
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-jade-400" />
                    : <Circle className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-600'}`} />
                  }
                </div>
                <div>
                  <div className={`text-xs font-body leading-relaxed ${isActive ? 'text-brand-300' : isDone ? 'text-slate-400' : 'text-slate-300'}`}>
                    {lesson.title}
                  </div>
                  {lesson.duration && (
                    <div className="text-xs text-slate-600 mt-0.5 font-mono">{lesson.duration}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CoursePage() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modulesWithLessons, setModulesWithLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const allLessons = modulesWithLessons.flatMap(m => m.lessons);
  const totalLessons = allLessons.length;
  const pct = totalLessons > 0 ? Math.round((completedIds.length / totalLessons) * 100) : 0;
  const currentIdx = allLessons.findIndex(l => l.id === activeLesson?.id);
  const isCompleted = activeLesson && completedIds.includes(activeLesson.id);

  useEffect(() => {
    if (!courseId || !user) return;
    const load = async () => {
      try {
        const [courseData, modules, completedLessonIds] = await Promise.all([
          getCourse(courseId),
          getModules(courseId),
          getUserCourseProgress(user.uid, courseId),
        ]);
        setCourse(courseData);
        setCompletedIds(completedLessonIds);
        const mwl = await Promise.all(
          modules.map(async m => ({ ...m, lessons: await getLessons(courseId, m.id) }))
        );
        setModulesWithLessons(mwl);
        if (lessonId) {
          const found = mwl.flatMap(m => m.lessons).find(l => l.id === lessonId);
          setActiveLesson(found || mwl[0]?.lessons[0] || null);
        } else {
          setActiveLesson(mwl[0]?.lessons[0] || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, user]);

  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
    setSidebarOpen(false);
    navigate(`/course/${courseId}/lesson/${lesson.id}`, { replace: true });
  };

  const handleToggleComplete = async () => {
    if (!activeLesson || completing) return;
    setCompleting(true);
    try {
      const nowDone = !isCompleted;
      await markLessonComplete(user.uid, courseId, activeLesson.id, nowDone);
      setCompletedIds(prev =>
        nowDone ? [...prev, activeLesson.id] : prev.filter(id => id !== activeLesson.id)
      );
    } catch (err) {
      console.error('Error al marcar lección:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < allLessons.length - 1) handleSelectLesson(allLessons[currentIdx + 1]);
  };
  const handlePrev = () => {
    if (currentIdx > 0) handleSelectLesson(allLessons[currentIdx - 1]);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <StudentNav />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StudentNav />

      {/* Sub-header */}
      <div className="glass border-b border-white/5 px-4 h-12 flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 transition-colors text-xs font-body flex-shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mis cursos</span>
        </Link>
        <span className="text-slate-700 hidden sm:inline">/</span>
        <span className="text-slate-400 text-xs font-body truncate flex-1">{course?.title}</span>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-brand-400" />
            <div className="w-20 progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-mono text-brand-400">{pct}%</span>
          </div>
          <button onClick={() => setSidebarOpen(o => !o)}
            className="btn-ghost p-2 flex items-center gap-1.5 text-xs">
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Lecciones</span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 flex">
          <div className="sidebar-overlay flex-1" onClick={() => setSidebarOpen(false)} />
          <div className="w-80 max-w-[85vw] glass-strong border-l border-white/5 flex flex-col overflow-y-auto z-40 animate-slide-up">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-white text-sm">{course?.title}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 progress-bar w-24">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-brand-400">{pct}%</span>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{completedIds.length}/{totalLessons} completadas</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-200 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {modulesWithLessons.map(m => (
              <ModuleSection key={m.id} module={m} lessons={m.lessons}
                activeLesson={activeLesson} completedIds={completedIds} onSelect={handleSelectLesson} />
            ))}
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
            {activeLesson ? (
              <>
                <div className="video-wrapper mb-5 shadow-2xl shadow-black/40">
                  {activeLesson.videoUrl ? (
                    <iframe src={toEmbedUrl(activeLesson.videoUrl)} allowFullScreen
                      allow="autoplay" title={activeLesson.title} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-obsidian-800">
                      <div className="text-center">
                        <PlayCircle className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">Sin video asignado</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lesson info */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
                  <div className="flex-1">
                    <div className="text-xs font-mono text-slate-500 mb-1">
                      Lección {currentIdx + 1} de {totalLessons}
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-white">{activeLesson.title}</h2>
                    {activeLesson.description && (
                      <p className="text-slate-400 text-sm font-body mt-2 leading-relaxed">{activeLesson.description}</p>
                    )}
                  </div>

                  <button onClick={handleToggleComplete} disabled={completing}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold
                      transition-all duration-200 flex-shrink-0 w-full sm:w-auto
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${isCompleted
                        ? 'bg-jade-500/15 text-jade-400 border border-jade-500/20 hover:bg-jade-500/25'
                        : 'bg-brand-500/10 text-brand-300 border border-brand-500/20 hover:bg-brand-500/20'
                      }`}>
                    {completing ? (
                      <div className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                    ) : isCompleted ? (
                      <><CheckCircle2 className="w-4 h-4" /> Completada</>
                    ) : (
                      <><Circle className="w-4 h-4" /> Marcar completada</>
                    )}
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <button onClick={handlePrev} disabled={currentIdx === 0}
                    className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                    ← <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <span className="text-xs font-mono text-slate-600">{currentIdx + 1} / {totalLessons}</span>
                  <button onClick={handleNext} disabled={currentIdx === allLessons.length - 1}
                    className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="hidden sm:inline">Siguiente</span> →
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-24">
                <PlayCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 font-body">Selecciona una lección para comenzar</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 xl:w-80 border-l border-white/5 glass flex-shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-display font-semibold text-white text-sm">{course?.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-mono text-brand-400">{pct}%</span>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">{completedIds.length}/{totalLessons} completadas</div>
          </div>
          {modulesWithLessons.map(m => (
            <ModuleSection key={m.id} module={m} lessons={m.lessons}
              activeLesson={activeLesson} completedIds={completedIds} onSelect={handleSelectLesson} />
          ))}
        </div>
      </div>
      <NotificationChat/>
    </div>
  );
}
