import apiClient from '../api/client';
import {
  listTimeOff,
  createTimeOff,
  deleteTimeOff,
} from '../api/timeoff';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockClient = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  delete: jest.Mock;
};

describe('api/timeoff', () => {
  beforeEach(() => {
    mockClient.get.mockReset();
    mockClient.post.mockReset();
    mockClient.delete.mockReset();
  });

  it('listTimeOff passes barberId only when provided', async () => {
    const timeoff = [{ _id: 't1' }];
    mockClient.get.mockResolvedValue({ data: { timeoff } });

    await listTimeOff();
    expect(mockClient.get).toHaveBeenCalledWith('/api/admin/timeoff', {
      params: undefined,
    });

    await listTimeOff({ barberId: 'b1' });
    expect(mockClient.get).toHaveBeenCalledWith('/api/admin/timeoff', {
      params: { barberId: 'b1' },
    });
  });

  it('createTimeOff posts payload and returns entry', async () => {
    const entry = { _id: 't1' };
    mockClient.post.mockResolvedValue({ data: { timeoff: entry } });

    const res = await createTimeOff({
      barberId: 'b1',
      start: 'iso-start',
      end: 'iso-end',
      reason: 'Holiday',
    });

    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/admin/timeoff',
      {
        barberId: 'b1',
        start: 'iso-start',
        end: 'iso-end',
        reason: 'Holiday',
      },
    );
    expect(res).toEqual(entry);
  });

  it('deleteTimeOff deletes and returns deleted entry', async () => {
    const deleted = { _id: 't1' };
    mockClient.delete.mockResolvedValue({ data: { deleted } });

    const res = await deleteTimeOff('t1');
    expect(mockClient.delete).toHaveBeenCalledWith('/api/admin/timeoff/t1');
    expect(res).toEqual(deleted);
  });
});
