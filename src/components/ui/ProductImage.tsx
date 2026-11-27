import { useState } from "react";
import { ShoppingBag } from "lucide-react";

export interface ProductImageProps {
  src?: string | null;
  alt: string;
  productName: string;
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
}

/**
 * Component hiển thị ảnh sản phẩm kèm placeholder trung tính chuẩn Pastel Retail.
 * Tự động chuyển sang khối nền bg-primary-tint với icon ShoppingBag và chữ cái đầu tên sản phẩm
 * khi URL rỗng, không hợp lệ hoặc tải ảnh thất bại.
 */
export function ProductImage({
  src,
  alt,
  productName,
  className = "w-full h-full object-cover",
  containerClassName = "",
  iconClassName = "w-6 h-6 text-primary",
  loading = "lazy",
  width = 400,
  height = 400,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  // Lấy chữ cái đầu tiên của tên sản phẩm
  const initialChar = productName ? productName.trim().charAt(0).toUpperCase() : "C";

  if (!src || !src.trim() || hasError) {
    return (
      <div
        className={`w-full h-full bg-primary-tint/70 flex flex-col items-center justify-center p-2 text-center select-none ${containerClassName}`}
        role="img"
        aria-label={alt || productName}
      >
        <div className="w-10 h-10 rounded-2xl bg-surface/90 shadow-2xs border border-primary/20 flex items-center justify-center mb-1">
          <ShoppingBag className={iconClassName} />
        </div>
        <span className="text-[11px] font-black text-primary-dark tracking-wider truncate max-w-[85%]">
          {initialChar}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || productName}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

export default ProductImage;
