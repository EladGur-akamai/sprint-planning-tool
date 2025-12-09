import { Router } from 'express';
import * as sprintTemplateController from '../controllers/sprintTemplateController';

const router = Router();

router.get('/', sprintTemplateController.getAllTemplates);
router.get('/quarters', sprintTemplateController.getAvailableQuarters);
router.get('/quarter/:year/:quarter', sprintTemplateController.getTemplatesByQuarter);
router.get('/:id', sprintTemplateController.getTemplateById);
router.post('/generate', sprintTemplateController.generateQuarterTemplates);
router.post('/:id/adopt', sprintTemplateController.adoptTemplate);
router.put('/:id', sprintTemplateController.updateTemplate);
router.delete('/:id', sprintTemplateController.deleteTemplate);

export default router;
