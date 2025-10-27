import { Router } from 'express';
import AuthRoutes from './authRoutes';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.use('/auth', AuthRoutes);

export default router;
