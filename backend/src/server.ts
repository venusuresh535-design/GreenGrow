import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore in environments where this isn't supported
}

import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = config.port || 5001;

// Only start standalone listener when not running in serverless (e.g. Vercel)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`=========================================`);
    logger.info(`🌱 GreenGrow AI Agriculture Server Running`);
    logger.info(`📡 Port: ${PORT}`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
    logger.info(`🤖 Gemini Model: ${config.gemini.model}`);
    logger.info(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    logger.info(`=========================================`);
  });
}

export default app;
export { app };

