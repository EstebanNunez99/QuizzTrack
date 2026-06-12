import prisma from '../prisma/index.js';

export const getAdminStats = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        email: true,
        attempts: {
          include: {
            quiz: { select: { title: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ students: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAdminQuiz = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(id) },
      include: {
        questions: {
          include: {
            options: true // Includes isCorrect explicitly
          }
        }
      }
    });
    res.json(quiz);
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};
