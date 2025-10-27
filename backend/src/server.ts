import morgan from 'morgan';
import helmet from 'helmet';
import express, { Request, Response, NextFunction } from 'express';
import logger from 'jet-logger';
import cors from 'cors';

import BaseRouter from '@src/routes';
import Paths from '@src/common/constants/Paths';
import ENV from '@src/common/constants/ENV';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/util/route-errors';
import { NodeEnvs } from '@src/common/constants';

/******************************************************************************
 * Setup
 ******************************************************************************/

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

if (ENV.NodeEnv === NodeEnvs.Dev) {
  app.use(morgan('dev'));
}

if (ENV.NodeEnv === NodeEnvs.Production) {
  // eslint-disable-next-line n/no-process-env
  if (!process.env.DISABLE_HELMET) {
    app.use(helmet());
  }
}

// API Routes
app.use(Paths.Base, BaseRouter);

/******************************************************************************
 * 404 (optional but nice)
 ******************************************************************************/
app.use((_req, res) => {
  res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Not found' });
});

/******************************************************************************
 * Global Error Handler
 ******************************************************************************/
app.use((
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // explicitly mark _next as intentionally unused
  void _next;

  const asError = err instanceof Error ? err : new Error(String(err));

  if (ENV.NodeEnv !== NodeEnvs.Test) {
    const msg = `${asError.name}: ${asError.message}`;
    logger.info(`[ERROR] ${msg}`);
  }

  if (err instanceof RouteError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (!res.headersSent) {
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Internal server error' });
  }

  return undefined;
});

export default app;
