const Workspace = require('../models/Workspace');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const User = require('../models/User');
const Todo = require('../models/Todo');
const AppError = require('../utils/AppError');

const sameId = (left, right) => String(left) === String(right);
const getMember = (workspace, userId) => workspace.members.find((member) => sameId(member.user, userId));

const ensurePersonalWorkspace = async (userId) => {
  let workspace = await Workspace.findOne({ owner: userId, type: 'personal' });
  if (!workspace) {
    workspace = await Workspace.create({
      name: 'Personal Workspace', type: 'personal', owner: userId,
      members: [{ user: userId, role: 'owner' }],
    });
  } else if (!getMember(workspace, userId)) {
    workspace.members.push({ user: userId, role: 'owner' });
    await workspace.save();
  }

  await Todo.updateMany(
    { owner: userId, isDeleted: false, $or: [{ workspace: null }, { workspace: { $exists: false } }] },
    { $set: { workspace: workspace._id } }
  );
  return workspace;
};

const getWorkspaceAccess = async ({ userId, workspaceId }) => {
  const workspace = workspaceId
    ? await Workspace.findById(workspaceId)
    : await ensurePersonalWorkspace(userId);
  if (!workspace) throw new AppError('Workspace not found.', 404);
  const member = getMember(workspace, userId);
  if (!member) throw new AppError('You are not a member of this workspace.', 403);
  return { workspace, role: member.role };
};

const listWorkspaces = async (userId) => {
  await ensurePersonalWorkspace(userId);
  const workspaces = await Workspace.find({ 'members.user': userId })
    .populate('owner', 'username name avatar.url')
    .sort({ type: 1, createdAt: 1 });
  return workspaces.map((workspace) => ({
    ...workspace.toObject(),
    role: getMember(workspace, userId).role,
    memberCount: workspace.members.length,
  }));
};

const createTeamWorkspace = async (userId, data) => Workspace.create({
  name: data.name, description: data.description || '', type: 'team', owner: userId,
  members: [{ user: userId, role: 'owner' }],
});

const getWorkspaceDetail = async (userId, workspaceId) => {
  const { workspace, role } = await getWorkspaceAccess({ userId, workspaceId });
  await workspace.populate('owner', 'username name avatar.url');
  await workspace.populate('members.user', 'username name avatar.url');
  return { workspace, role };
};

const requireOwner = async (userId, workspaceId) => {
  const access = await getWorkspaceAccess({ userId, workspaceId });
  if (access.role !== 'owner') throw new AppError('Only the workspace owner can manage members.', 403);
  return access.workspace;
};

const inviteMember = async ({ userId, workspaceId, email, role }) => {
  const workspace = await requireOwner(userId, workspaceId);
  if (workspace.type !== 'team') throw new AppError('Members can only be invited to a team workspace.', 400);
  const invitee = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('_id email username');
  if (!invitee) throw new AppError('An active registered user with this email was not found.', 404);
  if (sameId(invitee._id, workspace.owner)) throw new AppError('The workspace owner is already a member.', 400);
  if (getMember(workspace, invitee._id)) throw new AppError('This user is already a workspace member.', 400);
  let invitation = await WorkspaceInvitation.findOne({ workspace: workspace._id, invitee: invitee._id, status: 'pending' });
  if (invitation) {
    invitation.role = role;
    invitation.inviter = userId;
    await invitation.save();
  } else {
    invitation = await WorkspaceInvitation.create({ workspace: workspace._id, inviter: userId, invitee: invitee._id, email: invitee.email, role });
  }
  await invitation.populate('invitee', 'username name email');
  return invitation;
};

const listPendingInvitations = (userId) => WorkspaceInvitation.find({ invitee: userId, status: 'pending' })
  .populate('workspace', 'name type')
  .populate('inviter', 'username name')
  .sort('-createdAt');

const respondToInvitation = async ({ userId, invitationId, accept }) => {
  const invitation = await WorkspaceInvitation.findOne({ _id: invitationId, invitee: userId, status: 'pending' });
  if (!invitation) throw new AppError('Pending invitation not found.', 404);
  if (accept) {
    const workspace = await Workspace.findById(invitation.workspace);
    if (!workspace) throw new AppError('Workspace not found.', 404);
    if (!getMember(workspace, userId)) {
      workspace.members.push({ user: userId, role: invitation.role });
      await workspace.save();
    }
    invitation.status = 'accepted';
  } else {
    invitation.status = 'declined';
  }
  await invitation.save();
  return invitation;
};

const changeMemberRole = async ({ userId, workspaceId, memberId, role }) => {
  const workspace = await requireOwner(userId, workspaceId);
  if (workspace.type !== 'team') throw new AppError('Personal workspace roles cannot be changed.', 400);
  const member = getMember(workspace, memberId);
  if (!member) throw new AppError('Workspace member not found.', 404);
  if (member.role === 'owner') throw new AppError('The owner role cannot be changed.', 400);
  member.role = role;
  await workspace.save();
  return workspace;
};

const removeMember = async ({ userId, workspaceId, memberId }) => {
  const workspace = await requireOwner(userId, workspaceId);
  if (workspace.type !== 'team') throw new AppError('Members cannot be removed from a personal workspace.', 400);
  const member = getMember(workspace, memberId);
  if (!member) throw new AppError('Workspace member not found.', 404);
  if (member.role === 'owner') throw new AppError('The owner cannot be removed.', 400);
  workspace.members = workspace.members.filter((item) => !sameId(item.user, memberId));
  await workspace.save();
};

const assertCanCreateTodo = (role) => {
  if (role === 'viewer') throw new AppError('Viewers can only view workspace todos.', 403);
};

const assertCanManageTodo = ({ role, todoOwnerId, userId }) => {
  if (role === 'owner') return;
  if (role === 'editor' && sameId(todoOwnerId, userId)) return;
  throw new AppError(role === 'viewer' ? 'Viewers can only view workspace todos.' : 'Editors can only manage their own todos.', 403);
};

module.exports = {
  sameId, ensurePersonalWorkspace, getWorkspaceAccess, listWorkspaces, createTeamWorkspace,
  getWorkspaceDetail, inviteMember, listPendingInvitations, respondToInvitation,
  changeMemberRole, removeMember, assertCanCreateTodo, assertCanManageTodo,
};
