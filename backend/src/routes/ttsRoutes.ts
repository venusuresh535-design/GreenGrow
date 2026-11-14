import { Router, Request, Response } from 'express';
import { synthesizeNativeSpeech } from '../services/ttsService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/tts?text=...&lang=...
router.get('/', async (req: Request, res: Response) => {
  try {
    const text = req.query.text as string;
    const lang = req.query.lang as string;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Text query parameter is required.' });
    }

    const audioBuffer = await synthesizeNativeSpeech(text, lang);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.end(audioBuffer);
  } catch (error: any) {
    logger.error('TTS Route Error:', error.message || error);
    return res.status(500).json({ success: false, error: error.message || 'TTS synthesis failed.' });
  }
});

export default router;
