const todoService = require('../services/todoService');
const { uploadToCloudinary, safeDeleteFromCloudinary } = require('../middlewares/upload');

const getTodos = async (req, res, next) => {
  try {
    const result = await todoService.listTodos(req.user._id, req.query);
    res.json({ success: true, count: result.todos.length, total: result.total, totalPages: result.totalPages, currentPage: result.currentPage, todos: result.todos, workspaceId: result.workspaceId });
  } catch (error) { next(error); }
};

const getTodoStats = async (req, res, next) => {
  try { res.json({ success: true, stats: await todoService.getTodoStats(req.user._id, req.query.workspace) }); } catch (error) { next(error); }
};

const getTodo = async (req, res, next) => {
  try { res.json({ success: true, todo: await todoService.getTodoForViewer(req.params.id, req.user?._id) }); } catch (error) { next(error); }
};

const createTodo = async (req, res, next) => {
  let uploadedImage;
  try {
    const todoData = { ...req.body };
    if (req.files?.image) {
      uploadedImage = await uploadToCloudinary(req.files.image, 'todo-images');
      todoData.image = uploadedImage;
    }
    const todo = await todoService.createTodo(req.user._id, todoData);
    uploadedImage = null;
    res.status(201).json({ success: true, message: 'Todo created successfully.', todo });
  } catch (error) {
    if (uploadedImage?.publicId) await safeDeleteFromCloudinary(uploadedImage.publicId);
    next(error);
  }
};

const updateTodo = async (req, res, next) => {
  let uploadedImage;
  try {
    const changes = { ...req.body };
    if (req.files?.image) {
      uploadedImage = await uploadToCloudinary(req.files.image, 'todo-images');
      changes.image = uploadedImage;
    }
    const { todo, oldImagePublicId } = await todoService.updateTodo(req.user._id, req.params.id, changes);
    const newImagePublicId = uploadedImage?.publicId;
    uploadedImage = null;
    if (oldImagePublicId && newImagePublicId && oldImagePublicId !== newImagePublicId) await safeDeleteFromCloudinary(oldImagePublicId);
    res.json({ success: true, message: 'Todo updated successfully.', todo });
  } catch (error) {
    if (uploadedImage?.publicId) await safeDeleteFromCloudinary(uploadedImage.publicId);
    next(error);
  }
};

const deleteTodo = async (req, res, next) => {
  try { await todoService.deleteTodo(req.user._id, req.params.id); res.json({ success: true, message: 'Todo deleted successfully.' }); } catch (error) { next(error); }
};
const shareTodo = async (req, res, next) => {
  try { const todo = await todoService.shareTodo(req.user._id, req.params.id, req.body.userId, req.body.permission); res.json({ success: true, message: 'Todo shared successfully.', todo }); } catch (error) { next(error); }
};
const unshareTodo = async (req, res, next) => {
  try { const todo = await todoService.unshareTodo(req.user._id, req.params.id, req.params.userId); res.json({ success: true, message: 'Share removed.', todo }); } catch (error) { next(error); }
};
const getSharedWithMe = async (req, res, next) => {
  try { const todos = await todoService.getSharedWithMe(req.user._id); res.json({ success: true, count: todos.length, todos }); } catch (error) { next(error); }
};

module.exports = { getTodos, getTodoStats, getTodo, createTodo, updateTodo, deleteTodo, shareTodo, unshareTodo, getSharedWithMe };
