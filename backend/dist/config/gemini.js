import { GoogleGenAI } from '@google/genai';
import { config } from './env.js';
import { logger } from '../utils/logger.js';
let genAIInstance = null;
export function getGeminiClient() {
    if (!config.gemini.apiKey || config.gemini.apiKey === 'your_gemini_api_key') {
        logger.warn('GEMINI_API_KEY is not configured or is set to placeholder.');
        throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env');
    }
    if (!genAIInstance) {
        try {
            genAIInstance = new GoogleGenAI({
                apiKey: config.gemini.apiKey,
            });
            logger.info('GoogleGenAI client initialized successfully with model:', config.gemini.model);
        }
        catch (err) {
            logger.error('Failed to initialize GoogleGenAI client:', err.message);
            throw err;
        }
    }
    return genAIInstance;
}
