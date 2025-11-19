import { getMe, updateMe, pruneNulls } from '../api/me';
import apiClient from '../api/client';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockClient = apiClient as unknown as {
  get: jest.Mock;
  patch: jest.Mock;
};

describe('api/me', () => {
  beforeEach(() => {
    mockClient.get.mockReset();
    mockClient.patch.mockReset();
  });

  it('pruneNulls removes null/undefined keys', () => {
    const input = {
      name: 'Ayham',
      phone: null,
      address: undefined,
      avatarUrl: 'x',
    };
    const out = pruneNulls(input);
    expect(out).toEqual({ name: 'Ayham', avatarUrl: 'x' });
  });

  it('getMe calls /api/auth/me and returns user', async () => {
    const user = { id: 'u1', name: 'Ayham' };
    mockClient.get.mockResolvedValue({ data: { user } });

    const result = await getMe();
    expect(mockClient.get).toHaveBeenCalledWith('/api/auth/me');
    expect(result).toEqual(user);
  });

  it('updateMe prunes nulls and patches /api/auth/me', async () => {
    const user = { id: 'u1', name: 'Updated' };
    mockClient.patch.mockResolvedValue({ data: { user } });

    const result = await updateMe({ name: 'Updated', phone: null });
    expect(mockClient.patch).toHaveBeenCalledWith('/api/auth/me', { name: 'Updated' });
    expect(result).toEqual(user);
  });
});
