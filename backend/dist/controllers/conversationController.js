import { isSupabaseConfigured, demoStore } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
// GET /api/conversations
export async function getConversations(req, res) {
    try {
        const userId = req.user?.id || 'guest-farmer';
        const isGuest = req.user?.isGuest;
        if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
            const { data, error } = await req.supabaseUserClient
                .from('conversations')
                .select('id, title, preferred_language, created_at, updated_at')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });
            if (error) {
                logger.error('Error fetching Supabase conversations:', error.message);
                return res.status(500).json({ success: false, error: error.message });
            }
            return res.status(200).json({ success: true, conversations: data || [] });
        }
        const convs = demoStore.getConversations(userId).map(c => ({
            id: c.id,
            title: c.title,
            preferred_language: c.preferred_language,
            created_at: c.created_at,
            updated_at: c.updated_at,
        }));
        return res.status(200).json({ success: true, conversations: convs });
    }
    catch (err) {
        logger.error('getConversations error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}
// GET /api/conversations/:id
export async function getConversationById(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id || 'guest-farmer';
        const isGuest = req.user?.isGuest;
        if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
            const { data, error } = await req.supabaseUserClient
                .from('conversations')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();
            if (error || !data) {
                return res.status(404).json({ success: false, error: 'Conversation not found.' });
            }
            return res.status(200).json({ success: true, conversation: data });
        }
        const conv = demoStore.getConversation(id, userId);
        if (!conv) {
            return res.status(404).json({ success: false, error: 'Conversation not found.' });
        }
        return res.status(200).json({ success: true, conversation: conv });
    }
    catch (err) {
        logger.error('getConversationById error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}
// POST /api/conversations
export async function createConversation(req, res) {
    try {
        const userId = req.user?.id || 'guest-farmer';
        const isGuest = req.user?.isGuest;
        const { title = 'New Farming Chat', preferred_language = 'en', messages = [] } = req.body;
        const now = new Date().toISOString();
        if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
            const { data, error } = await req.supabaseUserClient
                .from('conversations')
                .insert({
                user_id: userId,
                title,
                preferred_language,
                messages,
                created_at: now,
                updated_at: now,
            })
                .select()
                .single();
            if (error) {
                logger.error('Error creating Supabase conversation:', error.message);
                return res.status(500).json({ success: false, error: error.message });
            }
            return res.status(201).json({ success: true, conversation: data });
        }
        const newId = crypto.randomUUID();
        const newConv = {
            id: newId,
            user_id: userId,
            title,
            preferred_language,
            messages,
            created_at: now,
            updated_at: now,
        };
        demoStore.saveConversation(newConv);
        return res.status(201).json({ success: true, conversation: newConv });
    }
    catch (err) {
        logger.error('createConversation error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}
// PUT /api/conversations/:id
export async function updateConversation(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id || 'guest-farmer';
        const isGuest = req.user?.isGuest;
        const { title, messages, preferred_language } = req.body;
        const now = new Date().toISOString();
        if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
            const updates = { updated_at: now };
            if (title !== undefined)
                updates.title = title;
            if (messages !== undefined)
                updates.messages = messages;
            if (preferred_language !== undefined)
                updates.preferred_language = preferred_language;
            const { data, error } = await req.supabaseUserClient
                .from('conversations')
                .update(updates)
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single();
            if (error) {
                logger.error('Error updating Supabase conversation:', error.message);
                return res.status(500).json({ success: false, error: error.message });
            }
            return res.status(200).json({ success: true, conversation: data });
        }
        const existing = demoStore.getConversation(id, userId);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Conversation not found.' });
        }
        if (title !== undefined)
            existing.title = title;
        if (messages !== undefined)
            existing.messages = messages;
        if (preferred_language !== undefined)
            existing.preferred_language = preferred_language;
        existing.updated_at = now;
        demoStore.saveConversation(existing);
        return res.status(200).json({ success: true, conversation: existing });
    }
    catch (err) {
        logger.error('updateConversation error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}
// DELETE /api/conversations/:id
export async function deleteConversation(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id || 'guest-farmer';
        const isGuest = req.user?.isGuest;
        if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
            const { error } = await req.supabaseUserClient
                .from('conversations')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
            if (error) {
                logger.error('Error deleting Supabase conversation:', error.message);
                return res.status(500).json({ success: false, error: error.message });
            }
            return res.status(200).json({ success: true, message: 'Conversation deleted successfully.' });
        }
        const deleted = demoStore.deleteConversation(id, userId);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Conversation not found or already deleted.' });
        }
        return res.status(200).json({ success: true, message: 'Conversation deleted successfully.' });
    }
    catch (err) {
        logger.error('deleteConversation error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}
