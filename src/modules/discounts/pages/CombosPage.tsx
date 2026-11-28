import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useBranchStore } from "../../../store/useBranchStore";
import { ComboCatalog } from "../components/ComboCatalog";

export function CombosPage() {
  const { selectedBranch } = useBranchStore();

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Banner Header */}
      <div className="bg-gradient-to-b from-pastel-peach/40 via-surface to-background border-b border-border/80 pt-8 pb-10">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl space-y-5">
          <nav className="flex items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Combo Tiết Kiệm</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint border border-accent/25 text-xs font-bold text-accent-dark uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mua Chung Giá Rẻ</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <span>🔥 Combo Siêu Tiết Kiệm CSM</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted max-w-2xl">
                Lựa chọn các set ăn và thức uống được ghép sẵn với mức giá ưu đãi đặc quyền. Tồn kho được kiểm tra trực tiếp tại chi nhánh{" "}
                <strong className="text-foreground">{selectedBranch?.name || "hiện tại"}</strong>.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Reusable Combos Catalog */}
      <div className="container mx-auto px-4 md:px-6 max-w-7xl pt-8">
        <ComboCatalog showSearchBar />
      </div>
    </div>
  );
}
