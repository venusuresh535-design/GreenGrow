import { Router } from 'express';
import { config } from '../config/env.js';
import { isSupabaseConfigured } from '../services/supabaseService.js';
const router = Router();
router.get('/', (req, res) => {
    const geminiReady = Boolean(config.gemini.apiKey && config.gemini.apiKey !== 'your_gemini_api_key');
    const supabaseReady = isSupabaseConfigured();
    res.status(200).json({
        status: 'ok',
        service: 'GreenGrow AI Agriculture Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        ai: {
            provider: 'Google Gemini',
            model: config.gemini.model,
            configured: geminiReady,
        },
        database: {
            provider: 'Supabase',
            configured: supabaseReady,
        },
        environment: config.nodeEnv,
    });
});
export default router;
