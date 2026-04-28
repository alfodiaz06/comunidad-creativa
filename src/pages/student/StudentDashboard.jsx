import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAssignedCourses, getCourse, getAllUserProgress } from '../../lib/db';
import StudentNav from '../../components/student/StudentNav';
import { BookOpen, ChevronRight, Award, Clock, BarChart2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const courseIds = await getUserAssignedCourses(user.uid);
        const courseData = await Promise.all(courseIds.map(id => getCourse(id)));
        const validCourses = courseData.filter(Boolean);
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
