import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "../components/ProductCard";
import { productApi } from "../../../api/productApi";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export function ProductListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: productApi.getCategories,
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getProducts,
  });

  // Filter products locally
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? product.category.id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (isLoadingCategories || isLoadingProducts) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-20 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Tìm kiếm</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  type="text"
                  placeholder="Tên sản phẩm..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Danh mục</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      selectedCategory === null ? "bg-primary/10 text-primary font-medium" : "text-muted hover:bg-neutral-100 hover:text-foreground"
                    }`}
                  >
                    Tất cả sản phẩm
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                        selectedCategory === cat.id ? "bg-primary/10 text-primary font-medium" : "text-muted hover:bg-neutral-100 hover:text-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Product Area */}
        <main className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {selectedCategory 
                ? categories.find(c => c.id === selectedCategory)?.name 
                : "Tất cả sản phẩm"}
            </h1>
            <span className="text-muted text-sm">
              Hiển thị {filteredProducts.length} kết quả
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-surface rounded-xl border border-border">
              <p className="text-muted">Không tìm thấy sản phẩm nào phù hợp.</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
