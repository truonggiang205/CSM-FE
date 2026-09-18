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
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý đơn hàng</h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">Theo dõi và xử lý đơn đặt hàng trực tuyến của hệ thống.</p>
        </div>
        <Button className="shadow-sm">
          Tạo đơn hàng mới
        </Button>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-4 shadow-card flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input placeholder="Tìm mã đơn, tên người nhận..." className="pl-9.5 w-full" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === s.id
                  ? "bg-primary-tint text-primary-dark font-semibold border border-primary/25 shadow-sm"
                  : "bg-surface-soft hover:bg-surface text-muted hover:text-foreground border border-border/80"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-muted uppercase bg-surface-soft border-b border-border">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[
                { status: "Chờ xử lý", badge: "bg-warning-pastel text-warning-dark border-warning/25" },
                { status: "Đang giao", badge: "bg-info-pastel text-info-dark border-info/25" },
                { status: "Hoàn tất", badge: "bg-success-pastel text-success-dark border-success/25" },
                { status: "Chờ xử lý", badge: "bg-warning-pastel text-warning-dark border-warning/25" },
                { status: "Hoàn tất", badge: "bg-success-pastel text-success-dark border-success/25" },
                { status: "Đã hủy", badge: "bg-danger-pastel text-danger-dark border-danger/25" },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-surface-soft/60 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">#CSM-2026{100 + i}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">Nguyễn Văn {String.fromCharCode(64 + i + 1)}</span>
                    <br/>
                    <span className="text-muted text-xs">090123456{i}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">12/10/2026 14:30</td>
                  <td className="px-6 py-4 font-bold text-primary-dark">{(250000 + i * 50000).toLocaleString('vi-VN')}đ</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${item.badge}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-primary-dark hover:text-primary hover:bg-primary-tint">
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted">
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
