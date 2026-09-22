const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Todo = require('../models/Todo');

describe('Todo API', () => {
  let authCookie;
  let testUser;
  let createdTodoId;

  const userData = {
    username: 'todotest_jest',
    email: 'todotest_jest@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    await User.deleteMany({ email: userData.email });
  });

  afterAll(async () => {
    const user = await User.findOne({ email: userData.email });
    if (user) await Todo.deleteMany({ owner: user._id });
    await User.deleteMany({ email: userData.email });
  });

  describe('Setup', () => {
    it('should register and login test user', async () => {
      await request(app).post('/api/auth/register').send(userData);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });

      authCookie = res.headers['set-cookie'];
      testUser = res.body.user;
      expect(authCookie).toBeDefined();
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Cookie', authCookie)
        .send({
          title: 'Test Todo from Jest',
          description: 'This is a test todo',
          priority: 'high',
          category: 'testing',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.todo.title).toBe('Test Todo from Jest');
      expect(res.body.todo.owner.email).toBeUndefined();
      createdTodoId = res.body.todo._id;
    });

    it('should return 400 for missing title', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Cookie', authCookie)
        .send({ description: 'No title todo' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ title: 'Unauthorized Todo' });

      expect(res.statusCode).toBe(401);
    });

    it('should hide private todos and expose only public todos on a profile', async () => {
      await Todo.create({ title: 'Private profile todo', owner: testUser._id, isPublic: false });
      await Todo.create({ title: 'Public profile todo', owner: testUser._id, isPublic: true });

      const res = await request(app).get(`/api/users/${testUser.username}/todos`);

      expect(res.statusCode).toBe(200);
      expect(res.body.todos.some((todo) => todo.title === 'Public profile todo')).toBe(true);
      expect(res.body.todos.some((todo) => todo.title === 'Private profile todo')).toBe(false);
      expect(res.body.todos.find((todo) => todo.title === 'Public profile todo').sharedWith).toBeUndefined();

      const profileRes = await request(app).get(`/api/users/${testUser.username}`);
      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body.user.email).toBeUndefined();
      expect(profileRes.body.user.role).toBeUndefined();
      expect(profileRes.body.user.isActive).toBeUndefined();
      expect(profileRes.body.user.avatar?.publicId).toBeUndefined();
    });
  });

  describe('GET /api/todos', () => {
    it('should return paginated todos for authenticated user', async () => {
      const res = await request(app)
        .get('/api/todos')
        .set('Cookie', authCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.todos)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('totalPages');
    });

    it('should filter todos by status', async () => {
      const res = await request(app)
        .get('/api/todos?status=pending')
        .set('Cookie', authCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.todos.every((t) => t.status === 'pending')).toBe(true);
    });

    it('should filter todos by priority', async () => {
      const res = await request(app)
        .get('/api/todos?priority=high')
        .set('Cookie', authCookie);

      expect(res.statusCode).toBe(200);
      res.body.todos.forEach((t) => expect(t.priority).toBe('high'));
    });

    it('should sort priorities in business order', async () => {
      const res = await request(app)
        .get('/api/todos?sort=-priority&limit=50')
        .set('Cookie', authCookie);

      const rank = { low: 1, medium: 2, high: 3, urgent: 4 };
      const priorities = res.body.todos.map((todo) => rank[todo.priority]);

      expect(res.statusCode).toBe(200);
      expect(priorities.every((value, index) => index === 0 || priorities[index - 1] >= value)).toBe(true);
    });

    it('should not let query filters override the authenticated owner', async () => {
      const otherUser = await User.create({
        username: 'other_todo_owner',
        email: 'other_todo_owner@example.com',
        password: 'password123',
      });

      try {
        await Todo.create({ title: 'Private todo owned by someone else', owner: otherUser._id });

        const res = await request(app)
          .get(`/api/todos?owner=${otherUser._id}&isDeleted=true`)
          .set('Cookie', authCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.todos.some((todo) => todo.title === 'Private todo owned by someone else')).toBe(false);
        expect(res.body.todos.every((todo) => todo.owner._id === testUser._id)).toBe(true);
      } finally {
        await Todo.deleteMany({ owner: otherUser._id });
        await User.deleteOne({ _id: otherUser._id });
      }
    });
  });

  describe('GET /api/todos/stats', () => {
    it('should calculate owner-wide status and overdue totals', async () => {
      const statsUser = await User.create({
        username: 'stats_todo_owner',
        email: 'stats_todo_owner@example.com',
        password: 'password123',
      });

      try {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ email: statsUser.email, password: 'password123' });
        const statsCookie = loginRes.headers['set-cookie'];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await Todo.create([
          { title: 'Pending overdue', owner: statsUser._id, status: 'pending', dueDate: yesterday },
          { title: 'Pending future', owner: statsUser._id, status: 'pending', dueDate: tomorrow },
          { title: 'In progress overdue', owner: statsUser._id, status: 'in-progress', dueDate: yesterday },
          { title: 'Completed past due', owner: statsUser._id, status: 'completed', dueDate: yesterday },
          { title: 'Deleted pending', owner: statsUser._id, status: 'pending', isDeleted: true },
        ]);

        const res = await request(app)
          .get('/api/todos/stats')
          .set('Cookie', statsCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
          success: true,
          stats: {
            total: 4,
            pending: 2,
            inProgress: 1,
            completed: 1,
            overdue: 2,
          },
        });
      } finally {
        await Todo.deleteMany({ owner: statsUser._id });
        await User.deleteOne({ _id: statsUser._id });
      }
    });

    it('should return zero totals when the owner has no todos', async () => {
      const emptyUser = await User.create({
        username: 'empty_stats_owner',
        email: 'empty_stats_owner@example.com',
        password: 'password123',
      });

      try {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ email: emptyUser.email, password: 'password123' });

        const res = await request(app)
          .get('/api/todos/stats')
          .set('Cookie', loginRes.headers['set-cookie']);

        expect(res.statusCode).toBe(200);
        expect(res.body.stats).toEqual({
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          overdue: 0,
        });
      } finally {
        await User.deleteOne({ _id: emptyUser._id });
      }
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should return a public todo to an anonymous visitor', async () => {
      const publicTodo = await Todo.create({
        title: 'Anonymous public detail',
        owner: testUser._id,
        isPublic: true,
      });

      const res = await request(app).get(`/api/todos/${publicTodo._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.todo._id).toBe(publicTodo._id.toString());
      expect(res.body.todo.sharedWith).toEqual([]);
      expect(res.body.todo.owner.email).toBeUndefined();
    });

    it('should deny an anonymous visitor access to a private todo', async () => {
      const privateTodo = await Todo.create({
        title: 'Anonymous private detail',
        owner: testUser._id,
        isPublic: false,
      });

      const res = await request(app).get(`/api/todos/${privateTodo._id}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return a single todo', async () => {
      const res = await request(app)
        .get(`/api/todos/${createdTodoId}`)
        .set('Cookie', authCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.todo._id).toBe(createdTodoId);
    });

    it('should return 404 for non-existent todo', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/todos/${fakeId}`)
        .set('Cookie', authCookie);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('should update todo status to completed', async () => {
      const res = await request(app)
        .patch(`/api/todos/${createdTodoId}`)
        .set('Cookie', authCookie)
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(200);
      expect(res.body.todo.status).toBe('completed');
      expect(res.body.todo.completedAt).toBeDefined();
    });

    it('should update todo title', async () => {
      const res = await request(app)
        .patch(`/api/todos/${createdTodoId}`)
        .set('Cookie', authCookie)
        .send({ title: 'Updated Title' });

      expect(res.statusCode).toBe(200);
      expect(res.body.todo.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should soft-delete the todo', async () => {
      const res = await request(app)
        .delete(`/api/todos/${createdTodoId}`)
        .set('Cookie', authCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for deleted todo', async () => {
      const res = await request(app)
        .get(`/api/todos/${createdTodoId}`)
        .set('Cookie', authCookie);

      expect(res.statusCode).toBe(404);
    });
  });
});
