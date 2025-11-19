import { login, register } from '../api/auth';
import apiClient from '../api/client';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const mockClient = apiClient as unknown as {
  post: jest.Mock;
};

describe('api/auth', () => {
  beforeEach(() => {
    mockClient.post.mockReset();
  });

  it('login posts to /api/auth/login and returns data', async () => {
    const response = {
      user: { id: '1', name: 'Ayham', email: 'a@test.com', role: 'user' as const },
      token: 'TOKEN',
    };
    mockClient.post.mockResolvedValue({ data: response });

    const result = await login('a@test.com', 'secret');
    expect(mockClient.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'a@test.com',
      password: 'secret',
    });
    expect(result).toEqual(response);
  });

  it('register posts to /api/auth/register and returns data', async () => {
    const response = {
      user: { id: '2', name: 'New', email: 'n@test.com', role: 'user' as const },
      token: 'TOKEN2',
    };
    mockClient.post.mockResolvedValue({ data: response });

    const result = await register('New', 'n@test.com', 'pw');
    expect(mockClient.post).toHaveBeenCalledWith('/api/auth/register', {
      name: 'New',
      email: 'n@test.com',
      password: 'pw',
    });
    expect(result).toEqual(response);
  });
});
