import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses, createCourse, deleteCourse, updateCourse } from '../../lib/db';
import AdminNav from '../../components/admin/AdminNav';
import { Plus, Pencil, Trash2, BookOpen, ChevronRight, X, Check } from 'lucide-react';

function CourseModal({ course, onClose, onSave }) {
  const [form, setForm] = useState({
    title: course?.title || '',
    description: course?.description || '',
    emoji: course?.emoji || '📚',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title.trim()) { setError('El título es requerido.'); return; }
    setLoading(true);
    try {
      await onSave(course?.id, form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const emojis = ['📚', '🎓', '💡', '🚀', '🔥', '💻', '🎯', '⭐', '🧠', '🎨', '📊', '🔬'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">
            {course ? 'Editar curso' : 'Nuevo curso'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Ícono</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(e => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all
                    ${form.emoji === e
                      ? 'bg-brand-500/20 border-2 border-brand-500 scale-110'
                      : 'bg-obsidian-700 border border-white/10 hover:border-white/20'
                    }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Título del curso</label>
            <input
              className="input-field"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Marketing Digital Avanzado"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Descripción</label>
            <textarea
              className="input-field resize-none h-24"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción breve del curso..."
            />
          </div>
        </div>

        <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    const c = await getAllCourses();
    setCourses(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (courseId, form) => {
    if (courseId) {
      await updateCourse(courseId, form);
    } else {
      await createCourse({ ...form, totalLessons: 0 });
    }
    await load();
  };

  const handleDelete = async (courseId) => {
    if (!confirm('¿Eliminar este curso? Se eliminarán todos sus módulos y lecciones.')) return;
    await deleteCourse(courseId);
    await load();
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Cursos</h1>
              <p className="text-slate-500 text-sm font-body mt-1">{courses.length} cursos en la plataforma</p>
            </div>
            <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo curso
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-36 shimmer-loading rounded-2xl" />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="card text-center py-20">
              <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-body text-sm">Sin cursos creados</p>
              <p className="text-slate-600 text-xs mt-1">Crea tu primer curso para empezar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
              {courses.map(course => (
                <div key={course.id} className="card group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{course.emoji || '📚'}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal(course)}
                        className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-white text-base mb-1">{course.title}</h3>
                  <p className="text-slate-500 text-xs font-body line-clamp-2 mb-4">{course.description || 'Sin descripción'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-600">{course.totalLessons || 0} lecciones</span>
                    <Link
                      to={`/admin/courses/${course.id}/edit`}
                      className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors font-body"
                    >
                      Editar contenido <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modal && (
        <CourseModal
          course={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
