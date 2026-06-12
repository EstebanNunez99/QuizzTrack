import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getAdminStats, getAdminQuiz } from '../controllers/adminController.js';

const router = express.Router();
router.use(authenticate);

router.get('/stats', getAdminStats);
router.get('/quizzes/:id', getAdminQuiz);

export default router;
