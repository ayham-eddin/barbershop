import { Router } from 'express';
import { requireAuth } from '@src/middleware/requireAuth';
import { requireAdmin } from '@src/middleware/requireAdmin';
import * as C from './controllers/barberController';

const r = Router();

// public list
r.get('/', C.listBarbers);

// admin CRUD
r.post('/', requireAuth, requireAdmin, C.createBarber);
r.patch('/:id', requireAuth, requireAdmin, C.updateBarber);
r.delete('/:id', requireAuth, requireAdmin, C.deleteBarber);

export default r;
