import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { id: '', name: 'Tất cả' },
  { id: 'drinks', name: 'Đồ uống' },
  { id: 'food', name: 'Đồ ăn liền' },
  { id: 'snack', name: 'Snack' },
];

export function ProductListPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const { products, isLoading, isError } = useProducts(selectedCategory || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-h1">Sản Phẩm</h1>
        
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-brand-primary text-white' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-danger bg-red-50 rounded-md">
          Lỗi tải dữ liệu.
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {products?.map(product => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card hoverable className="flex flex-col h-full">
                  <Link to={`/products/${product.id}`} className="block flex-1 group">
                    <motion.div layoutId={`product-image-${product.id}`} className="aspect-[4/3] bg-neutral-100 rounded-xl mb-4 overflow-hidden relative">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                          <Badge variant="danger" className="text-sm px-4 py-1.5 shadow-lg">Hết hàng</Badge>
                        </div>
                      )}
                    </motion.div>
                    <h3 className="text-base font-semibold mb-2 flex-1 line-clamp-2 text-neutral-800 group-hover:text-brand-primary transition-colors leading-snug">{product.name}</h3>
                  </Link>
                  
                  <div className="flex justify-between items-end mt-2 pt-2 mb-4">
                    <span className="text-brand-primary font-bold text-lg">{product.price.toLocaleString('vi-VN')}đ</span>
                    <span className="text-sm font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">
                      Kho: <motion.span key={product.stock} initial={{ opacity:0, y:-10 }} animate={{opacity:1, y:0}} className="text-neutral-800">{product.stock}</motion.span>
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full mt-auto rounded-xl shadow-sm gap-2" 
                    disabled={product.stock === 0}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                    {product.stock === 0 ? 'Tạm hết' : 'Thêm vào giỏ'}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
