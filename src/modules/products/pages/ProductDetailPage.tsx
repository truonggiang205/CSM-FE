import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Plus,
  Minus,
  Store,
  MapPin,
  Check,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "../../../api/productApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { useBranchStore } from "../../../store/useBranchStore";
import { useCartStore } from "../../../store/useCartStore";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Skeleton } from "../../../components/ui/Skeleton";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [addSuccessNotice, setAddSuccessNotice] = useState(false);

  const { selectedBranch, setBranch } = useBranchStore();
  const { addItem } = useCartStore();

  // 1. Fetch chi tiết sản phẩm
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError: isErrorProduct,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productApi.getProductBySlug(slug!),
    enabled: !!slug,
  });

  // 2. Fetch tồn kho sản phẩm ở tất cả các chi nhánh
  const productId = product?.id;
  const {
    data: branchStocks = [],
    isLoading: isLoadingStocks,
  } = useQuery({
    queryKey: ["inventory", "product", productId],
    queryFn: () => inventoryApi.getStockByProduct(productId!),
    enabled: !!productId,
  });

  // Sắp xếp chi nhánh đang chọn lên đầu danh sách
  const sortedBranchStocks = useMemo(() => {
    if (!selectedBranch || branchStocks.length === 0) return branchStocks;
    return [...branchStocks].sort((a, b) => {
      if (a.branch_id === selectedBranch.id) return -1;
      if (b.branch_id === selectedBranch.id) return 1;
      return 0;
    });
  }, [branchStocks, selectedBranch]);

  // Tồn kho khả dụng tại chi nhánh đang chọn
  const currentBranchStock = useMemo(() => {
    if (!selectedBranch || branchStocks.length === 0) return null;
    return branchStocks.find((s) => s.branch_id === selectedBranch.id);
  }, [branchStocks, selectedBranch]);

  // Số lượng khả dụng hiệu lực
  const availableQty =
    currentBranchStock !== null && currentBranchStock !== undefined
      ? currentBranchStock.available
      : product?.stock ?? 0;

  // Điều chỉnh lại số lượng đặt nếu vượt quá tồn kho khả dụng mới khi đổi chi nhánh
  useEffect(() => {
    if (availableQty <= 0) {
      setQuantity(1);
    } else if (quantity > availableQty) {
      setQuantity(availableQty);
    }
  }, [availableQty, quantity]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity((q) => Math.min(availableQty, q + 1));

  const handleAddToCart = () => {
    if (!product || availableQty <= 0) return;
    addItem(product, quantity);
    setAddSuccessNotice(true);
    setTimeout(() => setAddSuccessNotice(false), 2500);
  };

  // Trạng thái Loading
  if (isLoadingProduct) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8">
        <Skeleton className="h-6 w-36 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-surface p-6 sm:p-10 rounded-3xl border border-border">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-1/3 rounded-lg" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái Lỗi kết nối
  if (isErrorProduct) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 bg-danger-pastel text-danger-dark rounded-3xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Không thể tải thông tin sản phẩm</h2>
        <p className="text-xs text-muted mb-6">Đã xảy ra lỗi khi kết nối tới Product Service.</p>
        <Button onClick={() => refetchProduct()} className="rounded-2xl gap-2">
          <RotateCcw className="w-4 h-4" />
          Thử lại
        </Button>
      </div>
    );
  }

  // Trạng thái Không tìm thấy sản phẩm
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 bg-primary-tint text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">
          📦
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Sản phẩm không tồn tại</h2>
        <p className="text-xs text-muted mb-6">Mặt hàng bạn tìm kiếm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
        <Button asChild className="rounded-2xl">
          <Link to="/products">Quay lại danh sách sản phẩm</Link>
        </Button>
      </div>
    );
  }

  const isOutOfStock = availableQty <= 0;
  const isLowStock = availableQty > 0 && availableQty <= 5;
  const displayImage = (product.images && product.images[0]) || FALLBACK_IMAGE;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8">
      {/* Back button */}
      <Link
        to="/products"
        className="inline-flex items-center text-sm font-semibold text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại danh mục sản phẩm
      </Link>

      {/* Main Product Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 bg-surface p-6 sm:p-10 rounded-3xl border border-border shadow-card">
        {/* Gallery Area */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-square bg-surface-soft rounded-3xl border border-border/80 flex items-center justify-center overflow-hidden p-6 relative"
        >
          <img
            src={displayImage}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 hover:scale-105"
          />
          {product.discountPrice && (
            <span className="absolute top-4 left-4 bg-danger-pastel text-danger-dark border border-danger/25 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
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
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center text-xs font-bold text-primary-dark bg-primary-tint border border-primary/25 px-3 py-1 rounded-full">
                {product.category?.name || "Tiện lợi"}
              </span>
              {product.sku && (
                <span className="text-xs font-mono text-muted bg-surface-soft px-2.5 py-1 rounded-full border border-border/70">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3 leading-snug">
              {product.name}
            </h1>

            {/* Rating & Stock Summary */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center px-2.5 py-0.5 rounded-full bg-warning-pastel border border-warning/25 text-warning-dark text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-current mr-1" />
                <span>{product.rating}</span>
              </div>
              <span className="text-muted text-xs">({product.reviewsCount} lượt mua)</span>
              <span className="text-muted text-xs">&bull;</span>

              {/* Tồn kho tại chi nhánh đang chọn */}
              {isOutOfStock ? (
                <Badge variant="destructive" className="font-bold">
                  Hết hàng tại {selectedBranch?.name || "chi nhánh"}
                </Badge>
              ) : isLowStock ? (
                <Badge variant="warning" className="font-bold">
                  Sắp hết hàng (còn {availableQty} món)
                </Badge>
              ) : (
                <Badge variant="success" className="font-bold">
                  Còn hàng ({availableQty} món khả dụng)
                </Badge>
              )}
            </div>

            {/* Price Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-soft border border-border/70 mb-6">
              {product.discountPrice ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-primary-dark">
                    {formatCurrency(product.discountPrice)}
                  </span>
                  <span className="text-base text-muted line-through font-medium">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-extrabold text-primary-dark">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="text-xs sm:text-sm text-muted leading-relaxed mb-6">
              <p>{product.description || "Sản phẩm chất lượng cao của chuỗi cửa hàng tiện lợi CSM, sẵn sàng phục vụ 24/7."}</p>
            </div>
          </div>

          {/* Cart Action Area */}
          <div className="border-t border-border pt-6 space-y-3">
            {isOutOfStock ? (
              <div className="p-3.5 rounded-2xl bg-danger-pastel/70 border border-danger/25 text-danger-dark text-xs leading-relaxed">
                ⚠️ Chi nhánh <strong>{selectedBranch?.name}</strong> hiện đã hết sản phẩm này.
                Vui lòng tham khảo bảng tồn kho các chi nhánh bên dưới để chọn cửa hàng còn hàng gần bạn nhất!
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              {/* Quantity Picker */}
              <div className="flex items-center border border-border rounded-2xl bg-surface-soft p-1 w-fit">
                <button
                  onClick={handleDecrease}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-surface disabled:opacity-30 transition-all"
                  aria-label="Giảm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-extrabold text-foreground text-sm">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  disabled={quantity >= availableQty || isOutOfStock}
                  className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-surface disabled:opacity-30 transition-all"
                  aria-label="Tăng"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <Button
                size="lg"
                className={`flex-1 text-base h-12 rounded-2xl shadow-sm gap-2 font-bold ${
                  isOutOfStock ? "opacity-50 cursor-not-allowed bg-surface-soft text-muted border border-border" : ""
                }`}
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock ? "Tạm hết hàng tại chi nhánh này" : "Thêm vào giỏ hàng"}
              </Button>
            </div>

            {addSuccessNotice && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold text-success-dark bg-success-pastel border border-success/30 px-3.5 py-2 rounded-xl flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Đã thêm {quantity} sản phẩm vào giỏ hàng thành công!
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Khối Tồn Kho Theo Chi Nhánh (Mission 3 Core Requirement) */}
      <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark uppercase tracking-wider mb-1">
              <Store className="w-4 h-4" />
              Kiểm tra tồn kho thời gian thực
            </div>
            <h2 className="text-xl font-extrabold text-foreground">Tình Trạng Tồn Kho Theo Chi Nhánh</h2>
          </div>
          <span className="text-xs text-muted">
            Chi nhánh bạn đang chọn được đánh dấu nổi bật ở đầu danh sách
          </span>
        </div>

        {isLoadingStocks ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : sortedBranchStocks.length === 0 ? (
          <div className="py-8 text-center text-muted text-xs">
            Chưa có thông tin tồn kho cho sản phẩm này tại các chi nhánh.
          </div>
        ) : (
          <div className="divide-y divide-border/60 border border-border/80 rounded-2xl overflow-hidden">
            {sortedBranchStocks.map((stockItem) => {
              const isCurrent = stockItem.branch_id === selectedBranch?.id;
              const isBranchOut = stockItem.available <= 0;
              const isBranchLow = stockItem.available > 0 && stockItem.available <= 5;

              return (
                <div
                  key={stockItem.branch_id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isCurrent ? "bg-primary-tint/50 border-l-4 border-l-primary" : "hover:bg-surface-soft/60"
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm sm:text-base text-foreground">
                        {stockItem.branch_name}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white shadow-xs">
                          <Check className="w-3 h-3" />
                          Đang chọn mua
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-muted flex-shrink-0" />
                      <span className="truncate">{stockItem.branch_address}</span>
                    </p>
                  </div>

                  {/* Stock count & Quick Select Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-foreground">
                        Khả dụng:{" "}
                        <span
                          className={`text-sm font-extrabold ${
                            isBranchOut
                              ? "text-danger-dark"
                              : isBranchLow
                              ? "text-warning-dark"
                              : "text-primary-dark"
                          }`}
                        >
                          {stockItem.available}
                        </span>{" "}
                        món
                      </div>

                      {isBranchOut ? (
                        <Badge variant="destructive" className="mt-1">
                          Hết hàng
                        </Badge>
                      ) : isBranchLow ? (
                        <Badge variant="warning" className="mt-1">
                          Sắp hết
                        </Badge>
                      ) : (
                        <Badge variant="success" className="mt-1">
                          Sẵn sàng
                        </Badge>
                      )}
                    </div>

                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-primary/30 text-primary-dark hover:bg-primary-tint font-bold text-xs h-9 px-3.5"
                        onClick={() =>
                          setBranch({
                            id: stockItem.branch_id,
                            name: stockItem.branch_name,
                            address: stockItem.branch_address,
                          })
                        }
                      >
                        Chọn chi nhánh này
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
