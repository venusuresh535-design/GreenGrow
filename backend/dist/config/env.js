import dotenv from 'dotenv';
// Load .env
dotenv.config();
export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    },
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
