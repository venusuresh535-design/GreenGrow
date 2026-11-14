import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient, createSupabaseUserClient, isSupabaseConfigured } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    isGuest?: boolean;
  };
  supabaseUserClient?: any;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const guestHeaderId = req.headers['x-guest-user-id'] as string;

  // 1. If Bearer token is provided and Supabase is configured
  if (authHeader && authHeader.startsWith('Bearer ') && isSupabaseConfigured()) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            req.user = {
              id: user.id,
              email: user.email,
              isGuest: false,
            };
            req.supabaseUserClient = createSupabaseUserClient(token);
            return next();
          }
        }
      } catch (err: any) {
        logger.warn('Token verification error:', err.message);
      }
    }
  }

  // 2. Demo / Guest Mode Fallback (Allows testing without requiring Supabase sign-in)
  const effectiveGuestId = guestHeaderId || 'guest-farmer-default';
  req.user = {
    id: effectiveGuestId,
    email: 'farmer@greengrow.local',
    isGuest: true,
  };

  return next();
}
