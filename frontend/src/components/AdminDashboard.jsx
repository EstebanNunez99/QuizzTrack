import { useState, useEffect } from 'react';
import { ClipboardList, Users, Plus, BookOpen, Clock, Settings2, Trash2 } from 'lucide-react';
import ManageQuiz from './ManageQuiz';

export default function AdminDashboard({ token, quizzes, fetchQuizzes, adminQuiz, setAdminQuiz }) {
  const [adminTab, setAdminTab] = useState('quizzes');
  const [students, setStudents] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    if (adminTab === 'stats') {
      fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setStudents(data.students || []));
    }
  }, [adminTab, token]);

  const fetchAdminQuiz = async (id) => {
    const res = await fetch(`${API_URL}/admin/quizzes/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setAdminQuiz(data);
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm('¿Seguro que deseas borrar este cuestionario por completo? Perderás todas sus preguntas y los intentos de los alumnos.')) return;
    const res = await fetch(`${API_URL}/quizzes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchQuizzes();
  };

  const deleteAttempt = async (attemptId) => {
    if (!window.confirm('¿Seguro que deseas borrar la respuesta de este alumno?')) return;
    const res = await fetch(`${API_URL}/quizzes/attempts/${attemptId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setStudents(data.students || []));
    }
  };

  const createQuiz = async (e) => {
    e.preventDefault();
    const title = e.target.title.value;
    const randomCount = e.target.randomCount.value;
    const passScore = e.target.passScore.value;

    const res = await fetch(`${API_URL}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, randomCount, passScore, isActive: false })
    });
    if (res.ok) {
      e.target.reset();
      fetchQuizzes();
    }
  };

  if (adminQuiz) {
    return (
      <ManageQuiz
        quiz={adminQuiz}
        token={token}
        onBack={() => { setAdminQuiz(null); fetchQuizzes(); }}
        refreshQuiz={() => fetchAdminQuiz(adminQuiz.id)}
      />
    );
  }

  return (
    <div>
      <div className="flex border-b border-zinc-200 mb-8">
        <button
          onClick={() => setAdminTab('quizzes')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${adminTab === 'quizzes'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
        >
          <ClipboardList size={18} /> Cuestionarios
        </button>
        <button
          onClick={() => setAdminTab('stats')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${adminTab === 'stats'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
        >
          <Users size={18} /> Alumnos y Resultados
        </button>
      </div>

      {adminTab === 'quizzes' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-4">
              <Plus size={20} className="text-zinc-400" /> Crear Nuevo Cuestionario
            </h3>
            <form onSubmit={createQuiz} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Título del Cuestionario</label>
                  <input name="title" required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Preguntas al azar por alumno</label>
                  <input name="randomCount" type="number" placeholder="Ej. 20 (Dejar vacío para mostrar todas)" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Puntos mínimos para aprobar</label>
                  <input name="passScore" type="number" step="0.1" defaultValue="60" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" />
                </div>
              </div>
              <button type="submit" className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-medium text-sm hover:bg-zinc-800 transition-colors">
                Crear Cuestionario
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Cuestionarios Existentes</h3>
            {quizzes.length === 0 ? (
              <p className="text-zinc-500 text-sm">No hay cuestionarios creados aún.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {quizzes.map(q => (
                  <div key={q.id} className="bg-white p-5 rounded-2xl border border-zinc-200 hover:border-zinc-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-500">
                        <BookOpen size={20} />
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${q.isActive ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {q.isActive ? 'Activo' : 'Borrador'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-zinc-900 mb-1">{q.title}</h4>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => fetchAdminQuiz(q.id)}
                        className="flex-1 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg font-medium text-sm hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Settings2 size={16} /> Configurar
                      </button>
                      <button
                        onClick={() => deleteQuiz(q.id)}
                        className="p-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Borrar cuestionario"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'stats' && (
        <div>
          {/* Conservamos el código previo de los stats, lo simplifico aquí... */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Resultados de Alumnos</h3>
          </div>
          {students.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mb-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold uppercase text-sm">{s.email.charAt(0)}</div>
                <div><h4 className="font-semibold text-zinc-900">{s.email}</h4></div>
              </div>
              <div className="space-y-2">
                {s.attempts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-sm group">
                    <div className="flex items-center gap-2"><BookOpen size={16} className="text-zinc-400" /><span className="font-medium text-zinc-700">{a.quiz.title}</span></div>
                    <div className="flex items-center gap-4 text-zinc-500 text-xs">
                      <span className="flex items-center gap-1"><Clock size={14} /> {a.timeUsed}s</span>
                      <span className="font-bold text-zinc-900 bg-zinc-200 px-2 py-0.5 rounded">Puntaje: {a.score.toFixed(2)}</span>
                      <button
                        onClick={() => deleteAttempt(a.id)}
                        className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Borrar intento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
