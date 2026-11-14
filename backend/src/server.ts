import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`=========================================`);
  logger.info(`🌱 GreenGrow AI Agriculture Server Running`);
  logger.info(`📡 Port: ${PORT}`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
  logger.info(`🤖 Gemini Model: ${config.gemini.model}`);
  logger.info(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`=========================================`);
});
