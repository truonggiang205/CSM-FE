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
    <div className="container mx-auto px-4 py-8">
      <Link 
        to="/products" 
        className="inline-flex items-center text-sm font-medium text-muted hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại sản phẩm
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gallery Area */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-square bg-neutral-100 rounded-2xl border border-border flex items-center justify-center overflow-hidden"
        >
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Info Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="text-sm font-medium text-primary mb-2">
            {product.category.name}
          </div>
          <h1 className="text-h1 sm:text-display font-bold text-foreground mb-4">
            {product.name}
          </h1>

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center text-warning">
              <Star className="w-5 h-5 fill-current" />
              <span className="ml-1 font-medium text-foreground">{product.rating}</span>
            </div>
            <span className="text-muted">({product.reviewsCount} đánh giá)</span>
            <span className="text-muted">•</span>
            <span className={product.stock > 0 ? "text-success" : "text-danger"}>
              {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
            </span>
          </div>

          <div className="mb-8">
            {product.discountPrice ? (
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(product.discountPrice)}
                </span>
                <span className="text-lg text-muted line-through mb-1">
                  {formatCurrency(product.price)}
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <div className="prose prose-sm text-muted mb-8">
            <p>{product.description}</p>
          </div>

          <div className="mt-auto border-t border-border pt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Quantity selector */}
              <div className="flex items-center border border-border rounded-md w-fit">
                <button 
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  className="p-3 text-muted hover:text-foreground disabled:opacity-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button 
                  onClick={handleIncrease}
                  disabled={quantity >= product.stock}
                  className="p-3 text-muted hover:text-foreground disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <Button 
                size="lg" 
                className="flex-1 text-base h-12" 
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
