import { useState } from 'react';
import { ArrowLeft, Trash2, Save, Eye, EyeOff, Pencil } from 'lucide-react';
import AddQuestionForm from './AddQuestionForm';

export default function ManageQuiz({ quiz, token, onBack, refreshQuiz }) {
  const [isActive, setIsActive] = useState(quiz.isActive);
  const [randomCount, setRandomCount] = useState(quiz.randomCount || '');
  const [passScore, setPassScore] = useState(quiz.passScore || 1);
  const [timeLimit, setTimeLimit] = useState(quiz.timeLimit || '');
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  const updateSettings = async (override) => {
    const isOverrideBool = typeof override === 'boolean';
    const payload = { 
      isActive: isOverrideBool ? override : isActive, 
      randomCount, 
      passScore,
      timeLimit
    };
    
    const res = await fetch(`${API_URL}/quizzes/${quiz.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('Configuración guardada exitosamente.');
      refreshQuiz();
    } else {
      const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
      alert(`Error al guardar: ${errorData.error}`);
    }
  };

  const toggleActive = async () => {
    const newVal = !isActive;
    setIsActive(newVal);
    await updateSettings(newVal);
  };

  const deleteQuestion = async (qId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta pregunta?')) return;
    const res = await fetch(`${API_URL}/quizzes/${quiz.id}/questions/${qId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) refreshQuiz();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
        <ArrowLeft size={16} /> Volver al Dashboard
      </button>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Gestionando: {quiz.title}</h2>
          <p className="text-zinc-500 mt-2 text-sm">Configura las reglas del cuestionario y añade preguntas.</p>
        </div>
        <button 
          onClick={toggleActive} 
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors ${isActive ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-700'}`}
        >
          {isActive ? <><Eye size={16}/> Visible para alumnos</> : <><EyeOff size={16}/> Oculto (Borrador)</>}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-zinc-900 mb-4">Configuración del Cuestionario</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Max. Preguntas (Aleatorio)</label>
            <input type="number" value={randomCount} onChange={e=>setRandomCount(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="Ej: 10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Puntos para Aprobar</label>
            <input type="number" step="0.1" value={passScore} onChange={e=>setPassScore(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Límite de Tiempo (minutos)</label>
            <input type="number" value={timeLimit} onChange={e=>setTimeLimit(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="Dejar en blanco si no hay" />
          </div>
        </div>
        <button onClick={() => updateSettings()} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
          <Save size={16} /> Guardar Configuración
        </button>
      </div>

      <AddQuestionForm quizId={quiz.id} token={token} onAdded={refreshQuiz} />

      <div className="mb-8 mt-8">
        <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center justify-between">
          <span>Preguntas Actuales</span>
          <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-xs font-semibold">{quiz.questions.length} total</span>
        </h3>
        
        {quiz.questions.length === 0 ? (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 text-center">
            <p className="text-zinc-500 text-sm">No has agregado ninguna pregunta todavía.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quiz.questions.map((q, i) => {
              if (editingQuestionId === q.id) {
                return (
                  <AddQuestionForm 
                    key={q.id} 
                    quizId={quiz.id} 
                    token={token} 
                    initialData={q}
                    onAdded={() => { setEditingQuestionId(null); refreshQuiz(); }} 
                    onCancel={() => setEditingQuestionId(null)}
                  />
                );
              }

              return (
                <div key={q.id} className="bg-white border border-zinc-200 rounded-2xl p-6 relative group overflow-hidden">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Pregunta {i + 1} • {q.type}</span>
                        <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                          Validez: {q.points || 1} pts
                        </span>
                      </div>
                      <p className="font-semibold text-zinc-900 text-lg leading-snug">{q.text}</p>
                      {q.imageUrl && (
                        <div className="mt-3 max-w-sm rounded-lg overflow-hidden border border-zinc-200">
                          <img src={q.imageUrl} alt="Imagen adjunta de la pregunta" className="w-full h-auto" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setEditingQuestionId(q.id)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar pregunta">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => deleteQuestion(q.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar pregunta">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {q.type === 'MATCHING' && (
                    <ul className="space-y-2 mt-4 bg-zinc-50/50 rounded-xl p-4 border border-zinc-100">
                      {q.options.map(o => (
                        <li key={o.id} className="flex items-center gap-3 text-sm">
                          {o.text === '' ? (
                            <>
                              <span className="font-bold text-orange-600 uppercase text-[10px] tracking-wider bg-orange-100 px-2 py-1 rounded">Distractor Falso</span>
                              <span className="text-zinc-400">→</span>
                              <span className="text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-md flex-1">{o.matchCorrect}</span>
                            </>
                          ) : (
                            <>
                              {o.imageUrl && <img src={o.imageUrl} alt="Concepto" className="w-8 h-8 rounded object-cover border border-zinc-200" />}
                              <span className="font-medium text-zinc-900 flex-1">{o.text}</span>
                              <span className="text-zinc-400">→</span>
                              <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-md flex-1">{o.matchCorrect}</span>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.type !== 'TEXT' && q.type !== 'MATCHING' && (
                    <ul className="space-y-2 mt-4 bg-zinc-50/50 rounded-xl p-4 border border-zinc-100">
                      {q.options.map(o => (
                        <li key={o.id} className="flex items-center gap-3 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${o.isCorrect ? 'bg-green-500' : 'bg-zinc-300'}`}></div>
                          {o.imageUrl && <img src={o.imageUrl} alt="Opción" className="w-8 h-8 rounded object-cover border border-zinc-200" />}
                          <span className={o.isCorrect ? 'font-medium text-zinc-900' : 'text-zinc-600'}>{o.text}</span>
                          {o.isCorrect && <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Correcta</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
