import morgan from 'morgan';
import helmet from 'helmet';
import express, {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import logger from 'jet-logger';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

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

/******************************************************************************
 * OpenAPI / Swagger UI
 * Serve the YAML statically and let Swagger UI fetch it.
 ******************************************************************************/

app.get('/openapi.yaml', (_req, res) => {
  const filePath = path.join(process.cwd(), 'openapi.yaml');
  res.sendFile(filePath);
});

// Narrow, local suppression for swagger-ui-express’ loose types
/* eslint-disable @typescript-eslint/no-unsafe-member-access,
                  @typescript-eslint/no-unsafe-call */
const swaggerServe: RequestHandler[] =
  (swaggerUi.serve as unknown as RequestHandler[]);
const swaggerSetup: RequestHandler =
  (swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/openapi.yaml' },
  }) as unknown as RequestHandler);
/* eslint-enable @typescript-eslint/no-unsafe-member-access,
                 @typescript-eslint/no-unsafe-call */

app.use('/docs', swaggerServe, swaggerSetup);

/******************************************************************************
 * API Routes
 ******************************************************************************/

app.use(Paths.Base, BaseRouter);

/******************************************************************************
 * 404
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
  void _next;

  const asError = err instanceof Error ? err : new Error(String(err));

  if (ENV.NodeEnv !== NodeEnvs.Test) {
    logger.info(`[ERROR] ${asError.name}: ${asError.message}`);
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
