import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function ReviewAttempt({ quizId, token, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    fetch(`${API_URL}/quizzes/attempts/last/${quizId}/review`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(res => res.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(err => setError(err.message));
  }, [quizId, token]);

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return <div className="p-8 text-center text-zinc-500">Cargando resultados...</div>;

  const { attempt, questions, questionScores } = data;
  
  const passed = attempt.score >= attempt.quiz.passScore;

  return (
    <div className="max-w-3xl mx-auto mt-4">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div className={`p-8 rounded-3xl border mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div>
          <h2 className={`text-2xl font-bold mb-1 ${passed ? 'text-green-800' : 'text-red-800'}`}>
            {passed ? '¡Aprobado!' : 'No Aprobado'}
          </h2>
          <p className={`text-sm ${passed ? 'text-green-600' : 'text-red-600'}`}>
            Se requerían {attempt.quiz.passScore} puntos para aprobar.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-4xl font-black text-zinc-900">{attempt.score.toFixed(2)} <span className="text-lg font-medium text-zinc-500">pts</span></div>
          <p className="text-sm font-medium text-zinc-500">Completado en {attempt.timeUsed}s</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-zinc-900 mb-4">Revisión de respuestas</h3>
        
        {questions.map((q, i) => {
          // Obtener las respuestas del usuario para esta pregunta
          const userAnswers = attempt.answers.filter(a => a.questionId === q.id);
          const selectedOptionIds = userAnswers.map(a => a.selectedOptionId).filter(Boolean);
          const qScore = questionScores ? questionScores[q.id] : 0;
          let matchAnswers = {};
          if (q.type === 'MATCHING') {
            try { matchAnswers = JSON.parse(userAnswers[0]?.textAnswer || '{}'); } catch(e){}
          }
          
          let statusLabel = 'Incorrecta totalmente';
          let statusClass = 'bg-red-100 text-red-700';
          if (qScore >= q.points) {
            statusLabel = 'Totalmente correcta';
            statusClass = 'bg-green-100 text-green-700';
          } else if (qScore > 0) {
            statusLabel = 'Parcialmente correcta';
            statusClass = 'bg-amber-100 text-amber-700';
          }

          return (
            <div key={q.id} className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h4 className="text-lg font-medium text-zinc-900 flex-1">{i + 1}. {q.text}</h4>
                <div className="flex flex-col items-end flex-shrink-0 gap-1">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${statusClass}`}>
                    {statusLabel}
                  </span>
                  <span className="text-sm font-semibold text-zinc-500">
                    Puntúa <span className="text-zinc-900">{qScore.toFixed(2)}</span> sobre {q.points}
                  </span>
                </div>
              </div>

              {q.imageUrl && (
                <div className="mb-6 rounded-xl overflow-hidden border border-zinc-200">
                  <img src={q.imageUrl} alt="Imagen adjunta a la pregunta" className="w-full max-h-[300px] object-contain bg-zinc-50" />
                </div>
              )}
              
              {q.type === 'TEXT' ? (
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 italic">
                  Tu respuesta: {userAnswers[0]?.textAnswer || '(En blanco)'}
                </div>
              ) : q.type === 'MATCHING' ? (
                <div className="space-y-3">
                  {q.options.map(o => {
                    const studentChoice = matchAnswers[o.id];
                    const isCorrect = studentChoice === o.matchCorrect;
                    
                    let bgClass = "bg-white border-zinc-200";
                    let icon = null;
                    
                    if (studentChoice && isCorrect) {
                      bgClass = "bg-green-50 border-green-500 ring-1 ring-green-500";
                      icon = <CheckCircle size={20} className="text-green-600" />;
                    } else if (studentChoice && !isCorrect) {
                      bgClass = "bg-red-50 border-red-500 ring-1 ring-red-500";
                      icon = <XCircle size={20} className="text-red-600" />;
                    } else if (!studentChoice) {
                      bgClass = "bg-zinc-50 border-zinc-300 border-dashed";
                      icon = <XCircle size={20} className="text-zinc-400" />;
                    }

                    return (
                      <div key={o.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${bgClass}`}>
                        <div className="flex items-center gap-3 flex-1">
                          {o.imageUrl && <img src={o.imageUrl} alt="Concepto" className="w-10 h-10 rounded object-cover border border-zinc-200" />}
                          <span className="font-medium text-zinc-800">{o.text}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-zinc-400">→</span>
                          <span className={`px-2 py-1 rounded-md text-sm ${studentChoice ? (isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800 line-through') : 'text-zinc-400 italic'}`}>
                            {studentChoice || 'Sin responder'}
                          </span>
                          {!isCorrect && <span className="text-green-600 text-sm font-medium ml-2">Era: {o.matchCorrect}</span>}
                        </div>
                        <div className="flex-shrink-0 mt-0.5">{icon}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {q.options.map(o => {
                    const isSelected = selectedOptionIds.includes(o.id);
                    const isCorrect = o.isCorrect;
                    
                    let bgClass = "bg-white border-zinc-200";
                    let icon = null;
                    
                    if (isSelected && isCorrect) {
                      bgClass = "bg-green-50 border-green-500 ring-1 ring-green-500";
                      icon = <CheckCircle size={20} className="text-green-600" />;
                    } else if (isSelected && !isCorrect) {
                      bgClass = "bg-red-50 border-red-500 ring-1 ring-red-500";
                      icon = <XCircle size={20} className="text-red-600" />;
                    } else if (!isSelected && isCorrect) {
                      bgClass = "bg-zinc-50 border-zinc-300 border-dashed";
                      icon = <CheckCircle size={20} className="text-zinc-400" />;
                    }

                    return (
                      <div key={o.id} className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all ${bgClass}`}>
                        <div className="flex items-center gap-3">
                          {o.imageUrl && <img src={o.imageUrl} alt="Opción" className="w-10 h-10 rounded object-cover border border-zinc-200" />}
                          <span className={`text-base ${isSelected ? 'font-medium' : ''} text-zinc-800`}>{o.text}</span>
                        </div>
                        <div className="flex-shrink-0 mt-0.5">{icon}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
