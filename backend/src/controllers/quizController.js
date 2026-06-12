import prisma from '../prisma/index.js';

export const getQuizzes = async (req, res) => {
  try {
    const whereClause = req.user.role === 'STUDENT' ? { isActive: true } : {};
    const quizzes = await prisma.quiz.findMany({ where: whereClause });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(id) },
      include: {
        questions: {
          include: {
            options: {
              select: { id: true, text: true, matchCorrect: true, imageUrl: true } // Se ocultará matchCorrect para estudiantes después
            }
          }
        }
      }
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    if (req.user.role === 'STUDENT') {
      if (!quiz.isActive) return res.status(403).json({ error: 'Cuestionario no habilitado' });

      // Aleatorizar preguntas
      quiz.questions = quiz.questions.sort(() => Math.random() - 0.5);
      // Limitar preguntas
      if (quiz.randomCount && quiz.randomCount > 0) {
        quiz.questions = quiz.questions.slice(0, quiz.randomCount);
      }
      // Aleatorizar opciones
      quiz.questions.forEach(q => {
        if (q.options) {
          q.options = q.options.sort(() => Math.random() - 0.5);
          if (q.type === 'MATCHING') {
            q.matchOptions = q.options.map(o => o.matchCorrect).filter(Boolean).sort(() => Math.random() - 0.5);
            // Hide distractors completely from the statements list
            q.options = q.options.filter(o => o.text !== '');
            // Hide the answer
            q.options.forEach(o => { delete o.matchCorrect; });
          }
        }
      });
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createQuiz = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { title, timeLimit, randomCount, passScore, isActive } = req.body;
    const quiz = await prisma.quiz.create({
      data: { 
        title, 
        timeLimit: timeLimit ? parseInt(timeLimit) : null, 
        randomCount: randomCount ? parseInt(randomCount) : null,
        passScore: passScore ? parseFloat(passScore) : 1,
        isActive: isActive || false
      }
    });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const { isActive, randomCount, passScore, timeLimit } = req.body;
    
    const quiz = await prisma.quiz.update({
      where: { id: parseInt(id) },
      data: { 
        isActive, 
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        randomCount: randomCount ? parseInt(randomCount) : null, 
        passScore: passScore ? parseFloat(passScore) : 1 
      }
    });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { quizId } = req.params;
    const { type, text, explanation, options, points, penaltyScore, imageUrl } = req.body;
    
    const question = await prisma.question.create({
      data: {
        quizId: parseInt(quizId),
        type,
        text,
        imageUrl,
        points: points ? parseFloat(points) : 1,
        penaltyScore: penaltyScore !== undefined ? parseFloat(penaltyScore) : 0.5,
        explanation,
        options: {
          create: options
        }
      },
      include: { options: true }
    });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { questionId } = req.params;
    const { type, text, explanation, options, points, imageUrl } = req.body;
    
    // Primero, borramos las opciones existentes
    await prisma.option.deleteMany({
      where: { questionId: parseInt(questionId) }
    });

    // Actualizamos la pregunta y creamos las nuevas opciones
    const updatedQuestion = await prisma.question.update({
      where: { id: parseInt(questionId) },
      data: {
        type,
        text,
        imageUrl,
        points: points ? parseFloat(points) : 1,
        explanation,
        options: {
          create: options
        }
      },
      include: { options: true }
    });
    
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeUsed } = req.body; 
    
    let score = 0;
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) },
      include: { questions: { include: { options: true } } }
    });
    
    const answerData = [];
    for (const ans of answers) {
      const q = quiz.questions.find(q => q.id === ans.questionId);
      
      if (q && (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE')) {
        const selectedOpts = ans.selectedOptions || [];
        const correctOptionsCount = q.options.filter(o => o.isCorrect).length;
        const pointsPerCorrect = correctOptionsCount > 0 ? q.points / correctOptionsCount : 0;
        const dynamicPenalty = pointsPerCorrect; // Se descuenta exactamente lo mismo que suma un acierto
        
        for (const optId of selectedOpts) {
          const option = q.options.find(o => o.id === optId);
          if (option && option.isCorrect) {
            score += pointsPerCorrect;
          } else {
            score -= dynamicPenalty;
          }
          answerData.push({
            questionId: ans.questionId,
            selectedOptionId: optId
          });
        }
      } else if (q && q.type === 'MATCHING') {
        let matchAnswers = {};
        try { matchAnswers = JSON.parse(ans.textAnswer || '{}'); } catch(e){}
        const validPairs = q.options.filter(o => o.text !== '');
        const totalPairs = validPairs.length;
        const pointsPerPair = totalPairs > 0 ? q.points / totalPairs : 0;

        for (const opt of validPairs) {
          const studentMatch = matchAnswers[opt.id];
          if (studentMatch && studentMatch === opt.matchCorrect) {
            score += pointsPerPair;
          } else if (studentMatch && studentMatch !== '') { 
            score -= pointsPerPair;
          }
        }
        answerData.push({
          questionId: ans.questionId,
          textAnswer: ans.textAnswer
        });
      } else if (q && q.type === 'TEXT') {
        answerData.push({
          questionId: ans.questionId,
          textAnswer: ans.textAnswer
        });
      }
    }

    if (score < 0) score = 0;

    const attempt = await prisma.attempt.create({
      data: {
        userId: req.user.id,
        quizId: parseInt(quizId),
        score,
        timeUsed,
        answers: { create: answerData }
      }
    });

    res.json(attempt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { questionId } = req.params;
    await prisma.question.delete({
      where: { id: parseInt(questionId) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { userId: req.user.id },
      include: { quiz: { select: { title: true, passScore: true, questions: { select: { id: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    
    // Calculamos el total de preguntas base para referencia (Nota: quiz.questions trae TODAS, pero el alumno puede haber visto randomCount)
    // Para simplificar, la vista de historial usará el passScore.
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLastAttemptReview = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const attempt = await prisma.attempt.findFirst({
      where: { userId: req.user.id, quizId: parseInt(quizId) },
      orderBy: { createdAt: 'desc' },
      include: { answers: true, quiz: { select: { title: true, passScore: true } } }
    });

    if (!attempt) return res.status(404).json({ error: 'Intento no encontrado' });

    const questionIds = [...new Set(attempt.answers.map(a => a.questionId))];
    
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true }
    });

    const questionScores = {};
    for (const q of questions) {
      let qScore = 0;
      const userAnswers = attempt.answers.filter(a => a.questionId === q.id);
      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        const selectedOpts = userAnswers.map(a => a.selectedOptionId).filter(Boolean);
        const correctOptionsCount = q.options.filter(o => o.isCorrect).length;
        const pointsPerCorrect = correctOptionsCount > 0 ? q.points / correctOptionsCount : 0;
        const dynamicPenalty = pointsPerCorrect;
        
        for (const optId of selectedOpts) {
          const option = q.options.find(o => o.id === optId);
          if (option && option.isCorrect) qScore += pointsPerCorrect;
          else qScore -= dynamicPenalty;
        }
      } else if (q.type === 'MATCHING') {
        let matchAnswers = {};
        try { matchAnswers = JSON.parse(userAnswers[0]?.textAnswer || '{}'); } catch(e){}
        const validPairs = q.options.filter(o => o.text !== '');
        const totalPairs = validPairs.length;
        const pointsPerPair = totalPairs > 0 ? q.points / totalPairs : 0;
        
        for (const opt of validPairs) {
          const studentMatch = matchAnswers[opt.id];
          if (studentMatch && studentMatch === opt.matchCorrect) {
            qScore += pointsPerPair;
          } else if (studentMatch && studentMatch !== '') {
            qScore -= pointsPerPair;
          }
        }
      }
      questionScores[q.id] = qScore;
    }

    res.json({ attempt, questions, questionScores });
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    await prisma.quiz.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAttempt = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    await prisma.attempt.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
