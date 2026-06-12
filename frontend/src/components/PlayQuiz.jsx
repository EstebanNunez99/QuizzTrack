import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';

export default function PlayQuiz({ quizId, token, onBack, onFinished }) {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    fetch(`${API_URL}/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else {
          setQuiz(data);
          setStartTime(Date.now());
          if (data.timeLimit && data.timeLimit > 0) {
            setTimeLeft(data.timeLimit * 60);
          }
        }
      })
      .catch(err => setError(err.message));
  }, [quizId, token]);

  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft === 0) {
      alert("¡El tiempo se ha acabado! El cuestionario se enviará automáticamente.");
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft === null, timeLeft === 0]); // Dependencias seguras

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCheckboxChange = (optionId, checked) => {
    const qId = quiz.questions[currentQuestionIndex].id;
    setAnswers(prev => {
      const current = prev[qId] || [];
      if (checked) return { ...prev, [qId]: [...current, optionId] };
      return { ...prev, [qId]: current.filter(id => id !== optionId) };
    });
  };

  const handleTextChange = (text) => {
    const qId = quiz.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const handleMatchChange = (optionId, text) => {
    const qId = quiz.questions[currentQuestionIndex].id;
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...(prev[qId] || {}), [optionId]: text }
    }));
  };

  const handleSubmit = async () => {
    const formattedAnswers = Object.keys(answers).map(qId => {
      const q = quiz.questions.find(x => x.id === parseInt(qId));
      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        return { questionId: parseInt(qId), selectedOptions: answers[qId] };
      } else if (q.type === 'MATCHING') {
        return { questionId: parseInt(qId), textAnswer: JSON.stringify(answers[qId]) };
      } else {
        return { questionId: parseInt(qId), textAnswer: answers[qId] };
      }
    });

    const timeUsed = Math.floor((Date.now() - startTime) / 1000);

    const res = await fetch(`${API_URL}/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers: formattedAnswers, timeUsed })
    });
    
    if (res.ok) {
      onFinished();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl">{error}</div>;
  if (!quiz) return <div className="p-8 text-center text-zinc-500">Cargando cuestionario...</div>;

  const q = quiz.questions[currentQuestionIndex];
  const isLast = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto mt-4">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={16} /> Salir del cuestionario
        </button>

        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold font-mono text-sm shadow-sm border ${timeLeft <= 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-zinc-200 text-zinc-700'}`}>
            <Clock size={16} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-zinc-900"></div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Pregunta {currentQuestionIndex + 1} de {quiz.questions.length}
            </span>
            <span className="text-zinc-400 text-sm font-medium">({q.points || 1} pts)</span>
          </div>

          <h3 className="text-xl font-medium text-zinc-900 mb-4 leading-relaxed">
            {q.text}
          </h3>
          
          {q.imageUrl && (
            <div className="mb-8 rounded-xl overflow-hidden border border-zinc-200">
              <img src={q.imageUrl} alt="Imagen de la pregunta" className="w-full max-h-[400px] object-contain bg-zinc-50" />
            </div>
          )}
          
          <div className="space-y-3.5">
            {q.type === 'TEXT' ? (
              <textarea 
                className="w-full p-4 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:outline-none min-h-[150px] resize-y bg-zinc-50 text-zinc-800"
                placeholder="Escribe tu respuesta aquí..."
                value={answers[q.id] || ''}
                onChange={(e) => handleTextChange(e.target.value)}
              />
            ) : q.type === 'MATCHING' ? (
              <div className="space-y-4">
                {q.options.map(o => (
                  <div key={o.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border bg-white border-zinc-200 hover:border-zinc-300 transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {o.imageUrl && <img src={o.imageUrl} alt="Concepto" className="w-10 h-10 rounded object-cover border border-zinc-200" />}
                      <span className="font-medium text-zinc-900">{o.text}</span>
                    </div>
                    <select
                      className="w-full sm:w-1/2 p-2.5 bg-zinc-50 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none text-sm text-zinc-800"
                      value={(answers[q.id] && answers[q.id][o.id]) || ''}
                      onChange={(e) => handleMatchChange(o.id, e.target.value)}
                    >
                      <option value="">Selecciona una respuesta...</option>
                      {q.matchOptions?.map((mo, idx) => (
                        <option key={idx} value={mo}>{mo}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              q.options.map(o => {
                const isChecked = (answers[q.id] || []).includes(o.id);
                return (
                  <label 
                    key={o.id} 
                    className={`flex items-start gap-4 p-4 sm:p-5 rounded-xl border cursor-pointer transition-all ${
                      isChecked ? 'bg-zinc-50 border-zinc-900 ring-1 ring-zinc-900' : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center h-6 mt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer accent-zinc-900"
                        checked={isChecked}
                        onChange={(e) => handleCheckboxChange(o.id, e.target.checked)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      {o.imageUrl && <img src={o.imageUrl} alt="Opción" className="w-16 h-16 rounded object-cover border border-zinc-200" />}
                      <span className={`text-base ${isChecked ? 'text-zinc-900 font-medium' : 'text-zinc-700'}`}>
                        {o.text}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 mt-8 border-t border-zinc-100">
          <button 
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={16} /> Anterior
          </button>

          {isLast ? (
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-zinc-900 hover:bg-zinc-800 transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
            >
              <Check size={16} /> Finalizar y Enviar
            </button>
          ) : (
            <button 
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            >
              Siguiente <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
