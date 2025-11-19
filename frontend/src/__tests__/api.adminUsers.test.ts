import { getAdminUser, updateAdminUser } from '../api/adminUsers';
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

describe('api/adminUsers', () => {
  beforeEach(() => {
    mockClient.get.mockReset();
    mockClient.patch.mockReset();
  });

  it('getAdminUser fetches user by id', async () => {
    const user = { _id: '1', name: 'Admin' };
    mockClient.get.mockResolvedValue({ data: { user } });

    const result = await getAdminUser('1');
    expect(mockClient.get).toHaveBeenCalledWith('/api/admin/users/1');
    expect(result).toEqual(user);
  });

  it('updateAdminUser prunes null/empty strings and patches server', async () => {
    const user = { _id: '1', name: 'Updated' };
    mockClient.patch.mockResolvedValue({ data: { user } });

    const patch = {
      name: 'Updated',
      email: '',
      block_reason: '  ',
      phone: '123',
      avatarUrl: null as unknown as string,
    };

    const result = await updateAdminUser('1', patch);
    // email, block_reason, avatarUrl should be dropped, phone + name kept
    expect(mockClient.patch).toHaveBeenCalledWith('/api/admin/users/1', {
      name: 'Updated',
      phone: '123',
    });
    expect(result).toEqual(user);
  });
});
