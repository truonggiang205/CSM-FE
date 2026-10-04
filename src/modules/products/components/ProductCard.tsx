import { motion } from "framer-motion";
import { ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { useCartStore } from "../../../store/useCartStore";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";

interface ProductCardProps {
  product: Product;
  availableStock?: number;
  branchName?: string;
}

export function ProductCard({ product, availableStock, branchName }: ProductCardProps) {
  const { addItem } = useCartStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Tính số lượng tồn kho khả dụng (ưu tiên từ chi nhánh đang chọn, nếu không có thì lấy stock của product)
  const effectiveStock = availableStock !== undefined ? availableStock : product.stock;
  const isOutOfStock = effectiveStock <= 0;
  const isLowStock = effectiveStock > 0 && effectiveStock <= 5;

  const targetPath = `/products/${product.id || product.slug}`;
  const displayImage = (product.images && product.images[0]) || FALLBACK_IMAGE;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col rounded-3xl border border-border bg-surface shadow-card hover:shadow-card-hover overflow-hidden transition-all duration-200"
    >
      {/* Image Area */}
      <Link to={targetPath} className="relative aspect-square overflow-hidden bg-surface-soft block">
        <img
          src={displayImage}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {product.discountPrice && (
            <span className="bg-danger-pastel/90 backdrop-blur-sm text-danger-dark border border-danger/25 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              Ưu đãi
            </span>
          )}

          {/* Badge tồn kho theo chi nhánh */}
          {isOutOfStock ? (
            <Badge variant="destructive" className="shadow-sm font-semibold">
              Hết hàng
            </Badge>
          ) : isLowStock ? (
            <Badge variant="warning" className="shadow-sm font-semibold">
              Sắp hết ({effectiveStock})
            </Badge>
          ) : (
            <Badge variant="success" className="shadow-sm font-semibold">
              Còn hàng
            </Badge>
          )}
        </div>
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-grow p-4 sm:p-5">
        <div className="flex items-center justify-between text-[11px] text-muted mb-1.5">
          <span className="font-semibold text-primary-dark/80 tracking-wide uppercase truncate">
            {product.category?.name || "Tiện lợi"}
          </span>
          {branchName && (
            <span className="text-[10px] text-muted-dark bg-surface-soft px-2 py-0.5 rounded-full border border-border/60 truncate max-w-[110px]">
              {branchName}
            </span>
          )}
        </div>

        <Link to={targetPath} className="hover:text-primary transition-colors">
          <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug mb-2 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {product.sku && (
          <span className="text-[10px] font-mono text-muted mb-3 block">
            SKU: {product.sku}
          </span>
        )}

        <div className="mt-auto pt-3 flex items-end justify-between border-t border-border/50">
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

          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="outline"
              asChild
              className="rounded-xl h-9 w-9 text-muted hover:text-foreground"
              title="Xem chi tiết"
            >
              <Link to={targetPath}>
                <Eye className="w-4 h-4" />
              </Link>
            </Button>

            <Button
              size="icon"
              variant={isOutOfStock ? "outline" : "soft"}
              disabled={isOutOfStock}
              className={`rounded-xl h-9 w-9 shadow-sm transition-all duration-200 ${
                isOutOfStock ? "opacity-50 cursor-not-allowed bg-surface-soft text-muted" : ""
              }`}
              onClick={() => addItem(product, 1)}
              title={isOutOfStock ? "Chi nhánh này tạm thời hết hàng" : "Thêm vào giỏ hàng"}
              aria-label="Thêm vào giỏ hàng"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
