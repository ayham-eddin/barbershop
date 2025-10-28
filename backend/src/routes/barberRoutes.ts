import { Router } from 'express';
import {
  listBarbers,
  getBarber,
  getBarberSlots,
} from './controllers/barberController';

const router = Router();

router.get('/', listBarbers);
router.get('/:id', getBarber);
router.get('/:id/slots', getBarberSlots);

export default router;
