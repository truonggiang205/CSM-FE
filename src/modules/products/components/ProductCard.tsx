import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { useCartStore } from "../../../store/useCartStore";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col rounded-xl border border-border bg-surface shadow-sm overflow-hidden"
    >
      {/* Image Area */}
      <Link to={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-neutral-100 block">
        <img
          src={product.images[0]}
          alt={product.name}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        {product.discountPrice && (
          <div className="absolute top-2 left-2 bg-danger text-white text-xs font-bold px-2 py-1 rounded-md">
            Khuyến mãi
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-grow p-4">
        <div className="text-xs text-muted mb-1">{product.category.name}</div>
        <Link to={`/products/${product.slug}`} className="hover:text-primary transition-colors">
          <h3 className="font-medium text-foreground mb-2 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto flex items-end justify-between">
          <div>
            {product.discountPrice ? (
              <>
                <div className="text-primary font-bold text-lg">
                  {formatCurrency(product.discountPrice)}
                </div>
                <div className="text-muted text-sm line-through">
                  {formatCurrency(product.price)}
                </div>
              </>
            ) : (
              <div className="text-primary font-bold text-lg">
                {formatCurrency(product.price)}
              </div>
            )}
          </div>

          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => addItem(product, 1)}
            aria-label="Thêm vào giỏ hàng"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
