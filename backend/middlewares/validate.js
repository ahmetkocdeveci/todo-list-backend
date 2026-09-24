const Joi = require('joi');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    req[source] = value;
    next();
  };
};

const normalizeTags = (req, res, next) => {
  if (typeof req.body?.tagsJson === 'string') {
    try {
      const tags = JSON.parse(req.body.tagsJson);
      if (!Array.isArray(tags)) throw new Error('Tags must be an array.');
      req.body.tags = tags;
      delete req.body.tagsJson;
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: [{ field: 'tags', message: 'Tags must be a valid array.' }],
      });
    }
  } else if (req.body?.tags && !Array.isArray(req.body.tags)) {
    req.body.tags = [req.body.tags];
  }

  if (req.body?.dueDate === '') req.body.dueDate = null;
  next();
};

const registerSchema = Joi.object({
  username: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(30).required().messages({
    'string.pattern.base': 'Username can only contain letters, numbers and underscores',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  name: Joi.string().max(50).optional().allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createTodoSchema = Joi.object({
  title: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Title must be at least 2 characters',
    'string.max': 'Title cannot exceed 100 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().max(1000).optional().allow(''),
  status: Joi.string().valid('pending', 'in-progress', 'completed').default('pending'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  category: Joi.string().max(50).default('general'),
  isPublic: Joi.boolean().default(false),
  dueDate: Joi.date().min('now').optional().messages({
    'date.min': 'Due date cannot be in the past',
  }),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
  workspace: Joi.string().hex().length(24).optional(),
});

const updateTodoSchema = Joi.object({
  title: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  category: Joi.string().max(50).optional(),
  isPublic: Joi.boolean().optional(),
  dueDate: Joi.date().optional().allow(null),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().max(50).optional().allow(''),
  bio: Joi.string().max(200).optional().allow(''),
  username: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(30).optional(),
});

const contactSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().min(3).max(100).required(),
  message: Joi.string().min(10).max(2000).required(),
});

const shareTodoSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  permission: Joi.string().valid('view', 'edit').default('view'),
});

const createWorkspaceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  description: Joi.string().trim().max(300).optional().allow(''),
});

const inviteWorkspaceMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('editor', 'viewer').required(),
});

const updateWorkspaceMemberRoleSchema = Joi.object({
  role: Joi.string().valid('editor', 'viewer').required(),
});

module.exports = {
  validate,
  normalizeTags,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    createTodo: createTodoSchema,
    updateTodo: updateTodoSchema,
    updateProfile: updateProfileSchema,
    contact: contactSchema,
    shareTodo: shareTodoSchema,
    createWorkspace: createWorkspaceSchema,
    inviteWorkspaceMember: inviteWorkspaceMemberSchema,
    updateWorkspaceMemberRole: updateWorkspaceMemberRoleSchema,
  },
};
