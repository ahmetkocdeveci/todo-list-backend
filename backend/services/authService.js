const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ensurePersonalWorkspace } = require('./workspaceService');

const registerUser = async ({ username, email, password, name }) => {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
  if (existingUser) {
    const field = existingUser.email === normalizedEmail ? 'Email' : 'Username';
    throw new AppError(`${field} already exists.`, 400);
  }
  const user = await User.create({ username, email: normalizedEmail, password, name });
  await ensurePersonalWorkspace(user._id);
  return user;
};

const authenticateUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid email or password.', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated. Please contact support.', 401);
  return user;
};

const getCurrentUser = (userId) => User.findById(userId).populate('todoCount');

module.exports = { registerUser, authenticateUser, getCurrentUser };
