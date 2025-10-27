import { Router } from 'express';

const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});

export default apiRouter;
