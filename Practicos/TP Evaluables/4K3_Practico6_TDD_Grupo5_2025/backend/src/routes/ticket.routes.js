import { Router } from 'express';
import { crearTicket} from '../controllers/ticket.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', requireAuth, crearTicket);


export default router;
