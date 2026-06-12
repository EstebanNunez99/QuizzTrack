import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import StudentDashboard from './components/StudentDashboard';
import PlayQuiz from './components/PlayQuiz';
import AdminDashboard from './components/AdminDashboard';
import ReviewAttempt from './components/ReviewAttempt';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [quizzes, setQuizzes] = useState([]);
  
  // Student state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [reviewQuizId, setReviewQuizId] = useState(null); // ID of quiz just finished
  
  // Admin state
  const [adminQuiz, setAdminQuiz] = useState(null);

  useEffect(() => {
    if (token) fetchQuizzes();
  }, [token]);

  const login = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      alert('Error en login. Revisa tus credenciales.');
    }
  };

  const register = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const role = 'STUDENT'; // Fijamos rol por defecto
    
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    if (res.ok) {
      alert('Registrado con exito. Ahora inicia sesión.');
      e.target.reset();
    } else {
      alert('Error al registrar.');
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActiveQuiz(null);
    setAdminQuiz(null);
    setReviewQuizId(null);
  };

  const fetchQuizzes = async () => {
    const res = await fetch(`${API_URL}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if(res.ok) setQuizzes(data);
  };

  const playQuiz = (id) => {
    setActiveQuiz(id);
    setReviewQuizId(null);
  };

  if (!token) {
    return (
      <Layout user={null} onLogout={logout}>
        <Auth onLogin={login} onRegister={register} />
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={logout}>
      {reviewQuizId ? (
        <ReviewAttempt 
          quizId={reviewQuizId}
          token={token}
          onBack={() => setReviewQuizId(null)}
        />
      ) : activeQuiz ? (
        <PlayQuiz 
          quizId={activeQuiz}
          token={token}
          onBack={() => setActiveQuiz(null)}
          onFinished={() => {
            const finishedId = activeQuiz;
            setActiveQuiz(null);
            setReviewQuizId(finishedId);
          }}
        />
      ) : user.role === 'ADMIN' ? (
        <AdminDashboard 
          token={token} 
          quizzes={quizzes} 
          fetchQuizzes={fetchQuizzes}
          adminQuiz={adminQuiz}
          setAdminQuiz={setAdminQuiz}
        />
      ) : (
        <StudentDashboard 
          token={token}
          quizzes={quizzes} 
          onPlayQuiz={playQuiz} 
        />
      )}
    </Layout>
  );
}

export default App;
