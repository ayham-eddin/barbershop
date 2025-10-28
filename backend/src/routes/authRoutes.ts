import { Router } from 'express';
import { validateBody } from '@src/middleware/validate';
import { 
  registerSchema, 
  loginSchema,
} from '@src/routes/validators/authSchemas';
import { register, login } from '@src/routes/controllers/authController';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

export default router;
