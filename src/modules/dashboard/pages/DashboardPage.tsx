import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import { Card } from "../../../components/ui/Card";

export function DashboardPage() {
  const stats = [
    { name: "Tổng doanh thu", value: "24.5M ₫", icon: DollarSign, trend: "+12%" },
    { name: "Đơn hàng mới", value: "156", icon: ShoppingBag, trend: "+8%" },
    { name: "Sản phẩm tồn kho", value: "8,432", icon: Package, trend: "-2%" },
    { name: "Khách hàng", value: "1,204", icon: Users, trend: "+18%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted">Tổng quan tình hình kinh doanh hôm nay.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend.startsWith("+");
          return (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted">{stat.name}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`font-medium ${isPositive ? "text-success" : "text-danger"}`}>
                  {stat.trend}
                </span>
                <span className="text-muted ml-2">so với hôm qua</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 min-h-[400px] flex flex-col">
          <h3 className="font-semibold mb-4">Doanh thu 7 ngày qua</h3>
          <div className="flex-1 bg-neutral-100 rounded-lg flex items-center justify-center text-muted">
            [Biểu đồ doanh thu Recharts Placeholder]
          </div>
        </Card>
        <Card className="p-6 min-h-[400px] flex flex-col">
          <h3 className="font-semibold mb-4">Đơn hàng gần đây</h3>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted uppercase bg-neutral-50">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3 font-medium">#ORD-{1000 + i}</td>
                    <td className="px-4 py-3">Nguyễn Văn {String.fromCharCode(64 + i)}</td>
                    <td className="px-4 py-3">{(125 * i).toLocaleString()}đ</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
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
