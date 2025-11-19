import apiClient from '../api/client';
import {
  getServices,
  getBarbers,
  adminGetServices,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
} from '../api/public';

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

describe('api/public', () => {
  beforeEach(() => {
    mockClient.get.mockReset();
    mockClient.post.mockReset();
    mockClient.patch.mockReset();
    mockClient.delete.mockReset();
  });

  it('getServices returns services', async () => {
    const services = [{ _id: 's1', name: 'Cut', durationMin: 30, price: 10 }];
    mockClient.get.mockResolvedValue({ data: { services } });

    const result = await getServices();
    expect(mockClient.get).toHaveBeenCalledWith('/api/services');
    expect(result).toEqual(services);
  });

  it('getBarbers returns barbers', async () => {
    const barbers = [{ _id: 'b1', name: 'Barber' }];
    mockClient.get.mockResolvedValue({ data: { barbers } });

    const result = await getBarbers();
    expect(mockClient.get).toHaveBeenCalledWith('/api/barbers');
    expect(result).toEqual(barbers);
  });

  it('admin service CRUD calls correct endpoints', async () => {
    const services = [{ _id: 's1', name: 'Cut', durationMin: 30, price: 10 }];
    const service = services[0];

    mockClient.get.mockResolvedValueOnce({ data: { services } });
    await adminGetServices();
    expect(mockClient.get).toHaveBeenCalledWith('/api/admin/services');

    mockClient.post.mockResolvedValueOnce({ data: { service } });
    await adminCreateService({
      name: 'Cut',
      durationMin: 30,
      price: 10,
    });
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/admin/services',
      { name: 'Cut', durationMin: 30, price: 10 },
    );

    mockClient.patch.mockResolvedValueOnce({ data: { service } });
    await adminUpdateService('s1', { price: 20 });
    expect(mockClient.patch).toHaveBeenCalledWith(
      '/api/admin/services/s1',
      { price: 20 },
    );

    await adminDeleteService('s1');
    expect(mockClient.delete).toHaveBeenCalledWith('/api/admin/services/s1');
  });
});
