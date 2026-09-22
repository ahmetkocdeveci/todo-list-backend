const express = require('express');
const router = express.Router();

const {
  getTodos,
  getTodoStats,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  shareTodo,
  unshareTodo,
  getSharedWithMe,
} = require('../controllers/todoController');
const { protect, optionalAuth } = require('../middlewares/auth');
const { validate, normalizeTags, schemas } = require('../middlewares/validate');

router.get('/shared', protect, getSharedWithMe);
router.get('/stats', protect, getTodoStats);
router.get('/:id', optionalAuth, getTodo);

router.use(protect);

router.route('/')
  .get(getTodos)
  .post(normalizeTags, validate(schemas.createTodo), createTodo);

router.route('/:id')
  .patch(normalizeTags, validate(schemas.updateTodo), updateTodo)
  .delete(deleteTodo);

router.post('/:id/share', validate(schemas.shareTodo), shareTodo);
router.delete('/:id/share/:userId', unshareTodo);

module.exports = router;
