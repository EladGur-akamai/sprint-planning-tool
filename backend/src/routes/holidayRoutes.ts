import { Router } from 'express';
import * as holidayController from '../controllers/holidayController';

const router = Router();

router.get('/sprint/:sprintId', holidayController.getHolidaysBySprintId);
router.get('/sprint/:sprintId/member/:memberId', holidayController.getHolidaysBySprintAndMember);
router.post('/', holidayController.createHoliday);
router.post('/toggle', holidayController.toggleHoliday);
router.delete('/:id', holidayController.deleteHoliday);

export default router;
