import morgan from 'morgan';
import helmet from 'helmet';
import express, { Request, Response } from 'express';
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

if (ENV.NodeEnv === NodeEnvs.Dev) app.use(morgan('dev'));
if (ENV.NodeEnv === NodeEnvs.Production) {
  // eslint-disable-next-line n/no-process-env
  if (!process.env.DISABLE_HELMET) app.use(helmet());
}

// API Routes
app.use(Paths.Base, BaseRouter);

/******************************************************************************
 * Global Error Handler (type-safe, no unsafe calls)
 ******************************************************************************/

app.use((err: unknown, _req: Request, res: Response) => {
  // log safely without calling logger.err (avoids no-unsafe-call)
  if (ENV.NodeEnv !== NodeEnvs.Test.valueOf()) {
    const msg =
      err instanceof Error
        ? err.stack ?? err.message
        : typeof err === 'string'
          ? err
          : JSON.stringify(err);
    logger.info(`[ERROR] ${msg}`);
  }

  if (err instanceof RouteError) {
    return res.status(err.status).json({ error: err.message });
  }

  return res
    .status(HttpStatusCodes.BAD_REQUEST)
    .json({ error: err instanceof Error ? err.message : 'Bad Request' });
});

export default app;
