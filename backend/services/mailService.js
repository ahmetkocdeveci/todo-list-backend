const sendMail = require('../utils/sendMail');
const Todo = require('../models/Todo');

const escapeHtml = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const layout = (title, content) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#4f46e5">${title}</h2>${content}</div>`;

const sendContactMail = async ({ name, email, subject, message }) => {
  const safeName = escapeHtml(name); const safeEmail = escapeHtml(email); const safeSubject = escapeHtml(subject); const safeMessage = escapeHtml(message);
  await sendMail({ to: process.env.MAIL_USER, subject: `[Contact Form] ${subject}`, html: layout('New contact form submission', `<p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p><p><strong>Subject:</strong> ${safeSubject}</p><p style="white-space:pre-line">${safeMessage}</p>`) });
  await sendMail({ to: email, subject: 'We received your message — Todo List App', html: layout(`Hello, ${safeName}!`, `<p>Thank you for reaching out. We've received your message and will get back to you as soon as possible.</p><p style="white-space:pre-line"><strong>Your message:</strong><br>${safeMessage}</p>`) });
};

const sendDueDateReminders = async () => {
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const todos = await Todo.find({ dueDate: { $lte: cutoff }, status: { $ne: 'completed' }, isDeleted: false }).populate({ path: 'owner', select: 'email name username', match: { isActive: true } });
  const grouped = new Map();
  for (const todo of todos) {
    if (!todo.owner) continue;
    const key = String(todo.owner._id); const entry = grouped.get(key) || { owner: todo.owner, todos: [] };
    entry.todos.push(todo); grouped.set(key, entry);
  }
  for (const { owner, todos: ownerTodos } of grouped.values()) {
    const items = ownerTodos.map((todo) => `<li><strong>${escapeHtml(todo.title)}</strong> [${todo.priority.toUpperCase()}] — due ${new Date(todo.dueDate).toLocaleDateString('tr-TR')}</li>`).join('');
    await sendMail({ to: owner.email, subject: `⏰ Reminder: You have ${ownerTodos.length} upcoming todo(s)!`, html: layout(`Hello, ${escapeHtml(owner.name || owner.username)}!`, `<p>You have <strong>${ownerTodos.length}</strong> overdue or upcoming todo(s):</p><ul>${items}</ul><p><a href="${process.env.FRONTEND_URL}/todos">View my todos</a></p>`) });
  }
  return grouped.size;
};

module.exports = { sendContactMail, sendDueDateReminders };
