import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import chatRoutes from './routes/chatRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import ttsRoutes from './routes/ttsRoutes.js';
// Process-level safety
process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('CRITICAL UNHANDLED REJECTION:', reason);
});
export const app = express();
// Trust proxy for reverse proxies (Vercel, Cloudflare, etc.)
app.set('trust proxy', 1);
// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            config.frontendUrl,
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
        ];
        if (allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
            return callback(null, true);
        }
        return callback(null, true); // Permissive in dev/hackathon
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-user-id'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Request logger
app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
});
// API Routes (mounted with /api and direct root for Vercel rewrites compatibility)
app.use(['/api/health', '/health'], healthRoutes);
app.use(['/api/chat', '/chat'], chatRoutes);
app.use(['/api/conversations', '/conversations'], conversationRoutes);
app.use(['/api/profile', '/profile'], profileRoutes);
app.use(['/api/tts', '/tts'], ttsRoutes);
// Root route
app.get(['/', '/api'], (_req, res) => {
    res.json({
        message: 'GreenGrow AI Agriculture API is running.',
        healthCheck: '/api/health',
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found.`,
    });
});
// Global error handler
app.use((err, _req, res, _next) => {
    logger.error('Unhandled Server Error:', err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});
export default app;
