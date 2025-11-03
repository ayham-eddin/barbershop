/* eslint-disable n/no-process-env */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Load env in this order:
 *  1) root ".env" (optional)
 *  2) mode-specific file under backend/config:
 *     - .env.development when NODE_ENV=development (default)
 *     - .env.production  when NODE_ENV=production
 *     - .env.test        when NODE_ENV=test
 *
 * Works both in ts-node/tsx (src) and after build (dist).
 */

// 1) Always try root .env first (doesn't fail if missing)
const rootDotEnv = path.resolve(process.cwd(), '.env');
if (fs.existsSync(rootDotEnv)) {
  dotenv.config({ path: rootDotEnv });
}

// 2) Decide mode file
const mode = process.env.NODE_ENV?.toLowerCase() ?? 'development';
const modeFile =
  mode === 'production'
    ? 'config/.env.production'
    : mode === 'test'
      ? 'config/.env.test'
      : 'config/.env.development';

// 3) Load mode file if present
const modePath = path.resolve(process.cwd(), modeFile);
if (fs.existsSync(modePath)) {
  dotenv.config({ path: modePath });
}
