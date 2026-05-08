import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses, createCourse, deleteCourse, updateCourse, assignCourseToUser, getUserAssignedCourses } from '../../lib/db';
import { getStudents } from '../../lib/logistics';
import AdminNav from '../../components/admin/AdminNav';
import { Plus, Pencil, Trash2, BookOpen, ChevronRight, X, Check, Users, GripVertical, Save } from 'lucide-react';

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

// ── Assign Students Modal
function AssignStudentsModal({ course, onClose }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const sts = await getStudents();
      const active = sts.filter(s => !s.deletedAt && s.uid);
      setStudents(active);
      // Pre-select students who already have this course
      const alreadyHave = new Set();
      await Promise.all(active.map(async s => {
        if (s.uid) {
          const courses = await getUserAssignedCourses(s.uid);
          if (courses.includes(course.id)) alreadyHave.add(s.id);
        }
      }));
      setSelected(alreadyHave);
      setLoading(false);
    };
    load();
  }, [course.id]);

  const toggleAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(students.map(s => s.id)));
      setSelectAll(true);
    }
  };

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setSelectAll(next.size === students.length);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(students.map(async s => {
        if (!s.uid) return;
        const current = await getUserAssignedCourses(s.uid);
        if (selected.has(s.id) && !current.includes(course.id)) {
          await assignCourseToUser(s.uid, course.id);
          // Also update courseIds in RTDB
          const { saveStudent } = await import('../../lib/logistics');
          const courseIds = [...new Set([...(s.courseIds||[]), course.id])];
          await saveStudent({...s, courseIds});
        }
      }));
      setDone(true);
      setTimeout(onClose, 1500);
    } finally { setSaving(false); }
  };

  const activeStudents = students.filter(s => s.uid); // only with Firebase access

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="font-display font-semibold text-white">👥 Agregar estudiantes</h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{course.emoji} {course.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5"/></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"/>
          </div>
        ) : (
          <>
            {/* Select all */}
            <div className="px-5 py-3 border-b border-white/5">
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={toggleAll}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer
                    ${selectAll ? 'bg-brand-500 border-brand-500' : 'border-white/20 hover:border-white/40'}`}>
                  {selectAll && <Check className="w-3 h-3 text-white"/>}
                </div>
                <span className="text-sm font-display font-semibold text-white">Seleccionar todos</span>
                <span className="text-xs font-mono text-slate-500 ml-auto">{selected.size}/{activeStudents.length}</span>
              </label>
            </div>

            {/* Student list */}
            <div className="overflow-y-auto flex-1 p-5 space-y-2">
              {activeStudents.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Sin estudiantes con acceso activo</p>
              ) : activeStudents.map(st => (
                <label key={st.id} className="flex items-center gap-3 p-3 rounded-xl bg-obsidian-700 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                  <div onClick={() => toggle(st.id)}
                    className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer
                      ${selected.has(st.id) ? 'bg-brand-500 border-brand-500' : 'border-white/20'}`}>
                    {selected.has(st.id) && <Check className="w-2.5 h-2.5 text-white"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-display text-slate-200">{st.name}</div>
                    <div className="text-xs font-mono text-slate-500">{st.email}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-5 border-t border-white/5 flex gap-3 justify-end">
              <button onClick={onClose} className="btn-ghost">Cancelar</button>
              <button onClick={handleSave} disabled={saving || selected.size === 0}
                className="btn-primary flex items-center gap-2">
                {done ? <><Check className="w-4 h-4"/>¡Listo!</>
                  : saving ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Guardando...</>
                  : <><Users className="w-4 h-4"/>Asignar {selected.size} estudiante{selected.size!==1?'s':''}</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOver(idx); };
  const handleDragEnd = () => { setDragIdx(null); setDragOver(null); };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOver(null); return; }
    const reordered = [...courses];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setCourses(reordered.map((c, i) => ({ ...c, order: i + 1 })));
    setDragIdx(null);
    setDragOver(null);
    setOrderChanged(true);
    setSavedOk(false);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      await Promise.all(courses.map((c, i) => updateCourse(c.id, { order: i + 1 })));
      setOrderChanged(false);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } finally { setSavingOrder(false); }
  };

  const load = async () => {
    const c = await getAllCourses();
    setCourses(c.sort((a, b) => (a.order || 0) - (b.order || 0)));
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
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Cursos</h1>
              <p className="text-slate-500 text-sm font-body mt-1">{courses.length} cursos en la plataforma</p>
            </div>
            <div className="flex items-center gap-3">
              {orderChanged && (
                <button onClick={handleSaveOrder} disabled={savingOrder}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/15 text-brand-300 border border-brand-500/30 hover:bg-brand-500/25 transition-all text-sm font-display font-semibold">
                  {savingOrder
                    ? <><div className="w-4 h-4 rounded-full border-2 border-brand-400/30 border-t-brand-400 animate-spin"/>Guardando...</>
                    : <><Save className="w-4 h-4"/>Guardar orden</>
                  }
                </button>
              )}
              {savedOk && (
                <span className="text-sm text-jade-400 font-display flex items-center gap-1.5">
                  <Check className="w-4 h-4"/>Orden guardado
                </span>
              )}
              <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4"/> Nuevo curso
              </button>
            </div>
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
              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`card group transition-all duration-200 ${
                    dragOver === idx && dragIdx !== idx ? 'border-brand-500/50 scale-[1.02]' :
                    dragIdx === idx ? 'opacity-40 scale-[0.98]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-slate-600 cursor-grab active:cursor-grabbing flex-shrink-0" title="Arrastra para reordenar"/>
                      <div className="text-2xl">{course.emoji || '📚'}</div>
                    </div>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAssignModal(course)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200 transition-colors font-body"
                      >
                        <Users className="w-3 h-3"/> Estudiantes
                      </button>
                      <Link
                        to={`/admin/courses/${course.id}/edit`}
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors font-body"
                      >
                        Editar <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
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
      {assignModal && (
        <AssignStudentsModal
          course={assignModal}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  );
}
