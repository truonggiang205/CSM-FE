import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export function OrderListPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const statuses = [
    { id: "ALL", label: "Tất cả" },
    { id: "PENDING", label: "Chờ xử lý" },
    { id: "PROCESSING", label: "Đang chuẩn bị" },
    { id: "SHIPPING", label: "Đang giao" },
    { id: "COMPLETED", label: "Hoàn tất" },
    { id: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý đơn hàng</h1>
        <Button>Tạo đơn hàng mới</Button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input placeholder="Tìm mã đơn hàng, tên khách hàng..." className="pl-9 w-full" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {statuses.map((s) => (
            <Button
              key={s.id}
              variant={statusFilter === s.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s.id)}
              className="whitespace-nowrap"
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-neutral-50 border-b border-border">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Ngày đặt</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">#ORD-2023{100 + i}</td>
                  <td className="px-6 py-4">Nguyễn Văn {String.fromCharCode(64 + i)}<br/><span className="text-muted text-xs">090123456{i}</span></td>
                  <td className="px-6 py-4">12/10/2023 14:30</td>
                  <td className="px-6 py-4 font-medium">{(250000 + i * 50000).toLocaleString('vi-VN')}đ</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-warning/10 text-warning rounded-full text-xs font-semibold">
                      Chờ xử lý
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted">
          <span>Hiển thị 1-6 trên tổng số 45 đơn hàng</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Trước</Button>
            <Button variant="outline" size="sm">Sau</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
