const mongoose = require('mongoose');

const priorityRanks = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    priorityRank: {
      type: Number,
      default() {
        return priorityRanks[this.priority] || priorityRanks.medium;
      },
      select: false,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
      default: 'general',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Todo must belong to a user'],
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
    },
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permission: {
          type: String,
          enum: ['view', 'edit'],
          default: 'view',
        },
      },
    ],
    tags: [{ type: String, trim: true, maxlength: 30 }],
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

todoSchema.index({ owner: 1, createdAt: -1 });
todoSchema.index({ workspace: 1, createdAt: -1 });
todoSchema.index({ status: 1, priority: 1 });
todoSchema.index({ dueDate: 1 });
todoSchema.index({ title: 'text', description: 'text', tags: 'text' });

todoSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

todoSchema.pre('save', function (next) {
  if (this.isModified('priority')) {
    this.priorityRank = priorityRanks[this.priority] || priorityRanks.medium;
  }

  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = undefined;
    }
  }
  next();
});

todoSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  const directPriority = update.priority;
  const priority = directPriority || update.$set?.priority;
  if (priority) {
    update.$set = {
      ...(update.$set || {}),
      priority,
      priorityRank: priorityRanks[priority] || priorityRanks.medium,
    };
    if (directPriority) delete update.priority;
    this.setUpdate(update);
  }
  next();
});

todoSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

const Todo = mongoose.model('Todo', todoSchema);
module.exports = Todo;
