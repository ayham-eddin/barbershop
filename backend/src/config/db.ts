import mongoose from 'mongoose';
import logger from 'jet-logger';
import ENV from '@src/common/constants/ENV';

export async function connectDB() {
  await mongoose.connect(ENV.MongoUri);
  logger.info('✅ MongoDB connected');
  mongoose.connection.on('error', (e) => logger.err(e as Error));
}
