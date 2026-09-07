import apiClient, { ApiUnavailableError } from './apiClient';
import { Order, mockOrders, OrderItem } from '../mocks/orders.mock';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const orderService = {
  createOrder: async (items: OrderItem[], total: number, address: string): Promise<Order> => {
    try {
      const response = await apiClient.post<Order>('/orders', { items, total, address });
      return response.data;
    } catch (error) {
      if (error instanceof ApiUnavailableError) {
        await delay(500);
        const newOrder: Order = {
          id: `ord-${Math.floor(Math.random() * 1000)}`,
          userId: 'u1',
          items,
          total,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        mockOrders.push(newOrder); // Update mock data locally
        return newOrder;
      }
      throw error;
    }
  },

  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    try {
      const response = await apiClient.get<Order[]>(`/orders/user/${userId}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiUnavailableError) {
        await delay(300);
        return mockOrders.filter(o => o.userId === userId);
      }
      throw error;
    }
  }
};
