import express from 'express';
import { getQuizzes, getQuiz, createQuiz, updateQuiz, addQuestion, updateQuestion, submitAttempt, deleteQuestion, getMyAttempts, getLastAttemptReview, deleteQuiz, deleteAttempt } from '../controllers/quizController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, getQuizzes);
router.get('/attempts/me', authenticate, getMyAttempts);
router.get('/attempts/last/:quizId/review', authenticate, getLastAttemptReview);
router.get('/:id', authenticate, getQuiz);
router.post('/', authenticate, createQuiz);
router.put('/:id', authenticate, updateQuiz);
router.post('/:quizId/questions', authenticate, addQuestion);
router.put('/questions/:questionId', authenticate, updateQuestion);
router.post('/:quizId/submit', authenticate, submitAttempt);
router.delete('/:quizId/questions/:questionId', authenticate, deleteQuestion);
router.delete('/:id', authenticate, deleteQuiz);
router.delete('/attempts/:id', authenticate, deleteAttempt);

export default router;
