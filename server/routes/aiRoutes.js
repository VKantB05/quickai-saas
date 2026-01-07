import express from 'express';
import { generateArticle } from '../controllers/aiController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/generate-article', auth, generateArticle);

export default router;