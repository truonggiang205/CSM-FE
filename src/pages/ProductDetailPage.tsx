import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../api/productService';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
        <Skeleton className="w-full md:w-1/2 h-96 rounded-lg" />
        <div className="w-full md:w-1/2 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-8 text-center text-danger">
        <p>Không tìm thấy sản phẩm hoặc có lỗi xảy ra.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>Quay lại cửa hàng</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product);
    // Framer motion can handle a layoutId animation here if we build a separate cart icon component,
    // but for now, we just add it to the Zustand store.
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-neutral-600 hover:text-brand-primary font-medium mb-4 transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" /> Quay lại
      </button>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 bg-white p-6 md:p-10 rounded-xl shadow-sm border border-neutral-100">
        
        {/* Product Image */}
        <div className="w-full md:w-1/2">
          <motion.div 
            layoutId={`product-image-${product.id}`}
            className="rounded-lg overflow-hidden bg-neutral-100 aspect-square"
          >
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover" 
            />
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="mb-2">
            {product.isHot && <Badge variant="accent" className="mr-2">Hot</Badge>}
            <Badge variant="neutral" className="uppercase">{product.category}</Badge>
          </div>
          
          <h1 className="text-display mb-4 text-neutral-900">{product.name}</h1>
          
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-brand-primary">
              {product.price.toLocaleString('vi-VN')}đ
            </span>
            {product.originalPrice && (
              <span className="text-lg text-neutral-600 line-through">
                {product.originalPrice.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>

          <div className="prose prose-sm text-neutral-600 mb-8 border-t border-neutral-300 pt-6">
            <p>
              Đây là nội dung mô tả mẫu cho sản phẩm <strong>{product.name}</strong>. 
              Sản phẩm luôn được đảm bảo chất lượng, bảo quản lạnh ở nhiệt độ tiêu chuẩn và giao hàng nhanh chóng từ hệ thống cửa hàng tiện lợi CSM.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>100% chính hãng</li>
              <li>Đổi trả trong vòng 24h nếu lỗi NSX</li>
              <li>Tích điểm thành viên 5%</li>
            </ul>
          </div>

          <div className="mt-auto pt-6 border-t border-neutral-300">
            <Button size="lg" className="w-full flex justify-center items-center gap-2" onClick={handleAddToCart}>
              <ShoppingCart size={20} />
              Thêm vào giỏ hàng
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
