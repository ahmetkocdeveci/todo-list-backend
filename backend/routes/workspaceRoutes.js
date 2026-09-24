const express = require('express');
const router = express.Router();
const controller = require('../controllers/workspaceController');
const { protect } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

router.use(protect);
router.route('/').get(controller.listWorkspaces).post(validate(schemas.createWorkspace), controller.createWorkspace);
router.get('/invitations', controller.listInvitations);
router.post('/invitations/:invitationId/accept', controller.acceptInvitation);
router.post('/invitations/:invitationId/decline', controller.declineInvitation);
router.get('/:id', controller.getWorkspace);
router.post('/:id/invitations', validate(schemas.inviteWorkspaceMember), controller.inviteMember);
router.patch('/:id/members/:memberId', validate(schemas.updateWorkspaceMemberRole), controller.updateMemberRole);
router.delete('/:id/members/:memberId', controller.removeMember);
module.exports = router;
