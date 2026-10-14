import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  AlertCircle,
  MapPin,
  ChevronDown,
  LayoutGrid,
  List,
  X,
  Check,
  Filter,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { QuickViewModal } from "../components/QuickViewModal";
import { productApi } from "../../../api/productApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { useBranchStore } from "../../../store/useBranchStore";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Product } from "../../../types/product";

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc";
type PriceRangeOption = "all" | "under-50k" | "50k-100k" | "100k-200k" | "above-200k";

const ITEMS_PER_PAGE = 8;

const PRICE_RANGES: { id: PriceRangeOption; label: string }[] = [
  { id: "all", label: "Tất cả mức giá" },
  { id: "under-50k", label: "Dưới 50.000₫" },
  { id: "50k-100k", label: "50.000₫ - 100.000₫" },
  { id: "100k-200k", label: "100.000₫ - 200.000₫" },
  { id: "above-200k", label: "Trên 200.000₫" },
];

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get("category");
  const urlQuery = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(urlQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const [priceRange, setPriceRange] = useState<PriceRangeOption>("all");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const { selectedBranch, openModal } = useBranchStore();
  const shouldReduceMotion = useReducedMotion();

  // Đồng bộ search input khi param `q` trên URL thay đổi từ Header
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchInput(q);
    setDebouncedSearch(q);
  }, [searchParams]);

  // Debounce search query 300ms và đồng bộ lên URL searchParams
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setVisibleCount(ITEMS_PER_PAGE);

      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const currentQ = next.get("q") || "";
        const targetQ = searchInput.trim();
        if (currentQ !== targetQ) {
          if (targetQ) {
            next.set("q", targetQ);
          } else {
            next.delete("q");
          }
          return next;
        }
        return prev;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  // Đồng bộ category từ URL param
  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    } else {
      setSelectedCategory(null);
    }
  }, [urlCategory]);

  // 1. Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: productApi.getCategories,
  });

  // 2. Fetch products
  const {
    data: products = [],
    isLoading: isLoadingProducts,
    isError: isErrorProducts,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getProducts,
  });

  // 3. Fetch inventory for selected branch
  const { data: branchInventory = [] } = useQuery({
    queryKey: ["inventory", "branch", selectedBranch?.id],
    queryFn: () => inventoryApi.getInventoryByBranch(selectedBranch!.id),
    enabled: !!selectedBranch?.id,
  });

  // Tạo Map product_id -> availableStock để tra cứu O(1)
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    branchInventory.forEach((item) => {
      map.set(item.product_id, item.available ?? (item.quantity - item.reserved_quantity));
    });
    return map;
  }, [branchInventory]);

  // Lọc và sắp xếp sản phẩm đa tiêu chí
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      // 1. Search text
      const matchesSearch =
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(debouncedSearch.toLowerCase()));

      // 2. Category
      const matchesCategory = selectedCategory ? product.category.id === selectedCategory : true;

      // 3. Price range
      const effectivePrice = product.discountPrice || product.price;
      let matchesPrice = true;
      if (priceRange === "under-50k") {
        matchesPrice = effectivePrice < 50000;
      } else if (priceRange === "50k-100k") {
        matchesPrice = effectivePrice >= 50000 && effectivePrice <= 100000;
      } else if (priceRange === "100k-200k") {
        matchesPrice = effectivePrice >= 100000 && effectivePrice <= 200000;
      } else if (priceRange === "above-200k") {
        matchesPrice = effectivePrice > 200000;
      }

      // 4. In stock
      const available = stockMap.get(product.id) ?? product.stock;
      const matchesInStock = onlyInStock ? available > 0 : true;

      return matchesSearch && matchesCategory && matchesPrice && matchesInStock;
    });

    // Sắp xếp
    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === "name-asc") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }

    return result;
  }, [products, debouncedSearch, selectedCategory, priceRange, onlyInStock, stockMap, sortBy]);

  // Phân trang
  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  // Tính số bộ lọc đang áp dụng
  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (priceRange !== "all" ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (debouncedSearch ? 1 : 0);

  const handleCategorySelect = (catId: string | null) => {
    setSelectedCategory(catId);
    setVisibleCount(ITEMS_PER_PAGE);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (catId) {
        next.set("category", catId);
      } else {
        next.delete("category");
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategory(null);
    setPriceRange("all");
    setOnlyInStock(false);
    setSortBy("default");
    setVisibleCount(ITEMS_PER_PAGE);
    setSearchParams({});
    setIsMobileFilterOpen(false);
  };

  const isLoading = isLoadingCategories || isLoadingProducts;

  // Nội dung bộ lọc dùng chung cho cả Sidebar Desktop và Drawer Mobile
  const filterControls = (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-primary" />
          Tìm kiếm
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            type="text"
            placeholder="Tên hoặc mã SKU..."
            className="pl-9 rounded-2xl bg-surface-soft text-xs"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Khoảng giá */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5 flex items-center justify-between">
          <span>Khoảng giá</span>
          {priceRange !== "all" && (
            <button
              onClick={() => setPriceRange("all")}
              className="text-[10px] text-primary hover:underline font-normal"
            >
              Đặt lại
            </button>
          )}
        </h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isSelected = priceRange === range.id;
            return (
              <button
                key={range.id}
                onClick={() => setPriceRange(range.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                  isSelected
                    ? "bg-primary-tint text-primary-dark font-bold border border-primary/25"
                    : "text-muted hover:bg-surface-soft hover:text-foreground"
                }`}
              >
                <span>{range.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tình trạng kho */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
          Tình trạng hàng
        </h3>
        <label className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-surface-soft border border-border/60 cursor-pointer hover:bg-surface-soft/80 transition-colors">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer"
          />
          <span className="text-xs font-semibold text-foreground">
            Chỉ xem sản phẩm còn hàng
          </span>
        </label>
      </div>

      {/* Danh mục */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5 flex items-center justify-between">
          <span>Danh mục hàng</span>
          {selectedCategory && (
            <button
              onClick={() => handleCategorySelect(null)}
              className="text-[10px] text-primary hover:underline font-normal"
            >
              Xem tất cả
            </button>
          )}
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => handleCategorySelect(null)}
              className={`text-xs w-full text-left px-3 py-2 rounded-xl transition-all ${
                selectedCategory === null
                  ? "bg-primary-tint text-primary-dark font-bold border border-primary/25 shadow-xs"
                  : "text-muted hover:bg-surface-soft hover:text-foreground"
              }`}
            >
              Tất cả danh mục ({products.length})
            </button>
          </li>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category.id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <li key={cat.id}>
                <button
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`text-xs w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-primary-tint text-primary-dark font-bold border border-primary/25 shadow-xs"
                      : "text-muted hover:bg-surface-soft hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] opacity-70 ml-2">({count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Reset button */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetFilters}
          className="w-full rounded-2xl gap-1.5 text-xs font-semibold text-danger hover:text-danger hover:bg-danger-pastel/40 border-danger/25"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Xoá tất cả bộ lọc ({activeFilterCount})</span>
        </Button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ================= DESKTOP SIDEBAR FILTERS ================= */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-surface p-5 rounded-3xl border border-border shadow-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/80">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Bộ lọc tìm kiếm
              </span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {filterControls}
          </div>
        </aside>

        {/* ================= MAIN PRODUCT AREA ================= */}
        <main className="flex-1 min-w-0">
          {/* Top Controls: Title, Mobile filter button, View toggle & Sort */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name || "Danh mục đã chọn"
                  : "Tất cả sản phẩm"}
              </h1>
              <p className="text-xs text-muted mt-1">
                Hiển thị {displayedProducts.length} trên tổng số {filteredProducts.length} sản phẩm
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden rounded-2xl gap-2 text-xs font-semibold bg-surface border-border shadow-xs"
              >
                <Filter className="w-3.5 h-3.5 text-primary" />
                <span>Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* View Mode Toggle (Grid / List) */}
              <div className="flex items-center bg-surface-soft p-1 rounded-2xl border border-border/80 shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewMode === "grid"
                      ? "bg-surface text-primary shadow-xs font-bold"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="Chế độ hiển thị dạng lưới"
                  aria-label="Chế độ hiển thị dạng lưới"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-xl transition-all ${
                    viewMode === "list"
                      ? "bg-surface text-primary shadow-xs font-bold"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="Chế độ hiển thị danh sách"
                  aria-label="Chế độ hiển thị danh sách"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none pl-3.5 pr-8 py-2 rounded-2xl border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer shadow-xs"
                >
                  <option value="default">Sắp xếp: Mặc định</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="name-asc">Tên: A-Z</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active filter badges strip */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs text-muted font-medium">Đang lọc:</span>
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface border border-border text-xs text-foreground shadow-xs">
                  Từ khoá: &ldquo;{debouncedSearch}&rdquo;
                  <button onClick={() => setSearchInput("")} className="hover:text-danger">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface border border-border text-xs text-foreground shadow-xs">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={() => handleCategorySelect(null)} className="hover:text-danger">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {priceRange !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface border border-border text-xs text-foreground shadow-xs">
                  {PRICE_RANGES.find((r) => r.id === priceRange)?.label}
                  <button onClick={() => setPriceRange("all")} className="hover:text-danger">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {onlyInStock && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface border border-border text-xs text-foreground shadow-xs">
                  Còn hàng
                  <button onClick={() => setOnlyInStock(false)} className="hover:text-danger">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-danger font-semibold hover:underline ml-2"
              >
                Xoá tất cả
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                  : "space-y-4"
              }
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="rounded-3xl border border-border bg-surface p-4 space-y-4">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                  <div className="pt-2 flex justify-between items-center">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : isErrorProducts ? (
            /* Error State */
            <div className="text-center py-16 bg-surface rounded-3xl border border-danger/25 p-8 shadow-card">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-danger-pastel flex items-center justify-center text-danger-dark">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Không thể tải danh sách sản phẩm</h3>
              <p className="text-xs text-muted max-w-sm mx-auto mb-6">
                Đã xảy ra lỗi khi kết nối tới Product Service. Vui lòng thử lại.
              </p>
              <Button onClick={() => refetchProducts()} className="rounded-2xl gap-2 shadow-sm">
                <RotateCcw className="w-4 h-4" />
                Thử lại ngay
              </Button>
            </div>
          ) : filteredProducts.length > 0 ? (
            /* Product Content */
            <>
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch"
                    : "flex flex-col gap-4"
                }
              >
                {displayedProducts.map((product) => {
                  const availableStock = stockMap.get(product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      availableStock={availableStock}
                      branchName={selectedBranch?.name}
                      viewMode={viewMode}
                      onQuickView={(p) => setQuickViewProduct(p)}
                    />
                  );
                })}
              </motion.div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-10 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                    className="rounded-2xl px-8 bg-surface hover:bg-primary-tint/50 border-primary/30 text-primary-dark font-semibold shadow-xs text-xs sm:text-sm"
                  >
                    Xem thêm sản phẩm (còn {filteredProducts.length - visibleCount} món)
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-20 bg-surface rounded-3xl border border-border shadow-card p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-primary-tint/70 flex items-center justify-center text-3xl shadow-xs">
                🔍
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Không tìm thấy sản phẩm nào</h3>
              <p className="text-xs text-muted max-w-xs mx-auto mb-6">
                Không có sản phẩm nào phù hợp với các tiêu chí bộ lọc đã chọn. Hãy thử nới lỏng bộ lọc.
              </p>
              <Button
                variant="soft"
                onClick={handleResetFilters}
                className="rounded-2xl gap-2 font-semibold shadow-xs text-xs"
              >
                <RotateCcw className="w-4 h-4" />
                Đặt lại bộ lọc
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* ================= MOBILE FILTER DRAWER ================= */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative ml-auto w-full max-w-xs bg-surface h-full shadow-2xl z-10 flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  Bộ lọc sản phẩm
                </span>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-soft flex items-center justify-center text-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1">
                {filterControls}
              </div>

              <div className="p-4 border-t border-border bg-surface-soft flex gap-2">
                <Button
                  className="w-full rounded-2xl text-xs font-bold"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  Áp dụng ({filteredProducts.length} sản phẩm)
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= QUICK VIEW MODAL ================= */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        availableStock={quickViewProduct ? stockMap.get(quickViewProduct.id) : undefined}
        branchName={selectedBranch?.name}
      />
    </div>
  );
}

