const User = require('../models/User');
const Todo = require('../models/Todo');
const { uploadToCloudinary, safeDeleteFromCloudinary } = require('../middlewares/upload');

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username name bio avatar.url createdAt isActive');

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isOwner = req.user?._id?.toString() === user._id.toString();
    const todoCount = await Todo.countDocuments({
      owner: user._id,
      isDeleted: false,
      ...(isOwner ? {} : { isPublic: true }),
    });

    const userData = user.toJSON();
    delete userData.isActive;
    userData.todoCount = todoCount;
    res.json({ success: true, user: userData });
  } catch (error) {
    next(error);
  }
};

const getUserTodos = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username isActive');
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const isOwner = req.user?._id?.toString() === user._id.toString();
    const filter = {
      owner: user._id,
      isDeleted: false,
      ...(isOwner ? {} : { isPublic: true }),
    };

    let todosQuery = Todo.find(filter)
      .populate('owner', 'username name avatar.url')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    if (!isOwner) todosQuery = todosQuery.select('-sharedWith');

    const [todos, total] = await Promise.all([
      todosQuery,
      Todo.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: todos.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      todos,
    });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const query = (req.query.q || '').trim();
    if (query.length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must have at least 2 characters.' });
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      _id: { $ne: req.user._id },
      isActive: true,
      $or: [
        { username: { $regex: escaped, $options: 'i' } },
        { name: { $regex: escaped, $options: 'i' } },
      ],
    })
      .select('username name avatar.url')
      .sort('username')
      .limit(8);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;

    if (updates.username) {
      const existing = await User.findOne({
        username: updates.username,
        _id: { $ne: req.user._id },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username already taken.' });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Profile updated successfully.', user });
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  let uploadedAvatar;

  try {
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ success: false, message: 'Please upload an image.' });
    }

    const user = await User.findById(req.user._id);
    const oldPublicId = user.avatar?.publicId;

    uploadedAvatar = await uploadToCloudinary(req.files.avatar, 'avatars');
    user.avatar = uploadedAvatar;
    await user.save();

    const newPublicId = uploadedAvatar.publicId;
    uploadedAvatar = null;
    if (oldPublicId && oldPublicId !== newPublicId) {
      await safeDeleteFromCloudinary(oldPublicId);
    }

    res.json({ success: true, message: 'Avatar updated.', avatar: user.avatar });
  } catch (error) {
    if (uploadedAvatar?.publicId) {
      await safeDeleteFromCloudinary(uploadedAvatar.publicId);
    }
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, getUserTodos, searchUsers, updateProfile, updateAvatar, getAllUsers };
