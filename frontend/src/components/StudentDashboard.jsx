import { useState, useEffect } from 'react';
import { BookOpen, List, Award, CheckCircle, XCircle } from 'lucide-react';

export default function StudentDashboard({ token, quizzes, onPlayQuiz }) {
  const [tab, setTab] = useState('available');
  const [attempts, setAttempts] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    if (tab === 'results') {
      fetch(`${API_URL}/quizzes/attempts/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setAttempts(data || []));
    }
  }, [tab, token]);

  return (
    <div>
      <div className="flex border-b border-zinc-200 mb-8">
        <button 
          onClick={() => setTab('available')} 
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
            tab === 'available' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <List size={18} /> Cuestionarios Disponibles
        </button>
        <button 
          onClick={() => setTab('results')} 
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
            tab === 'results' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Award size={18} /> Mis Resultados
        </button>
      </div>

      {tab === 'available' && (
        <div>
          {quizzes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-zinc-300">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-zinc-900 font-medium mb-1">Sin cuestionarios</h3>
              <p className="text-zinc-500 text-sm">No hay cuestionarios activos por el momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {quizzes.map(q => (
                <div key={q.id} className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-200 group flex flex-col h-full">
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-zinc-900 group-hover:text-white transition-colors text-zinc-500 border border-zinc-100 group-hover:border-zinc-900">
                      <BookOpen size={24} />
                    </div>
                    <h3 className="font-semibold text-zinc-900 text-lg mb-2">{q.title}</h3>
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 mb-4">
                      <span>Límite de preguntas: {q.randomCount ? q.randomCount : 'Todas'}</span>
                      <span>Se aprueba con: {q.passScore} pts</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-5 border-t border-zinc-100">
                    <button 
                      onClick={() => onPlayQuiz(q.id)} 
                      className="w-full py-2.5 bg-zinc-900 text-white rounded-xl font-medium text-sm hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 shadow-sm"
                    >
                      Comenzar Intento
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'results' && (
        <div className="max-w-3xl mx-auto">
          {attempts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-zinc-300">
              <Award className="mx-auto h-8 w-8 text-zinc-300 mb-3" />
              <p className="text-zinc-500 text-sm">Aún no has resuelto ningún cuestionario.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map(a => {
                const totalQuestions = a.quiz.questions ? a.quiz.questions.length : 1; 
                // Para calcular el % usamos el score vs la base. Si el backend no devuelve el maxScore exacto, 
                // podemos calcular el % basado en que cada pregunta vale 1 (asumiendo attempt.answers.length es el total)
                const totalPossible = a.answers ? a.answers.length : 1; // Simplificación visual
                // En realidad el porcentaje es contra la cantidad de preguntas que resolvió
                
                return (
                  <div key={a.id} className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-zinc-900 text-lg">{a.quiz.title}</h4>
                      <p className="text-sm text-zinc-500">Intento realizado el {new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-sm font-semibold text-zinc-900">Puntaje: {a.score.toFixed(2)}</span>
                        <span className="text-xs text-zinc-500">({a.timeUsed} segs)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
