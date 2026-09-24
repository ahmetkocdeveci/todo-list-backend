const userService = require('../services/userService');
const { uploadToCloudinary, safeDeleteFromCloudinary } = require('../middlewares/upload');
const AppError = require('../utils/AppError');

const getUserProfile = async (req, res, next) => {
  try { res.json({ success: true, user: await userService.getUserProfile(req.params.username, req.user?._id) }); } catch (error) { next(error); }
};
const getUserTodos = async (req, res, next) => {
  try { const result = await userService.getUserTodos(req.params.username, req.user?._id, req.query.page, req.query.limit); res.json({ success: true, count: result.todos.length, ...result }); } catch (error) { next(error); }
};
const searchUsers = async (req, res, next) => {
  try { const users = await userService.searchUsers(req.user._id, req.query.q); res.json({ success: true, users }); } catch (error) { next(error); }
};
const updateProfile = async (req, res, next) => {
  try { res.json({ success: true, message: 'Profile updated successfully.', user: await userService.updateProfile(req.user._id, req.body) }); } catch (error) { next(error); }
};
const updateAvatar = async (req, res, next) => {
  let uploadedAvatar;
  try {
    if (!req.files?.avatar) throw new AppError('Please upload an image.', 400);
    uploadedAvatar = await uploadToCloudinary(req.files.avatar, 'avatars');
    const { avatar, oldPublicId } = await userService.updateAvatar(req.user._id, uploadedAvatar);
    uploadedAvatar = null;
    if (oldPublicId) await safeDeleteFromCloudinary(oldPublicId);
    res.json({ success: true, message: 'Avatar updated.', avatar });
  } catch (error) {
    if (uploadedAvatar?.publicId) await safeDeleteFromCloudinary(uploadedAvatar.publicId);
    next(error);
  }
};
const getAllUsers = async (req, res, next) => {
  try { const users = await userService.getAllUsers(); res.json({ success: true, count: users.length, users }); } catch (error) { next(error); }
};
module.exports = { getUserProfile, getUserTodos, searchUsers, updateProfile, updateAvatar, getAllUsers };
