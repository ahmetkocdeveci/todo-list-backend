const Todo = require('../models/Todo');
const User = require('../models/User');
const ApiFeatures = require('../utils/apiFeatures');
const { uploadToCloudinary, safeDeleteFromCloudinary } = require('../middlewares/upload');

const getTodos = async (req, res, next) => {
  try {
    const baseFilter = { owner: req.user._id, isDeleted: false };

    const totalQuery = new ApiFeatures(
      Todo.find(baseFilter),
      req.query
    ).filter().search();
    const total = await totalQuery.query.countDocuments();

    const features = new ApiFeatures(Todo.find(baseFilter), req.query)
      .filter()
      .search()
      .sort()
      .paginate();

    const todos = await features.query.populate('owner', 'username name avatar');

    const page = features.page || 1;
    const limit = features.limit || 10;

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

const getTodoStats = async (req, res, next) => {
  try {
    const [result] = await Todo.aggregate([
      {
        $match: {
          owner: req.user._id,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $eq: [{ $type: '$dueDate' }, 'date'] },
                    { $lt: ['$dueDate', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);

    res.json({
      success: true,
      stats: result || {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('owner', 'username name avatar.url')
      .populate('sharedWith.user', 'username name avatar.url');

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    }

    const currentUserId = req.user?._id?.toString();
    const isOwner = Boolean(currentUserId && todo.owner._id.toString() === currentUserId);
    const isShared = Boolean(currentUserId && todo.sharedWith.some(
      (share) => share.user?._id?.toString() === currentUserId
    ));

    if (!isOwner && !isShared && !todo.isPublic) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const todoData = todo.toObject({ virtuals: true });
    if (!isOwner) {
      todoData.sharedWith = isShared
        ? todoData.sharedWith.filter((share) => share.user?._id?.toString() === currentUserId)
        : [];
    }

    res.json({ success: true, todo: todoData });
  } catch (error) {
    next(error);
  }
};

const createTodo = async (req, res, next) => {
  let uploadedImage;

  try {
    const todoData = { ...req.body, owner: req.user._id };

    if (req.files && req.files.image) {
      uploadedImage = await uploadToCloudinary(req.files.image, 'todo-images');
      todoData.image = uploadedImage;
    }

    const todo = await Todo.create(todoData);
    uploadedImage = null;
    await todo.populate('owner', 'username name avatar');

    res.status(201).json({ success: true, message: 'Todo created successfully.', todo });
  } catch (error) {
    if (uploadedImage?.publicId) {
      await safeDeleteFromCloudinary(uploadedImage.publicId);
    }
    next(error);
  }
};

const updateTodo = async (req, res, next) => {
  let uploadedImage;

  try {
    const todo = await Todo.findOne({ _id: req.params.id, isDeleted: false });

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    }

    const isOwner = todo.owner.toString() === req.user._id.toString();
    const hasEditPermission = todo.sharedWith.some(
      (s) => s.user.toString() === req.user._id.toString() && s.permission === 'edit'
    );

    if (!isOwner && !hasEditPermission) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const oldPublicId = todo.image?.publicId;
    if (req.files && req.files.image) {
      uploadedImage = await uploadToCloudinary(req.files.image, 'todo-images');
      req.body.image = uploadedImage;
    }

    const updates = { ...req.body };
    if (updates.status === 'completed' && todo.status !== 'completed') {
      updates.completedAt = new Date();
    } else if (updates.status && updates.status !== 'completed') {
      updates.completedAt = null;
    }

    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedTodo) {
      const error = new Error('Todo not found.');
      error.statusCode = 404;
      throw error;
    }

    const newPublicId = uploadedImage?.publicId;
    uploadedImage = null;
    if (oldPublicId && newPublicId && oldPublicId !== newPublicId) {
      await safeDeleteFromCloudinary(oldPublicId);
    }

    await updatedTodo.populate('owner', 'username name avatar');

    res.json({ success: true, message: 'Todo updated successfully.', todo: updatedTodo });
  } catch (error) {
    if (uploadedImage?.publicId) {
      await safeDeleteFromCloudinary(uploadedImage.publicId);
    }
    next(error);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, isDeleted: false });

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    }

    if (todo.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can delete this todo.',
      });
    }

    todo.isDeleted = true;
    await todo.save();

    res.json({ success: true, message: 'Todo deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const shareTodo = async (req, res, next) => {
  try {
    const { userId, permission = 'view' } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required.' });
    }

    const todo = await Todo.findOne({ _id: req.params.id, isDeleted: false });

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    }

    if (todo.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can share this todo.' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot share with yourself.' });
    }

    const targetUser = await User.findById(userId).select('_id isActive');
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({ success: false, message: 'User to share with was not found.' });
    }

    const existing = todo.sharedWith.find((s) => s.user.toString() === userId);
    if (existing) {
      existing.permission = permission;
    } else {
      todo.sharedWith.push({ user: userId, permission });
    }

    await todo.save();
    await todo.populate('sharedWith.user', 'username name avatar');

    res.json({ success: true, message: 'Todo shared successfully.', todo });
  } catch (error) {
    next(error);
  }
};

const unshareTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, isDeleted: false });

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    }

    if (todo.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    todo.sharedWith = todo.sharedWith.filter(
      (s) => s.user.toString() !== req.params.userId
    );

    await todo.save();
    res.json({ success: true, message: 'Share removed.', todo });
  } catch (error) {
    next(error);
  }
};

const getSharedWithMe = async (req, res, next) => {
  try {
    const todos = await Todo.find({
      'sharedWith.user': req.user._id,
      isDeleted: false,
    })
      .populate('owner', 'username name avatar')
      .sort('-createdAt');

    res.json({ success: true, count: todos.length, todos });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodos,
  getTodoStats,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  shareTodo,
  unshareTodo,
  getSharedWithMe,
};
