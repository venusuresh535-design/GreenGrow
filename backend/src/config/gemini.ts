import { GoogleGenAI } from '@google/genai';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let genAIInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!config.gemini.apiKey || config.gemini.apiKey === 'your_gemini_api_key') {
    logger.warn('GEMINI_API_KEY is not configured or is set to placeholder.');
    return null;
  }

  if (!genAIInstance) {
    try {
      genAIInstance = new GoogleGenAI({
        apiKey: config.gemini.apiKey,
      });
      logger.info('GoogleGenAI client initialized successfully with model:', config.gemini.model);
    } catch (err: any) {
      logger.error('Failed to initialize GoogleGenAI client:', err.message);
      return null;
    }
  }

  return genAIInstance;
}
