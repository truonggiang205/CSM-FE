import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, RotateCcw, AlertCircle, MapPin, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { productApi } from "../../../api/productApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { useBranchStore } from "../../../store/useBranchStore";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc";

const ITEMS_PER_PAGE = 8;

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get("category");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const { selectedBranch, openModal } = useBranchStore();

  // Debounce search query 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setVisibleCount(ITEMS_PER_PAGE); // reset pagination on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync category from URL param
  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory);
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

  // 3. Fetch inventory for selected branch (Gọi duy nhất 1 lần cho cả trang)
  const { data: branchInventory = [], isLoading: isLoadingInventory } = useQuery({
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

  // Lọc và sắp xếp sản phẩm
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const matchesCategory = selectedCategory ? product.category.id === selectedCategory : true;
      return matchesSearch && matchesCategory;
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
  }, [products, debouncedSearch, selectedCategory, sortBy]);

  // Sản phẩm hiển thị theo cơ chế "Tải thêm"
  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleCategorySelect = (catId: string | null) => {
    setSelectedCategory(catId);
    setVisibleCount(ITEMS_PER_PAGE);
    if (catId) {
      setSearchParams({ category: catId });
    } else {
      setSearchParams({});
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategory(null);
    setSortBy("default");
    setVisibleCount(ITEMS_PER_PAGE);
    setSearchParams({});
  };

  const isLoading = isLoadingCategories || isLoadingProducts;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Branch Alert Notice */}
      <div className="mb-6 p-4 rounded-3xl bg-primary-tint/60 border border-primary/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-surface flex items-center justify-center text-primary shadow-xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted">Tồn kho đang hiển thị theo cửa hàng:</p>
            <p className="text-sm font-bold text-foreground">
              {selectedBranch ? selectedBranch.name : "Chưa chọn chi nhánh"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-primary/30 bg-surface text-primary-dark font-semibold h-8"
          onClick={openModal}
        >
          Đổi chi nhánh
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6 bg-surface p-5 sm:p-6 rounded-3xl border border-border shadow-card">
            {/* Search Input */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                Tìm kiếm sản phẩm
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  type="text"
                  placeholder="Tên hoặc mã SKU..."
                  className="pl-9 rounded-2xl bg-surface-soft"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Danh mục hàng hóa
              </h2>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className={`text-sm w-full text-left px-3.5 py-2.5 rounded-2xl transition-all ${
                      selectedCategory === null
                        ? "bg-primary-tint text-primary-dark font-bold border border-primary/25 shadow-xs"
                        : "text-muted hover:bg-surface-soft hover:text-foreground border border-transparent"
                    }`}
                  >
                    Tất cả sản phẩm ({products.length})
                  </button>
                </li>
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category.id === cat.id).length;
                  return (
                    <li key={cat.id}>
                      <button
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`text-sm w-full text-left px-3.5 py-2.5 rounded-2xl transition-all flex items-center justify-between ${
                          selectedCategory === cat.id
                            ? "bg-primary-tint text-primary-dark font-bold border border-primary/25 shadow-xs"
                            : "text-muted hover:bg-surface-soft hover:text-foreground border border-transparent"
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-xs opacity-60 ml-2">({count})</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Product Area */}
        <main className="flex-1 min-w-0">
          {/* Header Controls: Title & Sort */}
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

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-muted font-medium whitespace-nowrap">Sắp xếp:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none pl-3.5 pr-8 py-2 rounded-2xl border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer shadow-xs"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="name-asc">Tên: A-Z</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
            /* Product Grid */
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {displayedProducts.map((product) => {
                  const availableStock = stockMap.get(product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      availableStock={availableStock}
                      branchName={selectedBranch?.name}
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
                    className="rounded-2xl px-8 bg-surface hover:bg-primary-tint/50 border-primary/30 text-primary-dark font-semibold shadow-xs"
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
                Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục hàng hóa khác.
              </p>
              <Button
                variant="soft"
                onClick={handleResetFilters}
                className="rounded-2xl gap-2 font-semibold shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                Đặt lại bộ lọc
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
