const express = require('express');
const router = express.Router();

const {
  getUserProfile,
  getUserTodos,
  searchUsers,
  updateProfile,
  updateAvatar,
  getAllUsers,
} = require('../controllers/userController');
const { sendContactMail } = require('../controllers/mailController');
const { protect, optionalAuth, restrictTo } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

router.get('/', protect, restrictTo('admin'), getAllUsers);

router.get('/search', protect, searchUsers);

router.post('/contact', validate(schemas.contact), sendContactMail);

router.patch('/profile', protect, validate(schemas.updateProfile), updateProfile);

router.post('/avatar', protect, updateAvatar);

router.get('/:username/todos', optionalAuth, getUserTodos);
router.get('/:username', optionalAuth, getUserProfile);

module.exports = router;
