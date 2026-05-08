import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getCourse, getModules, getLessons,
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson,
  updateCourse
} from '../../lib/db';
import AdminNav from '../../components/admin/AdminNav';
import {
  Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp,
  ArrowLeft, GripVertical, Video, BookOpen, Eye
} from 'lucide-react';

// ── Lesson Modal ─────────────────────────────────────────────────────────────

function LessonModal({ lesson, moduleId, lessonCount, onClose, onSave }) {
  const [form, setForm] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    videoUrl: lesson?.videoUrl || '',
    duration: lesson?.duration || '',
    order: lesson?.order ?? lessonCount + 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title.trim()) { setError('El título es requerido.'); return; }
    setLoading(true);
    try {
      await onSave(lesson?.id, form);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">
            {lesson ? 'Editar lección' : 'Nueva lección'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Título</label>
            <input className="input-field" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Introducción al tema" />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
              URL del video (Google Drive)
            </label>
            <input className="input-field" value={form.videoUrl}
              onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
              placeholder="https://drive.google.com/file/d/ID/view" />
            <p className="text-xs text-slate-600 mt-1.5 font-body">
              Pega el enlace de Google Drive. Asegúrate que sea público o "Cualquiera con el enlace".
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Duración</label>
              <input className="input-field" value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="Ej: 12:30" />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Orden</label>
              <input className="input-field" type="number" min="1" value={form.order}
                onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Descripción</label>
            <textarea className="input-field resize-none h-20" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción breve de la lección..." />
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

// ── Module section ─────────────────────────────────────────────────────────────

function ModuleEditor({ courseId, module, onUpdate, onDelete }) {
  const [lessons, setLessons] = useState([]);
  const [open, setOpen] = useState(true);
  const [lessonModal, setLessonModal] = useState(null); // null | 'create' | lesson
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(module.title);

  useEffect(() => {
    getLessons(courseId, module.id).then(setLessons);
  }, [courseId, module.id]);

  const handleSaveLesson = async (lessonId, form) => {
    if (lessonId) {
      await updateLesson(courseId, module.id, lessonId, form);
    } else {
      await createLesson(courseId, module.id, form);
    }
    const updated = await getLessons(courseId, module.id);
    setLessons(updated);
    // Update total lesson count
    onUpdate();
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('¿Eliminar esta lección?')) return;
    await deleteLesson(courseId, module.id, lessonId);
    setLessons(l => l.filter(x => x.id !== lessonId));
    onUpdate();
  };

  const handleSaveTitle = async () => {
    if (!title.trim()) return;
    await updateModule(courseId, module.id, { title });
    setEditing(false);
    onUpdate();
  };

  return (
    <div className="card mb-4">
      {/* Module header */}
      <div className="flex items-center gap-3 mb-3">
        <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0 cursor-grab active:cursor-grabbing" title="Arrastra para reordenar"/>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input className="input-field py-1.5 text-sm flex-1" value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                autoFocus />
              <button onClick={handleSaveTitle} className="p-2 text-jade-400 hover:bg-jade-500/10 rounded-lg transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setEditing(false); setTitle(module.title); }}
                className="p-2 text-slate-500 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">Módulo {module.order} ·</span>
              <span className="font-display font-semibold text-white text-sm truncate">{module.title}</span>
              <button onClick={() => setEditing(true)} className="text-slate-600 hover:text-slate-400 transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs font-mono text-slate-600">{lessons.length} lecciones</span>
          <button onClick={() => onDelete(module.id)}
            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setOpen(o => !o)}
            className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="ml-7">
          {lessons.length === 0 ? (
            <p className="text-slate-600 text-xs font-body py-2 mb-2">Sin lecciones</p>
          ) : (
            <div className="space-y-2 mb-3">
              {lessons.map(lesson => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-obsidian-700/50 border border-white/5 group">
                  <Video className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-display text-slate-300 truncate">{lesson.title}</div>
                    {lesson.duration && <div className="text-xs font-mono text-slate-600">{lesson.duration}</div>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setLessonModal(lesson)}
                      className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setLessonModal('create')}
            className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-brand-500/5 font-body"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir lección
          </button>
        </div>
      )}

      {lessonModal && (
        <LessonModal
          lesson={lessonModal === 'create' ? null : lessonModal}
          moduleId={module.id}
          lessonCount={lessons.length}
          onClose={() => setLessonModal(null)}
          onSave={handleSaveLesson}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminCourseEditor() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);

  const load = async () => {
    const [c, m] = await Promise.all([getCourse(courseId), getModules(courseId)]);
    setCourse(c);
    // Auto-assign order to modules that don't have it
    const needsOrder = m.some(mod => mod.order == null);
    if (needsOrder) {
      const fixed = m.map((mod, i) => ({ ...mod, order: i + 1 }));
      await Promise.all(fixed.map(mod => updateModule(courseId, mod.id, { order: mod.order })));
      setModules(fixed);
    } else {
      setModules(m);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOver(idx); };
  const handleDragEnd = () => { setDragIdx(null); setDragOver(null); };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOver(null); return; }
    const reordered = [...modules];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setModules(reordered.map((m, i) => ({ ...m, order: i + 1 })));
    setDragIdx(null);
    setDragOver(null);
    setOrderChanged(true);
    setOrderSaved(false);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      await Promise.all(modules.map((m, i) => updateModule(courseId, m.id, { order: i + 1 })));
      setOrderChanged(false);
      setOrderSaved(true);
      setTimeout(() => setOrderSaved(false), 2000);
    } finally { setSavingOrder(false); }
  };

  const handleAddModule = async () => {
    const title = prompt('Nombre del módulo:');
    if (!title?.trim()) return;
    await createModule(courseId, { title, order: modules.length + 1 });
    await load();
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return;
    await deleteModule(courseId, moduleId);
    await load();
  };

  const handleUpdateCount = async () => {
    // Recount total lessons across all modules
    const allModules = await getModules(courseId);
    const counts = await Promise.all(allModules.map(m => getLessons(courseId, m.id)));
    const total = counts.flat().length;
    await updateCourse(courseId, { totalLessons: total });
    setCourse(c => ({ ...c, totalLessons: total }));
  };

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <Link to="/admin/courses" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 text-xs font-body mb-4 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a cursos
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{course?.emoji || '📚'}</div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">{course?.title}</h1>
                <p className="text-slate-500 text-sm font-body mt-0.5">
                  {course?.totalLessons || 0} lecciones en total
                </p>
              </div>
              <Link to={`/course/${courseId}`} target="_blank"
                className="ml-auto flex items-center gap-1.5 text-xs btn-ghost">
                <Eye className="w-3.5 h-3.5" /> Vista previa
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2].map(i => <div key={i} className="h-24 shimmer-loading rounded-2xl" />)}
            </div>
          ) : (
            <>
              {/* Save order button — shows when order has changed */}
              {orderChanged && (
                <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 animate-fade-in">
                  <span className="text-sm text-brand-300 font-display">Orden modificado — guarda para aplicar a estudiantes</span>
                  <button onClick={handleSaveOrder} disabled={savingOrder}
                    className="btn-primary flex items-center gap-2 text-sm py-1.5">
                    {savingOrder
                      ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Guardando...</>
                      : <><Check className="w-3.5 h-3.5"/>Guardar orden</>
                    }
                  </button>
                </div>
              )}
              {orderSaved && (
                <div className="mb-4 p-3 rounded-xl bg-jade-500/10 border border-jade-500/20 animate-fade-in">
                  <span className="text-sm text-jade-400 font-display">✓ Orden guardado — los estudiantes verán el nuevo orden</span>
                </div>
              )}
              {modules.length === 0 ? (
                <div className="card text-center py-16 mb-4">
                  <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-body text-sm">Sin módulos aún</p>
                  <p className="text-slate-600 text-xs mt-1">Crea el primer módulo para empezar</p>
                </div>
              ) : (
                <div className="animate-slide-up">
                  {modules.map((m, idx) => (
                    <div
                      key={m.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`transition-all duration-200 ${
                        dragOver === idx && dragIdx !== idx
                          ? 'border-2 border-brand-500/50 rounded-2xl scale-[1.01]'
                          : dragIdx === idx
                          ? 'opacity-40 scale-[0.98]'
                          : ''
                      }`}
                    >
                      <ModuleEditor
                        courseId={courseId}
                        module={m}
                        onDelete={handleDeleteModule}
                        onUpdate={handleUpdateCount}
                        isDragging={dragIdx === idx}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAddModule}
                className="w-full py-3.5 rounded-2xl border border-dashed border-white/10 hover:border-brand-500/40
                  text-slate-500 hover:text-brand-400 flex items-center justify-center gap-2
                  transition-all duration-200 hover:bg-brand-500/5 font-body text-sm"
              >
                <Plus className="w-4 h-4" /> Añadir módulo
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
