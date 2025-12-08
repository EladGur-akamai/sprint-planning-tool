import { Router } from 'express';
import {
  getRetroItemsBySprintId,
  createRetroItem,
  updateRetroItem,
  deleteRetroItem,
} from '../controllers/retroController';

const router = Router();

router.get('/sprint/:sprintId', getRetroItemsBySprintId);
router.post('/', createRetroItem);
router.put('/:id', updateRetroItem);
router.delete('/:id', deleteRetroItem);

export default router;
