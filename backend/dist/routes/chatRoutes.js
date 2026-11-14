import { Router } from 'express';
import { handleChatMessage, handleAudioTranscribe } from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { validateChatInput } from '../middleware/validate.js';
const router = Router();
// POST /api/chat - Send a message and receive Gemini agriculture response
router.post('/', authenticate, chatRateLimiter, validateChatInput, handleChatMessage);
// POST /api/chat/transcribe - Transcribe voice audio using Gemini
router.post('/transcribe', authenticate, handleAudioTranscribe);
export default router;
