import { Plus, Search } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý kho hàng</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nhập hàng mới
        </Button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input placeholder="Tìm theo tên sản phẩm, mã SKU..." className="pl-9 w-full" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <option value="">Tất cả danh mục</option>
            <option value="drink">Đồ uống</option>
            <option value="food">Thức ăn nhanh</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-neutral-50 border-b border-border">
              <tr>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Mã SKU</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4 text-right">Tồn kho</th>
                <th className="px-6 py-4 text-right">Giá bán</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Nước khoáng Lavie 500ml", sku: "DRK-LV-500", cat: "Đồ uống", stock: 150, price: 5000 },
                { name: "Bánh mì kẹp thịt", sku: "FOD-BM-01", cat: "Thức ăn", stock: 5, price: 25000 },
                { name: "Mì ly Modern", sku: "FOD-MI-MD", cat: "Thức ăn", stock: 0, price: 9000 },
              ].map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-neutral-100 flex-shrink-0" />
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-muted">{item.sku}</td>
                  <td className="px-6 py-4">{item.cat}</td>
                  <td className={`px-6 py-4 text-right font-medium ${item.stock <= 5 ? (item.stock === 0 ? "text-danger" : "text-warning") : ""}`}>
                    {item.stock}
                  </td>
                  <td className="px-6 py-4 text-right">{item.price.toLocaleString('vi-VN')}đ</td>
                  <td className="px-6 py-4 text-center">
                    {item.stock > 10 ? (
                      <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-semibold">Còn hàng</span>
                    ) : item.stock > 0 ? (
                      <span className="px-2 py-1 bg-warning/10 text-warning rounded-full text-xs font-semibold">Sắp hết</span>
                    ) : (
                      <span className="px-2 py-1 bg-danger/10 text-danger rounded-full text-xs font-semibold">Hết hàng</span>
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
