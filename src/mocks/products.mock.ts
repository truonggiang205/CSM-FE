export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  isHot?: boolean;
}

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Nước Khoáng LaVie 500ml',
    price: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=200&auto=format&fit=crop',
    category: 'drinks',
  },
  {
    id: 'p2',
    name: 'Mì Ly Hảo Hảo Tôm Chua Cay',
    price: 8000,
    originalPrice: 10000,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?q=80&w=200&auto=format&fit=crop',
    category: 'food',
    isHot: true,
  },
  {
    id: 'p3',
    name: 'Bánh Snack Khoai Tây Lay\'s',
    price: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-e924e50cb0ee?q=80&w=200&auto=format&fit=crop',
    category: 'snack',
  },
  {
    id: 'p4',
    name: 'Cà phê Đen Đá',
    price: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?q=80&w=200&auto=format&fit=crop',
    category: 'drinks',
    isHot: true,
  },
];
