jest.mock('../../models/Todo', () => ({ findOne: jest.fn() }));
jest.mock('../../models/User', () => ({}));
jest.mock('../../services/workspaceService', () => ({
  sameId: (left, right) => String(left) === String(right), getWorkspaceAccess: jest.fn(),
  assertCanCreateTodo: jest.fn(), assertCanManageTodo: jest.fn(),
}));

const Todo = require('../../models/Todo');
const workspaceService = require('../../services/workspaceService');
const { deleteTodo } = require('../../services/todoService');

describe('todoService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lets an owner role soft-delete another member’s workspace todo', async () => {
    const todo = { owner: 'editor-id', workspace: 'workspace-id', save: jest.fn().mockResolvedValue() };
    Todo.findOne.mockResolvedValue(todo);
    workspaceService.getWorkspaceAccess.mockResolvedValue({ role: 'owner', workspace: { _id: 'workspace-id' } });
    await deleteTodo('owner-id', 'todo-id');
    expect(workspaceService.assertCanManageTodo).toHaveBeenCalledWith({ role: 'owner', todoOwnerId: 'editor-id', userId: 'owner-id' });
    expect(todo.isDeleted).toBe(true); expect(todo.save).toHaveBeenCalled();
  });
});
