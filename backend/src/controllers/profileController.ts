import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { isSupabaseConfigured, demoStore } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';

// GET /api/profile
export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id || 'guest-farmer';
    const isGuest = req.user?.isGuest;

    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      const { data, error } = await req.supabaseUserClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching Supabase profile:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      if (data) {
        return res.status(200).json({ success: true, profile: data });
      }
    }

    const profile = demoStore.getProfile(userId);
    return res.status(200).json({ success: true, profile });
  } catch (err: any) {
    logger.error('getProfile error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/profile
export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id || 'guest-farmer';
    const isGuest = req.user?.isGuest;
    const { full_name, preferred_language, country_code, region } = req.body;

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (preferred_language !== undefined) updates.preferred_language = preferred_language;
    if (country_code !== undefined) updates.country_code = country_code;
    if (region !== undefined) updates.region = region;

    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      const { data, error } = await req.supabaseUserClient
        .from('profiles')
        .upsert({ id: userId, ...updates })
        .select()
        .single();

      if (error) {
        logger.error('Error updating Supabase profile:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, profile: data });
    }

    const updatedProfile = demoStore.saveProfile(userId, updates);
    return res.status(200).json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    logger.error('updateProfile error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
