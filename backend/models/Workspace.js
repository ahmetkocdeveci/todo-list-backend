const mongoose = require('mongoose');

const workspaceMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], required: true },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 300, default: '' },
  type: { type: String, enum: ['personal', 'team'], required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [workspaceMemberSchema], default: [] },
}, { timestamps: true });

workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ owner: 1, type: 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
