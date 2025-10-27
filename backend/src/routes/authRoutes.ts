import { Router } from 'express';
import { validate } from '@src/middleware/validate';
import { registerSchema, loginSchema }
  from '@src/routes/validators/authSchemas';
import { register, login }
  from '@src/routes/controllers/authController';

const r = Router();

r.post('/register', validate(registerSchema), register);
r.post('/login', validate(loginSchema), login);

export default r;
