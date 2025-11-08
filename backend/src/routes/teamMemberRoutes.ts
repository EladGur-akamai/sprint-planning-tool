import { Router } from 'express';
import * as teamMemberController from '../controllers/teamMemberController';

const router = Router();

router.get('/', teamMemberController.getAllMembers);
router.get('/:id', teamMemberController.getMemberById);
router.post('/', teamMemberController.createMember);
router.put('/:id', teamMemberController.updateMember);
router.delete('/:id', teamMemberController.deleteMember);

export default router;
