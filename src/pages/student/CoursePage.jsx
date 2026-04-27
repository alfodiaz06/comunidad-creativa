import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCourse, getModules, getLessons,
  markLessonComplete, getUserCourseProgress
} from '../../lib/db';
import StudentNav from '../../components/student/StudentNav';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  ArrowLeft, PlayCircle, Lock, BarChart2
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toEmbedUrl(url) {
  if (!url) return '';
  // Google Drive share link → embed
  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  // Already an embed
  if (url.includes('/preview') || url.includes('embed')) return url;
  return url;
}

// ── Sidebar module ────────────────────────────────────────────────────────────

function ModuleSection({ module, lessons, activeLesson, completedIds, onSelect }) {
  const [open, setOpen] = useState(
    lessons.some(l => l.id === activeLesson?.id) || module.order === 1
  );
  const completedCount = lessons.filter(l => completedIds.includes(l.id)).length;

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/3 transition-colors text-left"
      >
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
              <button
                key={lesson.id}
                onClick={() => onSelect(lesson)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-200
                  ${isActive
                    ? 'bg-aurora-500/10 border-l-2 border-aurora-500'
                    : 'hover:bg-white/3 border-l-2 border-transparent'
                  }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-jade-400" />
                    : <Circle className={`w-4 h-4 ${isActive ? 'text-aurora-400' : 'text-slate-600'}`} />
                  }
                </div>
                <div>
                  <div className={`text-xs font-body leading-relaxed ${isActive ? 'text-aurora-300' : isDone ? 'text-slate-400' : 'text-slate-300'}`}>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoursePage() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modulesWithLessons, setModulesWithLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Flatten all lessons
  const allLessons = modulesWithLessons.flatMap(m => m.lessons);
  const totalLessons = allLessons.length;
  const pct = totalLessons > 0 ? Math.round((completedIds.length / totalLessons) * 100) : 0;

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
          modules.map(async m => ({
            ...m,
            lessons: await getLessons(courseId, m.id),
          }))
        );
        setModulesWithLessons(mwl);

        // Set active lesson
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
    navigate(`/course/${courseId}/lesson/${lesson.id}`, { replace: true });
  };

  const handleToggleComplete = async () => {
    if (!activeLesson) return;
    const isDone = completedIds.includes(activeLesson.id);
    await markLessonComplete(user.uid, courseId, activeLesson.id, !isDone);
    setCompletedIds(prev =>
      isDone ? prev.filter(id => id !== activeLesson.id) : [...prev, activeLesson.id]
    );
  };

  const handleNext = () => {
    const idx = allLessons.findIndex(l => l.id === activeLesson?.id);
    if (idx < allLessons.length - 1) handleSelectLesson(allLessons[idx + 1]);
  };

  const handlePrev = () => {
    const idx = allLessons.findIndex(l => l.id === activeLesson?.id);
    if (idx > 0) handleSelectLesson(allLessons[idx - 1]);
  };

  const currentIdx = allLessons.findIndex(l => l.id === activeLesson?.id);
  const isCompleted = activeLesson && completedIds.includes(activeLesson.id);

  if (loading) {
    return (
      <div className="min-h-screen">
        <StudentNav />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-8 h-8 rounded-full border-2 border-aurora-500/30 border-t-aurora-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StudentNav />

      {/* Sub-header */}
      <div className="glass border-b border-white/5 px-4 sm:px-6 h-12 flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 transition-colors text-xs font-body">
          <ArrowLeft className="w-3.5 h-3.5" />
          Mis cursos
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-400 text-xs font-body truncate">{course?.title}</span>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-aurora-400" />
            <div className="w-24 progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-mono text-aurora-400">{pct}%</span>
          </div>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            {sidebarOpen ? 'Ocultar' : 'Mostrar'} lecciones
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
            {activeLesson ? (
              <>
                {/* Video */}
                <div className="video-wrapper mb-5 shadow-2xl shadow-black/40">
                  {activeLesson.videoUrl ? (
                    <iframe
                      src={toEmbedUrl(activeLesson.videoUrl)}
                      allowFullScreen
                      allow="autoplay"
                      title={activeLesson.title}
                    />
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
                    <h2 className="font-display text-xl font-bold text-white">{activeLesson.title}</h2>
                    {activeLesson.description && (
                      <p className="text-slate-400 text-sm font-body mt-2 leading-relaxed">
                        {activeLesson.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleToggleComplete}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold
                      transition-all duration-200 flex-shrink-0
                      ${isCompleted
                        ? 'bg-jade-500/15 text-jade-400 border border-jade-500/20 hover:bg-jade-500/25'
                        : 'bg-obsidian-700 text-slate-300 border border-white/10 hover:border-jade-500/30 hover:text-jade-400'
                      }`}
                  >
                    {isCompleted
                      ? <><CheckCircle2 className="w-4 h-4" /> Completada</>
                      : <><Circle className="w-4 h-4" /> Marcar completada</>
                    }
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <button
                    onClick={handlePrev}
                    disabled={currentIdx === 0}
                    className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <span className="text-xs font-mono text-slate-600">
                    {currentIdx + 1} / {totalLessons}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentIdx === allLessons.length - 1}
                    className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Siguiente →
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

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-72 xl:w-80 border-l border-white/5 glass flex-shrink-0 overflow-y-auto hidden sm:block">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-display font-semibold text-white text-sm">{course?.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-mono text-aurora-400">{pct}%</span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">{completedIds.length}/{totalLessons} completadas</div>
            </div>

            {modulesWithLessons.map(m => (
              <ModuleSection
                key={m.id}
                module={m}
                lessons={m.lessons}
                activeLesson={activeLesson}
                completedIds={completedIds}
                onSelect={handleSelectLesson}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
