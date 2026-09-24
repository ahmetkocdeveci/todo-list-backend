const request = require('supertest');
const { app } = require('../server');

const createUser = async (suffix) => {
  const data = { username: `workspace_${suffix}`, email: `workspace_${suffix}@example.com`, password: 'password123' };
  const response = await request(app).post('/api/auth/register').send(data);
  return { user: response.body.user, cookie: response.headers['set-cookie'] };
};

describe('Workspace API', () => {
  it('enforces owner, editor and viewer todo permissions', async () => {
    const owner = await createUser('owner');
    const editor = await createUser('editor');
    const viewer = await createUser('viewer');

    const createWorkspace = await request(app).post('/api/workspaces').set('Cookie', owner.cookie)
      .send({ name: 'Product Team', description: 'Workspace permission test' });
    expect(createWorkspace.statusCode).toBe(201);
    const workspaceId = createWorkspace.body.workspace._id;

    const inviteEditor = await request(app).post(`/api/workspaces/${workspaceId}/invitations`).set('Cookie', owner.cookie)
      .send({ email: editor.user.email, role: 'editor' });
    expect(inviteEditor.statusCode).toBe(201);
    await request(app).post(`/api/workspaces/invitations/${inviteEditor.body.invitation._id}/accept`).set('Cookie', editor.cookie);

    const ownerTodo = await request(app).post('/api/todos').set('Cookie', owner.cookie)
      .send({ title: 'Owner todo', workspace: workspaceId, isPublic: true });
    expect(ownerTodo.statusCode).toBe(201);
    expect(ownerTodo.body.todo.isPublic).toBe(false);

    const editorTodo = await request(app).post('/api/todos').set('Cookie', editor.cookie)
      .send({ title: 'Editor todo', workspace: workspaceId });
    expect(editorTodo.statusCode).toBe(201);

    const editorCannotUpdateOwner = await request(app).patch(`/api/todos/${ownerTodo.body.todo._id}`).set('Cookie', editor.cookie)
      .send({ title: 'Should fail' });
    expect(editorCannotUpdateOwner.statusCode).toBe(403);

    const ownerCanUpdateEditor = await request(app).patch(`/api/todos/${editorTodo.body.todo._id}`).set('Cookie', owner.cookie)
      .send({ status: 'completed' });
    expect(ownerCanUpdateEditor.statusCode).toBe(200);

    const inviteViewer = await request(app).post(`/api/workspaces/${workspaceId}/invitations`).set('Cookie', owner.cookie)
      .send({ email: viewer.user.email, role: 'viewer' });
    await request(app).post(`/api/workspaces/invitations/${inviteViewer.body.invitation._id}/accept`).set('Cookie', viewer.cookie);

    const visibleTodos = await request(app).get(`/api/todos?workspace=${workspaceId}`).set('Cookie', viewer.cookie);
    expect(visibleTodos.statusCode).toBe(200);
    expect(visibleTodos.body.total).toBe(2);

    const viewerCannotCreate = await request(app).post('/api/todos').set('Cookie', viewer.cookie)
      .send({ title: 'Viewer todo', workspace: workspaceId });
    expect(viewerCannotCreate.statusCode).toBe(403);

    const roleChange = await request(app).patch(`/api/workspaces/${workspaceId}/members/${viewer.user._id}`).set('Cookie', owner.cookie)
      .send({ role: 'editor' });
    expect(roleChange.statusCode).toBe(200);
    const promotedCreate = await request(app).post('/api/todos').set('Cookie', viewer.cookie)
      .send({ title: 'Promoted editor todo', workspace: workspaceId });
    expect(promotedCreate.statusCode).toBe(201);
  });
});
