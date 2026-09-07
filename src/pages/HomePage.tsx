import { useQuery } from '@tanstack/react-query';
import { productService } from '../api/productService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Coffee, Pizza, Apple, Sparkles, ShoppingCart } from 'lucide-react';

export function HomePage() {
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products', 'hot'],
    queryFn: () => productService.getProducts(),
  });

  const hotProducts = products?.filter(p => p.isHot) || [];

  const categoryIcons = [<Coffee size={32}/>, <Pizza size={32}/>, <Apple size={32}/>, <Sparkles size={32}/>];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-16"
    >
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-brand-primary-dark to-[#085a32] text-white p-10 md:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-accent/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <Badge variant="accent" className="mb-2 px-3 py-1 shadow-md">Khuyến mãi hè 2026</Badge>
          <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-lg">
            Giải Khát Mùa Hè <br/> Giảm Tới <span className="text-brand-accent">50%</span>
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90 max-w-lg leading-relaxed text-white/90">
            Hàng ngàn sản phẩm nước giải khát, đồ ăn liền, thực phẩm tươi đang chờ bạn tại hệ thống CSM.
          </p>
          <div className="pt-4 flex gap-4">
            <Link to="/products">
              <Button size="lg" className="bg-white text-brand-primary hover:bg-neutral-100 font-bold px-8 shadow-xl hover:shadow-2xl transition-all rounded-full border-none">Mua Ngay</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Danh Mục Nổi Bật</h2>
          <Link to="/products" className="text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors flex items-center gap-1">
            Xem tất cả &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {['Đồ uống', 'Đồ ăn vặt', 'Thực phẩm tươi', 'Đồ dùng cá nhân'].map((cat, idx) => (
            <Card key={idx} hoverable className="text-center p-8 group">
              <div className="w-20 h-20 mx-auto bg-brand-primary/5 group-hover:bg-brand-primary/10 rounded-2xl mb-5 flex items-center justify-center text-brand-primary transition-colors">
                {categoryIcons[idx]}
              </div>
              <h3 className="text-lg font-semibold text-neutral-800">{cat}</h3>
            </Card>
          ))}
        </div>
      </section>

      {/* Hot Products */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Sản Phẩm Bán Chạy</h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-danger bg-red-50 rounded-2xl border border-red-100">
            Lỗi khi tải dữ liệu sản phẩm. Vui lòng thử lại.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {hotProducts.map((product) => (
              <Card key={product.id} hoverable className="flex flex-col relative group">
                <Link to={`/products/${product.id}`} className="block flex-1">
                  {product.isHot && (
                    <Badge variant="accent" className="absolute top-3 right-3 z-10 shadow-sm">Hot</Badge>
                  )}
                  <div className="aspect-[4/3] bg-neutral-100 rounded-xl mb-4 overflow-hidden relative">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <h3 className="text-base font-semibold mb-2 flex-1 line-clamp-2 text-neutral-800 group-hover:text-brand-primary transition-colors leading-snug">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-brand-primary font-bold text-lg">{product.price.toLocaleString('vi-VN')}đ</span>
                    {product.originalPrice && (
                      <span className="text-neutral-500 text-sm line-through font-medium">
                        {product.originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                </Link>
                <Button className="w-full rounded-xl gap-2 font-semibold shadow-sm" variant="primary">
                  <ShoppingCart size={18} /> Thêm vào giỏ
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
