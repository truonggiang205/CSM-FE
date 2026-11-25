import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Compass, Wallet, ShoppingCart, Package, ArrowRight } from "lucide-react";
import { productApi } from "../../../api/productApi";
import { comboApi } from "../../../api/comboApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { useBranchStore } from "../../../store/useBranchStore";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { ProductCard } from "../../products/components/ProductCard";
import { Button } from "../../../components/ui/Button";

type MoodId = "all" | "breakfast" | "lunch" | "afternoon" | "late-night" | "movie";
type BudgetId = "all" | "30k" | "50k" | "100k";

const MOODS: Array<{ id: MoodId; label: string; emoji: string; keywords: string[] }> = [
  { id: "all", label: "Tất cả gợi ý", emoji: "✨", keywords: [] },
  { id: "breakfast", label: "Bữa sáng vội", emoji: "☀️", keywords: ["bánh mì", "cà phê", "sữa", "sandwich", "bánh bao"] },
  { id: "lunch", label: "Bữa trưa gọn", emoji: "🍱", keywords: ["mì", "cơm", "bánh mì", "trà", "nước"] },
  { id: "afternoon", label: "Xế chiều giải khát", emoji: "🧋", keywords: ["trà sữa", "trà", "cà phê", "nước", "sữa"] },
  { id: "late-night", label: "Cú đêm 24/7", emoji: "🌙", keywords: ["mì", "xúc xích", "snack", "tăng lực", "cà phê"] },
  { id: "movie", label: "Xem phim & Ăn vặt", emoji: "🎬", keywords: ["snack", "khoai tây", "bắp", "coca", "bánh", "nước"] },
];

const BUDGETS: Array<{ id: BudgetId; label: string; max: number | null }> = [
  { id: "all", label: "Mọi mức giá", max: null },
  { id: "30k", label: "Dưới 30.000₫", max: 30000 },
  { id: "50k", label: "Dưới 50.000₫", max: 50000 },
  { id: "100k", label: "Dưới 100.000₫", max: 100000 },
];

export function ExplorePage() {
  const { selectedBranch } = useBranchStore();
  const { addCombo } = useCartStore();
  const { showToast } = useCartToastStore();

  const [selectedMood, setSelectedMood] = useState<MoodId>("all");
  const [selectedBudget, setSelectedBudget] = useState<BudgetId>("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getProducts(),
  });

  const { data: combos = [] } = useQuery({
    queryKey: ["public-combos"],
    queryFn: comboApi.getPublicCombos,
  });

  const activeBranchId = selectedBranch?.id || "br-01";
  const { data: branchInventory = [] } = useQuery({
    queryKey: ["inventory", "branch", activeBranchId],
    queryFn: () => inventoryApi.getInventoryByBranch(activeBranchId),
    enabled: !!activeBranchId,
  });

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    branchInventory.forEach((item) => {
      const avail =
        item.available ??
        Math.max(0, (Number(item.quantity) || 0) - (Number(item.reserved_quantity) || 0));
      if (item.product_id) map.set(String(item.product_id), avail);
    });
    return map;
  }, [branchInventory]);

  const activeMood = MOODS.find((m) => m.id === selectedMood) || MOODS[0];
  const activeBudget = BUDGETS.find((b) => b.id === selectedBudget) || BUDGETS[0];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const price = Number(p.discountPrice || p.price);
      if (activeBudget.max !== null && price > activeBudget.max) return false;
      if (activeMood.keywords.length > 0) {
        const text = `${p.name} ${p.description} ${p.category?.name || ""}`.toLowerCase();
        return activeMood.keywords.some((kw) => text.includes(kw));
      }
      return true;
    });
  }, [products, activeMood, activeBudget]);

  const filteredCombos = useMemo(() => {
    return combos.filter((c) => {
      const price = Number(c.combo_price);
      if (activeBudget.max !== null && price > activeBudget.max) return false;
      if (activeMood.keywords.length > 0) {
        const text = `${c.name} ${c.description || ""} ${(c.items || []).map((i) => i.product_name || "").join(" ")}`.toLowerCase();
        return activeMood.keywords.some((kw) => text.includes(kw));
      }
      return true;
    });
  }, [combos, activeMood, activeBudget]);

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="bg-gradient-to-b from-pastel-lavender/40 via-surface to-background border-b border-border/80 pt-8 pb-10">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-tint border border-primary/25 text-xs font-bold text-primary-dark uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                <span>Trạm Khám Phá 24/7</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                Hôm Nay Bạn Muốn Ăn Gì?
              </h1>
              <p className="text-xs sm:text-sm text-muted max-w-2xl">
                Chọn nhanh theo tâm trạng, khung giờ và ngân sách — giao siêu tốc trong 30 phút từ chi nhánh{" "}
                <strong className="text-foreground">{selectedBranch?.name || "gần bạn"}</strong>.
              </p>
            </div>
            <Button variant="outline" asChild className="rounded-2xl text-xs font-semibold shrink-0 self-start">
              <Link to="/products" className="flex items-center gap-1.5">
                <span>Xem toàn bộ thực đơn</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Mood Chips */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Chọn theo nhu cầu</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedMood === m.id
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-surface text-foreground border-border hover:bg-surface-soft"
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Chips */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span>Ngân sách dự kiến</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBudget(b.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedBudget === b.id
                      ? "bg-accent-tint text-accent-dark border-accent/40 font-bold"
                      : "bg-surface text-muted border-border hover:bg-surface-soft"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-7xl pt-8 space-y-12">
        {/* Matching Combos */}
        {filteredCombos.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span>Combo phù hợp ({filteredCombos.length})</span>
              </h2>
              <Link to="/combos" className="text-xs font-bold text-primary hover:underline">
                Xem tất cả combo &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredCombos.map((c) => {
                const orig = Number(c.original_price) || Number(c.combo_price);
                const save = Math.max(0, orig - Number(c.combo_price));
                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-3xl bg-surface border border-border/80 shadow-card flex flex-col justify-between gap-4"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Tiết kiệm {formatVND(save)}
                      </span>
                      <h3 className="font-black text-base text-foreground mt-2">{c.name}</h3>
                      <p className="text-xs text-muted mt-1 line-clamp-2">
                        {(c.items || []).map((i) => `${i.quantity}x ${i.product_name || i.product_id}`).join(" + ")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                      <div>
                        <span className="text-[11px] text-muted line-through block">{formatVND(orig)}</span>
                        <span className="text-lg font-black text-rose-600 font-mono">
                          {formatVND(Number(c.combo_price))}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          addCombo(c, 50, 1);
                          showToast(`Đã thêm ${c.name} vào giỏ hàng`);
                        }}
                        className="rounded-2xl text-xs gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Thêm Combo</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Matching Products */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-foreground">
            Món lẻ gợi ý ({filteredProducts.length})
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 rounded-3xl bg-surface-soft border border-border animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 rounded-3xl bg-surface border border-border text-center text-xs text-muted">
              Không có món nào khớp bộ lọc hiện tại. Hãy thử chọn mức ngân sách hoặc nhu cầu khác.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  availableStock={stockMap.get(product.id)}
                  branchName={selectedBranch?.name}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
