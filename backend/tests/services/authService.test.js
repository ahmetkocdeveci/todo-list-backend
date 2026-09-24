jest.mock('../../models/User', () => ({ findOne: jest.fn(), create: jest.fn() }));
jest.mock('../../services/workspaceService', () => ({ ensurePersonalWorkspace: jest.fn() }));

const User = require('../../models/User');
const { ensurePersonalWorkspace } = require('../../services/workspaceService');
const { registerUser, authenticateUser } = require('../../services/authService');

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates the user and its personal workspace', async () => {
    const user = { _id: 'user-id', email: 'ada@example.com' };
    User.findOne.mockResolvedValue(null); User.create.mockResolvedValue(user);
    await expect(registerUser({ username: 'ada', email: 'Ada@Example.com', password: 'secret', name: 'Ada' })).resolves.toBe(user);
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com' }));
    expect(ensurePersonalWorkspace).toHaveBeenCalledWith('user-id');
  });

  it('rejects an invalid login without exposing which credential failed', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await expect(authenticateUser({ email: 'missing@example.com', password: 'secret' })).rejects.toMatchObject({ statusCode: 401, message: 'Invalid email or password.' });
  });
});
