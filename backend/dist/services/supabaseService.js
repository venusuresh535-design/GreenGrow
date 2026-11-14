import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
let supabaseClient = null;
let supabaseServiceClient = null;
export function isSupabaseConfigured() {
    return Boolean(config.supabase.url &&
        config.supabase.url.startsWith('https://') &&
        config.supabase.anonKey &&
        config.supabase.anonKey !== 'your_supabase_anon_key');
}
export function getSupabaseClient() {
    if (!isSupabaseConfigured()) {
        return null;
    }
    if (!supabaseClient) {
        try {
            supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);
            logger.info('Supabase client initialized.');
        }
        catch (err) {
            logger.error('Failed to initialize Supabase client:', err.message);
        }
    }
    return supabaseClient;
}
export function getSupabaseServiceClient() {
    if (!isSupabaseConfigured() || !config.supabase.serviceRoleKey || config.supabase.serviceRoleKey === 'your_service_role_key') {
        return null;
    }
    if (!supabaseServiceClient) {
        try {
            supabaseServiceClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
            logger.info('Supabase Service Role client initialized.');
        }
        catch (err) {
            logger.error('Failed to initialize Supabase service role client:', err.message);
        }
    }
    return supabaseServiceClient;
}
export function createSupabaseUserClient(authToken) {
    if (!isSupabaseConfigured())
        return null;
    return createClient(config.supabase.url, config.supabase.anonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        },
    });
}
const inMemoryConversations = new Map();
const inMemoryProfiles = new Map();
export const demoStore = {
    getConversations(userId) {
        return Array.from(inMemoryConversations.values())
            .filter((c) => c.user_id === userId)
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    },
    getConversation(id, userId) {
        const conv = inMemoryConversations.get(id);
        if (conv && conv.user_id === userId)
            return conv;
        return undefined;
    },
    saveConversation(conv) {
        inMemoryConversations.set(conv.id, conv);
    },
    deleteConversation(id, userId) {
        const conv = inMemoryConversations.get(id);
        if (conv && conv.user_id === userId) {
            inMemoryConversations.delete(id);
            return true;
        }
        return false;
    },
    getProfile(userId) {
        return inMemoryProfiles.get(userId) || {
            id: userId,
            full_name: 'Guest Farmer',
            preferred_language: 'en',
            country_code: '',
            region: '',
            created_at: new Date().toISOString(),
        };
    },
    saveProfile(userId, data) {
        const current = demoStore.getProfile(userId);
        const updated = { ...current, ...data, id: userId };
        inMemoryProfiles.set(userId, updated);
        return updated;
    }
};
