import http from 'http';
import app from './server';
import logger from 'jet-logger';
import ENV from '@src/common/constants/ENV';
import { connectDB } from './config/db';

const server = http.createServer(app);

logger.info('>>> ENTRY: index.ts is running');

(async () => {
  try {
    await connectDB();
    server.listen(ENV.Port, () => {
      logger.info(`🚀 API listening on http://localhost:${ENV.Port}`);
    });
    server.on('error', (err) => {
      logger.err(err);
      process.exitCode = 1;
    });
  } catch (err) {
    logger.err('❌ Fatal startup error');
    logger.err(err as Error);
    process.exitCode = 1;
  }
})();
