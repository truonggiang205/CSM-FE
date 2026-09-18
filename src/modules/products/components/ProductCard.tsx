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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col rounded-2xl border border-border bg-surface shadow-card hover:shadow-card-hover overflow-hidden transition-all duration-200"
    >
      {/* Image Area */}
      <Link to={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-surface-soft block">
        <img
          src={product.images[0]}
          alt={product.name}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        {product.discountPrice && (
          <div className="absolute top-2.5 left-2.5 bg-danger-pastel/90 backdrop-blur-sm text-danger-dark border border-danger/25 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
            Ưu đãi
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-grow p-4">
        <div className="text-[11px] font-medium text-primary-dark/80 tracking-wide uppercase mb-1">
          {product.category.name}
        </div>
        <Link to={`/products/${product.slug}`} className="hover:text-primary transition-colors">
          <h3 className="font-semibold text-foreground text-sm leading-snug mb-2 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto pt-2 flex items-end justify-between border-t border-border/50">
          <div>
            {product.discountPrice ? (
              <>
                <div className="text-primary-dark font-extrabold text-base sm:text-lg">
                  {formatCurrency(product.discountPrice)}
                </div>
                <div className="text-muted text-xs line-through">
                  {formatCurrency(product.price)}
                </div>
              </>
            ) : (
              <div className="text-primary-dark font-extrabold text-base sm:text-lg">
                {formatCurrency(product.price)}
              </div>
            )}
          </div>

          <Button
            size="icon"
            variant="soft"
            className="rounded-xl shadow-sm transition-all duration-200"
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
