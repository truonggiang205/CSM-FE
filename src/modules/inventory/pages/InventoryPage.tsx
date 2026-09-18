import { Plus, Search } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý kho hàng</h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">Kiểm soát lượng tồn kho và định giá các sản phẩm tiện lợi.</p>
        </div>
        <Button className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Nhập hàng mới
        </Button>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-4 shadow-card flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input placeholder="Tìm theo tên sản phẩm, SKU..." className="pl-9.5 w-full" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="flex h-10 w-full items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="">Tất cả danh mục</option>
            <option value="drink">Đồ uống giải khát</option>
            <option value="food">Thức ăn nhanh & Snack</option>
            <option value="daily">Đồ dùng thiết yếu</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-muted uppercase bg-surface-soft border-b border-border">
              <tr>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Mã SKU</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4 text-right">Tồn kho</th>
                <th className="px-6 py-4 text-right">Giá bán</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[
                { name: "Nước khoáng thiên nhiên 500ml", emoji: "💧", sku: "DRK-LV-500", cat: "Đồ uống", stock: 150, price: 5000 },
                { name: "Bánh mì kẹp thịt tươi", emoji: "🥖", sku: "FOD-BM-01", cat: "Thức ăn nhanh", stock: 5, price: 25000 },
                { name: "Mì ly Modern lẩu thái", emoji: "🍜", sku: "FOD-MI-MD", cat: "Thức ăn nhanh", stock: 0, price: 9000 },
                { name: "Cà phê sữa đá đóng lon", emoji: "☕", sku: "DRK-CF-01", cat: "Đồ uống", stock: 80, price: 15000 },
                { name: "Snack khoai tây vị rong biển", emoji: "🥔", sku: "SNK-PT-02", cat: "Bánh kẹo", stock: 3, price: 18000 },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-surface-soft/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-tint/60 border border-primary/20 flex items-center justify-center text-lg flex-shrink-0">
                      {item.emoji}
                    </div>
                    <span>{item.name}</span>
                  </td>
                  <td className="px-6 py-4 text-muted text-xs font-mono">{item.sku}</td>
                  <td className="px-6 py-4 text-muted-dark text-xs">{item.cat}</td>
                  <td className={`px-6 py-4 text-right font-bold ${
                    item.stock <= 5 
                      ? (item.stock === 0 ? "text-danger-dark" : "text-warning-dark") 
                      : "text-foreground"
                  }`}>
                    {item.stock}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-primary-dark">
                    {item.price.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.stock > 10 ? (
                      <span className="px-2.5 py-1 bg-success-pastel text-success-dark border border-success/25 rounded-full text-xs font-semibold">
                        Còn hàng
                      </span>
                    ) : item.stock > 0 ? (
                      <span className="px-2.5 py-1 bg-warning-pastel text-warning-dark border border-warning/25 rounded-full text-xs font-semibold">
                        Sắp hết
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-danger-pastel text-danger-dark border border-danger/25 rounded-full text-xs font-semibold">
                        Hết hàng
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
