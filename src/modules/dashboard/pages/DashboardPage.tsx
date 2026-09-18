import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import { Card } from "../../../components/ui/Card";

export function DashboardPage() {
  const stats = [
    { name: "Tổng doanh thu", value: "24.5M ₫", icon: DollarSign, trend: "+12%", bg: "bg-primary-tint", text: "text-primary-dark", border: "border-primary/20" },
    { name: "Đơn hàng mới", value: "156", icon: ShoppingBag, trend: "+8%", bg: "bg-accent-tint", text: "text-accent-dark", border: "border-accent/20" },
    { name: "Sản phẩm kho", value: "8,432", icon: Package, trend: "-2%", bg: "bg-pastel-sky", text: "text-info-dark", border: "border-info/20" },
    { name: "Khách hàng", value: "1,204", icon: Users, trend: "+18%", bg: "bg-pastel-lavender", text: "text-purple-700", border: "border-purple-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bảng Điều Khiển</h1>
          <p className="text-muted text-sm mt-0.5">Tổng quan kết quả kinh doanh hôm nay của chuỗi cửa hàng.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs text-muted font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Hệ thống hoạt động bình thường
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend.startsWith("+");
          return (
            <Card key={stat.name} className="p-5 border border-border shadow-card hover:shadow-card-hover">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{stat.name}</p>
                  <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} border ${stat.border} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center text-xs">
                <span className={`px-2 py-0.5 rounded-full font-semibold border ${
                  isPositive 
                    ? "bg-success-pastel text-success-dark border-success/25" 
                    : "bg-danger-pastel text-danger-dark border-danger/25"
                }`}>
                  {stat.trend}
                </span>
                <span className="text-muted ml-2">so với ngày hôm qua</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 min-h-[400px] flex flex-col border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-base">Doanh thu 7 ngày qua</h3>
            <span className="text-xs text-primary-dark font-medium bg-primary-tint px-2.5 py-0.5 rounded-full border border-primary/20">
              Cập nhật trực tiếp
            </span>
          </div>
          <div className="flex-1 bg-surface-soft rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-muted p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm font-medium text-foreground">Biểu đồ doanh thu tuần</p>
            <p className="text-xs text-muted mt-1 max-w-xs">Biểu đồ doanh thu Recharts tích hợp xu hướng tăng trưởng theo chuỗi ngày.</p>
          </div>
        </Card>
        
        <Card className="p-6 min-h-[400px] flex flex-col border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-base">Đơn hàng mới nhất</h3>
            <span className="text-xs text-muted">5 đơn gần nhất</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-semibold text-muted uppercase bg-surface-soft rounded-xl">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="px-4 py-3 rounded-r-xl">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">#CSM-{1000 + i}</td>
                    <td className="px-4 py-3.5 text-muted-dark">Nguyễn Văn {String.fromCharCode(64 + i)}</td>
                    <td className="px-4 py-3.5 font-bold text-primary-dark">{(125 * i * 1000).toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 bg-success-pastel text-success-dark border border-success/25 rounded-full text-xs font-semibold">
                        Hoàn tất
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
