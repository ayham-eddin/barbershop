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
 * Serve the YAML under /api and let Swagger UI fetch it there too.
 ******************************************************************************/

// Serve the OpenAPI YAML from repo root at /api/openapi.yaml
app.get(`${Paths.Base}/openapi.yaml`, (_req, res) => {
  const filePath = path.join(process.cwd(), 'openapi.yaml');
  res.sendFile(filePath);
});

// swagger-ui-express typings are a bit loose; cast to RequestHandler(s)
const swaggerServe: RequestHandler[] =
  (swaggerUi.serve as unknown as RequestHandler[]);
const swaggerSetup: RequestHandler = (
  swaggerUi.setup(undefined, {
    swaggerOptions: { url: `${Paths.Base}/openapi.yaml` },
  }) as unknown as RequestHandler
);

// Mount docs at /api/docs
app.use(`${Paths.Base}/docs`, swaggerServe, swaggerSetup);

/******************************************************************************
 * Health (matches OpenAPI /health under the /api base)
 ******************************************************************************/
app.get(`${Paths.Base}/health`, (_req, res) => {
  res.json({ ok: true });
});

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
