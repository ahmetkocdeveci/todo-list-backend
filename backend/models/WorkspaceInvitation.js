const mongoose = require('mongoose');

const workspaceInvitationSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['editor', 'viewer'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending' },
}, { timestamps: true });

workspaceInvitationSchema.index({ workspace: 1, invitee: 1, status: 1 });

module.exports = mongoose.model('WorkspaceInvitation', workspaceInvitationSchema);
