import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  ChevronRight,
  ShieldCheck,
  Truck,
  Clock,
  Sparkles,
  Zap,
  Info,
  HeartHandshake,
  Flame,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "../../../api/productApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { flashSaleApi } from "../../../api/flashSaleApi";
import { useBranchStore } from "../../../store/useBranchStore";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../../../components/ui/ProductImage";

export interface ProductExtraDetails {
  origin: string;
  brand: string;
  manufacturer: string;
  certification: string;
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sodium: string;
  sugar: string;
  ingredients: string[];
  storageInstructions: string[];
  usageInstructions: string[];
  warnings: string[];
}

const mockDefaultProductExtra: ProductExtraDetails = {
  origin: "Việt Nam",
  brand: "CSM Select / Premium Local",
  manufacturer: "Công ty Cổ phần Thực phẩm Tiện lợi CSM Việt Nam",
  certification: "HACCP & ISO 22000:2018, Chuẩn Vệ sinh An toàn Thực phẩm",
  servingSize: "100g / 1 phần ăn",
  calories: "215 kcal",
  protein: "7.8 g",
  carbs: "28.5 g",
  fat: "4.2 g",
  sodium: "320 mg",
  sugar: "5.1 g",
  ingredients: [
    "Nguyên liệu tươi chọn lọc loại 1",
    "Nước tinh khiết qua hệ thống lọc RO",
    "Gia vị tự nhiên tiêu chuẩn cao cấp",
    "Không sử dụng phẩm màu tổng hợp độc hại",
    "Không chất bảo quản vượt ngưỡng cho phép",
  ],
  storageInstructions: [
    "Bảo quản ở nhiệt độ 2°C - 8°C (đối với thực phẩm tươi & đồ mát)",
    "Nhiệt độ phòng thoáng mát 22°C - 26°C (đối với đồ khô & bánh kẹo)",
    "Tránh ánh nắng mặt trời chiếu trực tiếp",
    "Sau khi mở bao bì, nên sử dụng trong vòng 24 giờ",
  ],
  usageInstructions: [
    "Dùng trực tiếp sau khi mở bao bì hoặc hâm nóng bằng lò vi sóng trong 1-2 phút",
    "Ngon hơn khi dùng kèm đồ uống ướp lạnh CSM",
    "Kiểm tra hạn sử dụng in trên bao bì trước khi dùng",
  ],
  warnings: [
    "Không sử dụng sản phẩm khi quá hạn sử dụng hoặc bao bì bị rách, xẹp",
    "Sản phẩm có thể chứa thành phần đậu phộng, trứng hoặc sữa đối với người có cơ địa dị ứng",
  ],
};

type DetailTab = "description" | "nutrition" | "storage";

