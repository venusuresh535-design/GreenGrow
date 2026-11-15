import { Request, Response, NextFunction } from 'express';
import languages from '../data/languages.json' with { type: 'json' };

// Load valid language codes
const validLanguageCodes = new Set<string>();
try {
  (languages as any[]).forEach((l: any) => {
    if (l && l.code) validLanguageCodes.add(l.code.toLowerCase());
  });
} catch {
  ['en', 'hi', 'kn', 'te', 'ta', 'mr', 'ml', 'gu', 'bn', 'pa', 'es', 'fr', 'de'].forEach(c => validLanguageCodes.add(c));
}

export function validateChatInput(req: Request, res: Response, next: NextFunction) {
  const { message, image, language } = req.body;

  if ((!message || typeof message !== 'string' || message.trim().length === 0) && !image) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a farming question or take/upload a crop photo.',
    });
  }

  if (message && typeof message === 'string' && message.length > 3000) {
    return res.status(400).json({
      success: false,
      error: 'Message is too long. Please keep your question under 3000 characters.',
    });
  }

  // Validate language code if provided
  if (language && language.code) {
    const code = String(language.code).toLowerCase();
    if (!validLanguageCodes.has(code) && code !== 'en') {
      // Still allow but warn or default
      req.body.language.code = code;
    }
  }

  // Sanitize message if string
  if (typeof message === 'string') {
    req.body.message = message.trim();
  }

  next();
}
