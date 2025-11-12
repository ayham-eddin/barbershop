import { Router } from 'express';
import { validateBody } from '@src/middleware/validate';
import {
  registerSchema,
  loginSchema,
  updateMeSchema,
} from '@src/routes/validators/authSchemas';
import { register, login, getMe, updateMe } from '@src/routes/controllers/authController';
import { requireAuth } from '@src/middleware/requireAuth';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, validateBody(updateMeSchema), updateMe);

export default router;
