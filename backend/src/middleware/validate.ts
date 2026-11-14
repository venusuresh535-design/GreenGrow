import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load valid language codes
let validLanguageCodes = new Set<string>();
try {
  const languagesPath = path.resolve(__dirname, '../data/languages.json');
  if (fs.existsSync(languagesPath)) {
    const raw = fs.readFileSync(languagesPath, 'utf-8');
    const langs = JSON.parse(raw);
    langs.forEach((l: any) => validLanguageCodes.add(l.code.toLowerCase()));
  }
} catch (e) {
  // Fallback defaults
  ['en', 'hi', 'kn', 'te', 'ta', 'mr', 'ml', 'gu', 'bn', 'pa', 'es', 'fr', 'de'].forEach(c => validLanguageCodes.add(c));
}

export function validateChatInput(req: Request, res: Response, next: NextFunction) {
  const { message, language } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message content is required and cannot be empty.',
    });
  }

  if (message.length > 3000) {
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

  // Sanitize
  req.body.message = message.trim();

  next();
}
