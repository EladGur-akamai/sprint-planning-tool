import { Router } from 'express';
import * as sprintController from '../controllers/sprintController';

const router = Router();

router.get('/', sprintController.getAllSprints);
router.get('/current', sprintController.getCurrentSprint);
router.get('/:id', sprintController.getSprintById);
router.get('/:id/capacity', sprintController.getSprintCapacity);
router.post('/', sprintController.createSprint);
router.put('/:id', sprintController.updateSprint);
router.delete('/:id', sprintController.deleteSprint);

export default router;
