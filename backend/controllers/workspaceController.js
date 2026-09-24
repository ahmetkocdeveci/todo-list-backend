const workspaceService = require('../services/workspaceService');

const listWorkspaces = async (req, res, next) => {
  try { res.json({ success: true, workspaces: await workspaceService.listWorkspaces(req.user._id) }); } catch (error) { next(error); }
};
const createWorkspace = async (req, res, next) => {
  try { const workspace = await workspaceService.createTeamWorkspace(req.user._id, req.body); res.status(201).json({ success: true, message: 'Team workspace created.', workspace }); } catch (error) { next(error); }
};
const getWorkspace = async (req, res, next) => {
  try { const result = await workspaceService.getWorkspaceDetail(req.user._id, req.params.id); res.json({ success: true, ...result }); } catch (error) { next(error); }
};
const inviteMember = async (req, res, next) => {
  try { const invitation = await workspaceService.inviteMember({ userId: req.user._id, workspaceId: req.params.id, ...req.body }); res.status(201).json({ success: true, message: 'Invitation created.', invitation }); } catch (error) { next(error); }
};
const listInvitations = async (req, res, next) => {
  try { res.json({ success: true, invitations: await workspaceService.listPendingInvitations(req.user._id) }); } catch (error) { next(error); }
};
const acceptInvitation = async (req, res, next) => {
  try { await workspaceService.respondToInvitation({ userId: req.user._id, invitationId: req.params.invitationId, accept: true }); res.json({ success: true, message: 'Invitation accepted.' }); } catch (error) { next(error); }
};
const declineInvitation = async (req, res, next) => {
  try { await workspaceService.respondToInvitation({ userId: req.user._id, invitationId: req.params.invitationId, accept: false }); res.json({ success: true, message: 'Invitation declined.' }); } catch (error) { next(error); }
};
const updateMemberRole = async (req, res, next) => {
  try { await workspaceService.changeMemberRole({ userId: req.user._id, workspaceId: req.params.id, memberId: req.params.memberId, role: req.body.role }); res.json({ success: true, message: 'Member role updated.' }); } catch (error) { next(error); }
};
const removeMember = async (req, res, next) => {
  try { await workspaceService.removeMember({ userId: req.user._id, workspaceId: req.params.id, memberId: req.params.memberId }); res.json({ success: true, message: 'Member removed.' }); } catch (error) { next(error); }
};
module.exports = { listWorkspaces, createWorkspace, getWorkspace, inviteMember, listInvitations, acceptInvitation, declineInvitation, updateMemberRole, removeMember };