export function ProductDetailPage() {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const productIdentifier = id || slug;
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>("description");
  const [addSuccessNotice, setAddSuccessNotice] = useState(false);

  const { selectedBranch, setBranch } = useBranchStore();
  const { addItem, setIsOpen: setCartOpen } = useCartStore();

  // 1. Fetch chi tiết sản phẩm theo ID hoặc slug
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError: isErrorProduct,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ["product", productIdentifier],
    queryFn: () => productApi.getProductById(productIdentifier!),
    enabled: !!productIdentifier,
  });

  const { data: flashSaleData } = useQuery({
    queryKey: ["active-flash-sale"],
    queryFn: flashSaleApi.getActiveOrUpcoming,
    refetchInterval: 30000,
  });

  const flashSaleItem = useMemo(() => {
    if (!product || flashSaleData?.status !== "ACTIVE" || !flashSaleData.items) return null;
    return flashSaleData.items.find((i) => String(i.product_id) === String(product.id)) || null;
  }, [product, flashSaleData]);

  const isSoldOut = useMemo(() => {
    if (!flashSaleItem) return false;
    const limit = Number(flashSaleItem.quantity_limit) || 0;
    const sold = Number(flashSaleItem.sold_count) || 0;
    return limit > 0 && sold >= limit;
  }, [flashSaleItem]);

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const rawEndTimeStr = flashSaleData?.endTime || flashSaleData?.campaign?.end_time;

  useEffect(() => {
    if (!rawEndTimeStr) {
      setTimeLeft("");
      setIsExpired(false);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const parts = rawEndTimeStr.split(":").map(Number);
      if (parts.length < 2) return;

      const target = new Date(now);
      target.setHours(parts[0], parts[1], parts[2] || 0, 0);

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("");
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => String(n).padStart(2, "0");
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [rawEndTimeStr]);

  const isFlashSaleActive = useMemo(() => {
    if (!flashSaleItem || isSoldOut || isExpired) return false;
    return Number(flashSaleItem.sale_price) > 0 && Number(flashSaleItem.sale_price) < (product?.price || 0);
  }, [flashSaleItem, isSoldOut, isExpired, product]);

  const effectiveProduct = useMemo(() => {
    if (!product) return null;
    if (isFlashSaleActive && flashSaleItem) {
      return {
        ...product,
        discountPrice: Number(flashSaleItem.sale_price),
        flashSaleMeta: {
          soldCount: Number(flashSaleItem.sold_count) || 0,
          quantityLimit: Number(flashSaleItem.quantity_limit) || 0,
          endTime: rawEndTimeStr,
          isSoldOut: false,
        },
      };
    }
    return product;
  }, [product, flashSaleItem, isFlashSaleActive, rawEndTimeStr]);

  const productId = product?.id;
  const {
    data: branchStocks = [],
    isLoading: isLoadingStocks,
  } = useQuery({
    queryKey: ["inventory", "product", productId],
    queryFn: () => inventoryApi.getStockByProduct(productId!),
    enabled: !!productId,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getProducts,
    enabled: !!product?.category?.id,
  });

  const sortedBranchStocks = useMemo(() => {
    if (!selectedBranch || branchStocks.length === 0) return branchStocks;
    return [...branchStocks].sort((a, b) => {
      if (a.branch_id === selectedBranch.id) return -1;
      if (b.branch_id === selectedBranch.id) return 1;
      return 0;
    });
  }, [branchStocks, selectedBranch]);

  const currentBranchStock = useMemo(() => {
    if (!selectedBranch || branchStocks.length === 0) return null;
    return branchStocks.find((s) => s.branch_id === selectedBranch.id);
  }, [branchStocks, selectedBranch]);

  const availableQty =
    currentBranchStock !== null && currentBranchStock !== undefined
      ? currentBranchStock.available
      : product?.stock ?? 0;

  const relatedProducts = useMemo(() => {
    if (!effectiveProduct) return [];
    const activeFlashMap = new Map<string, number>();
    if (flashSaleData?.status === "ACTIVE" && flashSaleData.items) {
      for (const item of flashSaleData.items) {
        const sale = Number(item.sale_price);
        if (sale > 0) activeFlashMap.set(String(item.product_id), sale);
      }
    }
    return allProducts
      .filter((p) => p.category?.id === effectiveProduct.category?.id && p.id !== effectiveProduct.id)
      .slice(0, 4)
      .map((p) => {
        const sale = activeFlashMap.get(String(p.id));
        if (sale && sale < p.price) {
          return { ...p, discountPrice: sale };
        }
        return p;
      });
  }, [allProducts, effectiveProduct, flashSaleData]);

  useEffect(() => {
    if (availableQty <= 0) {
      setQuantity(1);
    } else if (quantity > availableQty) {
      setQuantity(availableQty);
    }
  }, [availableQty, quantity]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity((q) => Math.min(availableQty, q + 1));

  const handleAddToCart = () => {
    const targetProduct = effectiveProduct || product;
    if (!targetProduct || availableQty <= 0) return;
    addItem(targetProduct, quantity);
    useCartToastStore.getState().showToast(targetProduct.name);
    setAddSuccessNotice(true);
    setTimeout(() => setAddSuccessNotice(false), 2500);
  };

  const handleBuyNow = () => {
    const targetProduct = effectiveProduct || product;
    if (!targetProduct || availableQty <= 0) return;
    addItem(targetProduct, quantity);
    setCartOpen(true);
    navigate("/checkout");
  };

  // Trạng thái Loading
  if (isLoadingProduct) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8">
        <Skeleton className="h-6 w-48 rounded-xl" />
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

  // Thư viện ảnh: lấy từ product.images hoặc mảng rỗng nếu không có
  const galleryImages: string[] =
    product.images && product.images.length > 0
      ? product.images
      : [];

  const currentDisplayImage = galleryImages[selectedImageIndex] || galleryImages[0] || "";

  const originalPrice = (effectiveProduct || product).price;
  const salePrice = (effectiveProduct || product).discountPrice || originalPrice;
  const hasDiscount = !!(effectiveProduct || product).discountPrice && (effectiveProduct || product).discountPrice! < originalPrice;
  const percentOff = hasDiscount
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-10">
      {/* ================= BREADCRUMBS ================= */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted overflow-x-auto whitespace-nowrap pb-1">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0" />
        <Link to="/products" className="hover:text-primary transition-colors font-medium">
          Sản phẩm
        </Link>
        {product.category?.name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            <Link
              to={`/products?category=${product.category.id}`}
              className="hover:text-primary transition-colors font-medium"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0" />
        <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* ================= MAIN PRODUCT CARD ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 bg-surface p-6 sm:p-10 rounded-3xl border border-border shadow-card">
        {/* Left: Gallery Area (Main Image + Thumbnails) */}
        <div className="space-y-4">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square bg-surface-soft rounded-3xl border border-border/80 flex items-center justify-center overflow-hidden p-6 relative group"
          >
            <ProductImage
              src={currentDisplayImage}
              alt={product.name}
              productName={product.name}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              iconClassName="w-12 h-12 text-primary"
              loading="eager"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-danger text-white text-xs font-black px-3 py-1 rounded-full shadow-xs">
                -{percentOff}% GIẢM
              </span>
            )}
          </motion.div>

          {/* Thumbnails row */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-surface-soft flex-shrink-0 ${
                    idx === selectedImageIndex
                      ? "border-primary shadow-xs ring-2 ring-primary/20"
                      : "border-border/80 hover:border-muted"
                  }`}
                  aria-label={`Xem ảnh ${idx + 1}`}
                >
                  <ProductImage
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    productName={product.name}
                    className="w-full h-full object-cover rounded-xl"
                    iconClassName="w-4 h-4 text-primary"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
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
              {selectedBranch && (
                <span className="text-xs text-primary-dark font-medium bg-primary-tint/50 px-2.5 py-1 rounded-full border border-primary/20 flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  {selectedBranch.name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3 leading-snug">
              {product.name}
            </h1>

            {/* Rating & Stock Summary */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center px-2.5 py-0.5 rounded-full bg-warning-pastel border border-warning/25 text-warning-dark text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-current mr-1 text-amber-500" />
                <span>4.8</span>
                <span className="text-muted font-normal ml-1">(120 đánh giá)</span>
              </div>
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
                  Còn hàng ({availableQty} món sẵn sàng)
                </Badge>
              )}
            </div>

            {/* Price Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-soft border border-border/70 mb-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-primary-dark">
                    {formatCurrency(salePrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-base text-muted line-through font-medium">
                      {formatCurrency(originalPrice)}
                    </span>
                  )}
                </div>
                {isFlashSaleActive && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger/10 text-danger border border-danger/30 text-xs font-black uppercase tracking-wider self-start sm:self-auto">
                    ⚡ Giờ Vàng Giá Sốc
                  </span>
                )}
                {isSoldOut && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/20 text-muted border border-border text-xs font-bold uppercase tracking-wider self-start sm:self-auto">
                    Đã hết suất Giờ Vàng
                  </span>
                )}
              </div>

              {isFlashSaleActive && effectiveProduct?.flashSaleMeta && (
                <div className="pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-danger">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-danger animate-pulse" />
                      <span>Đã bán: {effectiveProduct.flashSaleMeta.soldCount}/{effectiveProduct.flashSaleMeta.quantityLimit} suất</span>
                    </div>
                    {timeLeft && (
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Kết thúc sau: {timeLeft}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full h-2 bg-danger-pastel/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-danger rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(5, Math.round(((effectiveProduct.flashSaleMeta.soldCount || 0) / (effectiveProduct.flashSaleMeta.quantityLimit || 1)) * 100)))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Brief Description */}
            <div className="text-xs sm:text-sm text-muted leading-relaxed mb-6">
              <p>
                {product.description ||
                  "Sản phẩm tiện lợi chất lượng cao của chuỗi cửa hàng CSM, chuẩn vệ sinh an toàn thực phẩm, luôn sẵn sàng phục vụ 24/7."}
              </p>
            </div>

            {/* 3 Value Commitments */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-surface-soft border border-border/60 text-[11px] text-muted mb-6">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-accent" />
                <span>Giao 30 phút</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>100% Tươi ngon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-info-dark" />
                <span>Phục vụ 24/7</span>
              </div>
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
                  aria-label="Giảm số lượng"
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
                  aria-label="Tăng số lượng"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <Button
                size="lg"
                variant="outline"
                className={`flex-1 text-xs sm:text-sm h-12 rounded-2xl shadow-sm gap-2 font-bold ${
                  isOutOfStock ? "opacity-50 cursor-not-allowed bg-surface-soft text-muted border border-border" : ""
                }`}
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? "Tạm hết hàng" : "Thêm vào giỏ"}</span>
              </Button>

              {/* Buy Now Button */}
              <Button
                size="lg"
                className="flex-1 text-xs sm:text-sm h-12 rounded-2xl shadow-sm gap-2 font-bold"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
              >
                <Zap className="w-4 h-4" />
                <span>Mua ngay</span>
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

      {/* ================= DETAILED TABS SECTION ================= */}
      <div className="bg-surface rounded-3xl border border-border shadow-card p-6 sm:p-8 space-y-6">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-border/80 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("description")}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "description"
                ? "bg-primary text-white shadow-xs"
                : "text-muted hover:bg-surface-soft hover:text-foreground"
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Mô tả & Nguồn gốc</span>
          </button>
          <button
            onClick={() => setActiveTab("nutrition")}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "nutrition"
                ? "bg-primary text-white shadow-xs"
                : "text-muted hover:bg-surface-soft hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Dinh dưỡng & Thành phần</span>
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "storage"
                ? "bg-primary text-white shadow-xs"
                : "text-muted hover:bg-surface-soft hover:text-foreground"
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Bảo quản & Sử dụng</span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "description" && (
            <motion.div
              key="desc"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 text-xs sm:text-sm leading-relaxed text-muted"
            >
              <h3 className="font-bold text-foreground text-base">Thông Tin Chi Tiết Sản Phẩm</h3>
              <p>
                {product.description ||
                  "Sản phẩm được tuyển chọn nghiêm ngặt theo tiêu chuẩn an toàn thực phẩm quốc tế. Quy trình kiểm định khép kín từ khâu tiếp nhận nguyên liệu đến lưu trữ tại hệ thống tủ mát đạt chuẩn tại các cửa hàng CSM trên toàn hệ thống."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70">
                  <span className="block text-[11px] text-muted">Xuất xứ:</span>
                  <span className="font-bold text-foreground">{mockDefaultProductExtra.origin}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70">
                  <span className="block text-[11px] text-muted">Thương hiệu:</span>
                  <span className="font-bold text-foreground">{mockDefaultProductExtra.brand}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70">
                  <span className="block text-[11px] text-muted">Nhà sản xuất:</span>
                  <span className="font-bold text-foreground">{mockDefaultProductExtra.manufacturer}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70">
                  <span className="block text-[11px] text-muted">Chứng nhận tiêu chuẩn:</span>
                  <span className="font-bold text-foreground">{mockDefaultProductExtra.certification}</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "nutrition" && (
            <motion.div
              key="nutr"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <h3 className="font-bold text-foreground text-base">
                Giá Trị Dinh Dưỡng ({mockDefaultProductExtra.servingSize})
              </h3>
              {/* Nutrition grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70 text-center">
                  <span className="block text-[11px] text-muted">Năng lượng</span>
                  <span className="font-black text-foreground text-base text-primary-dark">
                    {mockDefaultProductExtra.calories}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70 text-center">
                  <span className="block text-[11px] text-muted">Chất đạm (Protein)</span>
                  <span className="font-black text-foreground text-base">
                    {mockDefaultProductExtra.protein}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70 text-center">
                  <span className="block text-[11px] text-muted">Carbohydrate</span>
                  <span className="font-black text-foreground text-base">
                    {mockDefaultProductExtra.carbs}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70 text-center">
                  <span className="block text-[11px] text-muted">Chất béo (Fat)</span>
                  <span className="font-black text-foreground text-base">
                    {mockDefaultProductExtra.fat}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70 text-center">
                  <span className="block text-[11px] text-muted">Natri (Sodium)</span>
                  <span className="font-black text-foreground text-base">
                    {mockDefaultProductExtra.sodium}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/70 text-center">
                  <span className="block text-[11px] text-muted">Đường (Sugar)</span>
                  <span className="font-black text-foreground text-base">
                    {mockDefaultProductExtra.sugar}
                  </span>
                </div>
              </div>

              {/* Ingredients list */}
              <div className="pt-3">
                <h4 className="font-bold text-foreground mb-2">Thành phần nguyên liệu:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted text-xs sm:text-sm">
                  {mockDefaultProductExtra.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {activeTab === "storage" && (
            <motion.div
              key="storage"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 text-xs sm:text-sm text-muted"
            >
              <h3 className="font-bold text-foreground text-base">Hướng Dẫn Bảo Quản & Hướng Dẫn Sử Dụng</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-surface-soft border border-border/70 space-y-2">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Điều kiện bảo quản khuyến nghị:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                    {mockDefaultProductExtra.storageInstructions.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-surface-soft border border-border/70 space-y-2">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    Cách thức sử dụng:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                    {mockDefaultProductExtra.usageInstructions.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================= BRANCH INVENTORY CHECK (Mission 3 Core Requirement) ================= */}
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

      {/* ================= RELATED PRODUCTS ================= */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-accent" />
                Gợi ý cho bạn
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Sản Phẩm Cùng Danh Mục
              </h2>
            </div>
            <Button variant="outline" asChild className="rounded-2xl text-xs font-semibold">
              <Link to={`/products?category=${product.category?.id}`}>
                Xem thêm trong danh mục
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((relatedProd) => (
              <ProductCard
                key={relatedProd.id}
                product={relatedProd}
                branchName={selectedBranch?.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

