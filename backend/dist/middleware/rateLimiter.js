import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 chat requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: (req) => {
        // Safely extract IP without crashing on synthetic serverless req.socket
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string' && forwarded.length > 0) {
            return forwarded.split(',')[0].trim();
        }
        const realIp = req.headers['x-real-ip'];
        if (typeof realIp === 'string' && realIp.length > 0) {
            return realIp.trim();
        }
        return req.socket?.remoteAddress || '127.0.0.1';
    },
    message: {
        success: false,
        error: 'Too many messages sent. Please slow down and try again in a minute.',
    },
});
export function chatRateLimiter(req, res, next) {
    // In serverless environments (e.g. Vercel, AWS Lambda), bypass in-memory rate limiter
    // to prevent undefined socket crashes and let Vercel Edge manage rate limiting
    if (process.env.VERCEL) {
        return next();
    }
    return limiter(req, res, next);
}
