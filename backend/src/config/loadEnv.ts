import dotenv from 'dotenv';
import path from 'path';

// load backend/config/.env.development explicitly
const envPath = path.resolve(process.cwd(), 'config/.env.development');
dotenv.config({ path: envPath });
