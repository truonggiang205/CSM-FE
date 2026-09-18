import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Star, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "../../../api/productApi";
import { Button } from "../../../components/ui/Button";
import { useCartStore } from "../../../store/useCartStore";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productApi.getProductBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground">Không tìm thấy sản phẩm</h2>
        <Button asChild className="mt-4">
          <Link to="/products">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity((q) => Math.min(product.stock, q + 1));

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <Link 
        to="/products" 
        className="inline-flex items-center text-sm font-medium text-muted hover:text-primary-dark mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại danh mục
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 bg-surface p-6 sm:p-10 rounded-3xl border border-border shadow-card">
        {/* Gallery Area */}
        <motion.div 
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-square bg-surface-soft rounded-2xl border border-border/80 flex items-center justify-center overflow-hidden p-6 relative"
        >
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-contain mix-blend-multiply"
          />
          {product.discountPrice && (
            <span className="absolute top-4 left-4 bg-danger-pastel text-danger-dark border border-danger/25 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              Đang giảm giá
            </span>
          )}
        </motion.div>

        {/* Info Area */}
        <motion.div 
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-between"
        >
          <div>
            <div className="inline-flex items-center text-xs font-semibold text-primary-dark bg-primary-tint border border-primary/25 px-3 py-1 rounded-full mb-3">
              {product.category.name}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3 leading-snug">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center px-2.5 py-0.5 rounded-full bg-warning-pastel border border-warning/25 text-warning-dark text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-current mr-1" />
                <span>{product.rating}</span>
              </div>
              <span className="text-muted text-xs">({product.reviewsCount} đánh giá từ khách mua)</span>
              <span className="text-muted text-xs">&bull;</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                product.stock > 0 
                  ? "bg-success-pastel text-success-dark border-success/25" 
                  : "bg-danger-pastel text-danger-dark border-danger/25"
              }`}>
                {product.stock > 0 ? `Còn hàng (${product.stock})` : "Tạm hết hàng"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-soft border border-border/70 mb-6">
              {product.discountPrice ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-primary-dark">
                    {formatCurrency(product.discountPrice)}
                  </span>
                  <span className="text-base text-muted line-through">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-extrabold text-primary-dark">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            <div className="prose prose-sm text-muted leading-relaxed mb-6">
              <p>{product.description}</p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {/* Quantity selector */}
              <div className="flex items-center border border-border rounded-xl bg-surface-soft p-1 w-fit">
                <button 
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  className="p-2.5 rounded-lg text-muted hover:text-foreground hover:bg-surface disabled:opacity-40 transition-all"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold text-foreground text-sm">{quantity}</span>
                <button 
                  onClick={handleIncrease}
                  disabled={quantity >= product.stock}
                  className="p-2.5 rounded-lg text-muted hover:text-foreground hover:bg-surface disabled:opacity-40 transition-all"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <Button 
                size="lg" 
                className="flex-1 text-base h-12 shadow-sm" 
                disabled={product.stock === 0}
                onClick={() => addItem(product, quantity)}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Thêm vào giỏ hàng
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
