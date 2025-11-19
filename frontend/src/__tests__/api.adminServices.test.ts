import apiClient from '../api/client';
import {
  adminListServices,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
} from '../api/adminServices';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockClient = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

describe('api/adminServices', () => {
  beforeEach(() => {
    mockClient.get.mockReset();
    mockClient.post.mockReset();
    mockClient.patch.mockReset();
    mockClient.delete.mockReset();
  });

  it('adminListServices returns typed response', async () => {
    const services = [{ _id: 's1', name: 'Cut', durationMin: 30, price: 10 }];
    mockClient.get.mockResolvedValue({ data: { services } });

    const res = await adminListServices();
    expect(mockClient.get).toHaveBeenCalledWith('/api/admin/services');
    expect(res).toEqual({ services });
  });

  it('adminCreateService posts and returns service', async () => {
    const service = { _id: 's1', name: 'Cut', durationMin: 30, price: 10 };
    mockClient.post.mockResolvedValue({ data: { service } });

    const res = await adminCreateService({
      name: 'Cut',
      durationMin: 30,
      price: 10,
    });
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/admin/services',
      { name: 'Cut', durationMin: 30, price: 10 },
    );
    expect(res).toEqual({ service });
  });

  it('adminUpdateService patches correct endpoint', async () => {
    const service = { _id: 's1', name: 'Cut', durationMin: 30, price: 10 };
    mockClient.patch.mockResolvedValue({ data: { service } });

    const res = await adminUpdateService('s1', { price: 20 });
    expect(mockClient.patch).toHaveBeenCalledWith(
      '/api/admin/services/s1',
      { price: 20 },
    );
    expect(res).toEqual({ service });
  });

  it('adminDeleteService deletes and returns deleted service', async () => {
    const deleted = { _id: 's1', name: 'Cut', durationMin: 30, price: 10 };
    mockClient.delete.mockResolvedValue({ data: { deleted } });

    const res = await adminDeleteService('s1');
    expect(mockClient.delete).toHaveBeenCalledWith('/api/admin/services/s1');
    expect(res).toEqual({ deleted });
  });
});
