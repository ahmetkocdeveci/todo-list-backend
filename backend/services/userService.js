const User = require('../models/User');
const Todo = require('../models/Todo');
const AppError = require('../utils/AppError');

const getUserProfile = async (username, viewerId) => {
  const user = await User.findOne({ username }).select('username name bio avatar.url createdAt isActive');
  if (!user || !user.isActive) throw new AppError('User not found.', 404);
  const isOwner = viewerId && String(viewerId) === String(user._id);
  const todoCount = await Todo.countDocuments({ owner: user._id, isDeleted: false, ...(isOwner ? {} : { isPublic: true }) });
  const data = user.toJSON(); delete data.isActive; data.todoCount = todoCount;
  return data;
};

const getUserTodos = async (username, viewerId, pageValue, limitValue) => {
  const user = await User.findOne({ username }).select('username isActive');
  if (!user || !user.isActive) throw new AppError('User not found.', 404);
  const page = Math.max(1, parseInt(pageValue, 10) || 1); const limit = Math.min(20, Math.max(1, parseInt(limitValue, 10) || 10));
  const isOwner = viewerId && String(viewerId) === String(user._id);
  const filter = { owner: user._id, isDeleted: false, ...(isOwner ? {} : { isPublic: true }) };
  let query = Todo.find(filter).populate('owner', 'username name avatar.url').sort('-createdAt').skip((page - 1) * limit).limit(limit);
  if (!isOwner) query = query.select('-sharedWith');
  const [todos, total] = await Promise.all([query, Todo.countDocuments(filter)]);
  return { todos, total, totalPages: Math.ceil(total / limit), currentPage: page };
};

const searchUsers = async (userId, term) => {
  const query = (term || '').trim();
  if (query.length < 2) throw new AppError('Search query must have at least 2 characters.', 400);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return User.find({ _id: { $ne: userId }, isActive: true, $or: [{ username: { $regex: escaped, $options: 'i' } }, { name: { $regex: escaped, $options: 'i' } }] })
    .select('username name avatar.url').sort('username').limit(8);
};

const updateProfile = async (userId, updates) => {
  if (updates.username) {
    const existing = await User.findOne({ username: updates.username, _id: { $ne: userId } });
    if (existing) throw new AppError('Username already taken.', 400);
  }
  return User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
};

const updateAvatar = async (userId, avatar) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  const oldPublicId = user.avatar?.publicId; user.avatar = avatar; await user.save();
  return { avatar: user.avatar, oldPublicId };
};

const getAllUsers = () => User.find({ isActive: true }).sort('-createdAt');
module.exports = { getUserProfile, getUserTodos, searchUsers, updateProfile, updateAvatar, getAllUsers };
