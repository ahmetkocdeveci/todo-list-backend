const Todo = require('../models/Todo');
const User = require('../models/User');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/AppError');
const {
  sameId, getWorkspaceAccess, assertCanCreateTodo, assertCanManageTodo,
} = require('./workspaceService');

const getTodoOrFail = async (id) => {
  const todo = await Todo.findOne({ _id: id, isDeleted: false });
  if (!todo) throw new AppError('Todo not found.', 404);
  return todo;
};

const getWorkspaceForQuery = async (userId, workspaceId) => getWorkspaceAccess({ userId, workspaceId });

const listTodos = async (userId, query) => {
  const { workspace } = await getWorkspaceForQuery(userId, query.workspace);
  const featureQuery = { ...query };
  delete featureQuery.workspace;
  const baseFilter = { workspace: workspace._id, isDeleted: false };
  const totalQuery = new ApiFeatures(Todo.find(baseFilter), featureQuery).filter().search();
  const total = await totalQuery.query.countDocuments();
  const features = new ApiFeatures(Todo.find(baseFilter), featureQuery).filter().search().sort().paginate();
  const todos = await features.query.populate('owner', 'username name avatar');
  return {
    todos, total, totalPages: Math.ceil(total / (features.limit || 10)),
    currentPage: features.page || 1, workspaceId: workspace._id,
  };
};

const getTodoStats = async (userId, workspaceId) => {
  const { workspace } = await getWorkspaceForQuery(userId, workspaceId);
  const [result] = await Todo.aggregate([
    { $match: { workspace: workspace._id, isDeleted: false } },
    { $group: {
      _id: null, total: { $sum: 1 },
      pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
      completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'completed'] }, { $eq: [{ $type: '$dueDate' }, 'date'] }, { $lt: ['$dueDate', new Date()] }] }, 1, 0] } },
    } },
    { $project: { _id: 0 } },
  ]);
  return result || { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
};

const getTodoForViewer = async (todoId, viewerId) => {
  const todo = await Todo.findOne({ _id: todoId, isDeleted: false })
    .populate('owner', 'username name avatar.url')
    .populate('sharedWith.user', 'username name avatar.url');
  if (!todo) throw new AppError('Todo not found.', 404);

  if (todo.workspace) {
    if (!viewerId) throw new AppError('Access denied.', 403);
    const { role } = await getWorkspaceAccess({ userId: viewerId, workspaceId: todo.workspace });
    const result = todo.toObject({ virtuals: true });
    result.sharedWith = [];
    result.workspaceRole = role;
    return result;
  }
  const isOwner = viewerId && sameId(todo.owner._id, viewerId);
  const isShared = viewerId && todo.sharedWith.some((share) => sameId(share.user?._id, viewerId));
  if (!isOwner && !isShared && !todo.isPublic) throw new AppError('Access denied.', 403);
  const result = todo.toObject({ virtuals: true });
  if (!isOwner) result.sharedWith = isShared
    ? result.sharedWith.filter((share) => sameId(share.user?._id, viewerId)) : [];
  return result;
};

const createTodo = async (userId, data) => {
  const { workspace } = await getWorkspaceForQuery(userId, data.workspace);
  const { role } = await getWorkspaceAccess({ userId, workspaceId: workspace._id });
  assertCanCreateTodo(role);
  const todoData = { ...data, owner: userId, workspace: workspace._id };
  if (workspace.type === 'team') todoData.isPublic = false;
  const todo = await Todo.create(todoData);
  await todo.populate('owner', 'username name avatar');
  return todo;
};

const updateTodo = async (userId, todoId, data) => {
  const todo = await getTodoOrFail(todoId);
  let forcePrivate = false;
  if (todo.workspace) {
    const { workspace, role } = await getWorkspaceAccess({ userId, workspaceId: todo.workspace });
    assertCanManageTodo({ role, todoOwnerId: todo.owner, userId });
    forcePrivate = workspace.type === 'team';
  } else {
    const canEdit = sameId(todo.owner, userId) || todo.sharedWith.some((share) => sameId(share.user, userId) && share.permission === 'edit');
    if (!canEdit) throw new AppError('Access denied.', 403);
  }
  const updates = { ...data };
  delete updates.workspace;
  if (forcePrivate) updates.isPublic = false;
  if (updates.status === 'completed' && todo.status !== 'completed') updates.completedAt = new Date();
  if (updates.status && updates.status !== 'completed') updates.completedAt = null;
  const updatedTodo = await Todo.findByIdAndUpdate(todoId, updates, { new: true, runValidators: true });
  await updatedTodo.populate('owner', 'username name avatar');
  return { todo: updatedTodo, oldImagePublicId: todo.image?.publicId };
};

const deleteTodo = async (userId, todoId) => {
  const todo = await getTodoOrFail(todoId);
  if (todo.workspace) {
    const { role } = await getWorkspaceAccess({ userId, workspaceId: todo.workspace });
    assertCanManageTodo({ role, todoOwnerId: todo.owner, userId });
  } else if (!sameId(todo.owner, userId)) {
    throw new AppError('Only the owner can delete this todo.', 403);
  }
  todo.isDeleted = true;
  await todo.save();
};

const shareTodo = async (userId, todoId, targetUserId, permission) => {
  const todo = await getTodoOrFail(todoId);
  if (todo.workspace) throw new AppError('Manage team access through workspace members.', 400);
  if (!sameId(todo.owner, userId)) throw new AppError('Only the owner can share this todo.', 403);
  if (sameId(targetUserId, userId)) throw new AppError('Cannot share with yourself.', 400);
  const targetUser = await User.findById(targetUserId).select('_id isActive');
  if (!targetUser || !targetUser.isActive) throw new AppError('User to share with was not found.', 404);
  const existing = todo.sharedWith.find((share) => sameId(share.user, targetUserId));
  if (existing) existing.permission = permission;
  else todo.sharedWith.push({ user: targetUserId, permission });
  await todo.save();
  await todo.populate('sharedWith.user', 'username name avatar');
  return todo;
};

const unshareTodo = async (userId, todoId, targetUserId) => {
  const todo = await getTodoOrFail(todoId);
  if (todo.workspace) throw new AppError('Manage team access through workspace members.', 400);
  if (!sameId(todo.owner, userId)) throw new AppError('Access denied.', 403);
  todo.sharedWith = todo.sharedWith.filter((share) => !sameId(share.user, targetUserId));
  await todo.save();
  return todo;
};

const getSharedWithMe = (userId) => Todo.find({ 'sharedWith.user': userId, workspace: null, isDeleted: false })
  .populate('owner', 'username name avatar').sort('-createdAt');

module.exports = { listTodos, getTodoStats, getTodoForViewer, createTodo, updateTodo, deleteTodo, shareTodo, unshareTodo, getSharedWithMe };
