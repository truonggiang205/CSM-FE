export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    userId: 'u1',
    items: [
      { productId: 'p1', quantity: 2, price: 5000 },
      { productId: 'p2', quantity: 1, price: 8000 }
    ],
    total: 18000,
    status: 'completed',
    createdAt: new Date().toISOString(),
  }
];
