import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Sản phẩm", href: "/admin/products", icon: Package },
    { name: "Đơn hàng", href: "/admin/orders", icon: ShoppingBag },
    { name: "Khách hàng", href: "/admin/customers", icon: Users },
    { name: "Cài đặt", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/admin" className="font-bold text-xl text-primary">
            CSM Admin
          </Link>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-neutral-100 hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.name || "Admin"}</span>
              <span className="text-xs text-muted">{user?.role || "ADMIN"}</span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-surface border-b border-border flex items-center px-6 md:hidden">
          <span className="font-bold text-xl text-primary">CSM Admin</span>
        </header>
        <div className="flex-1 overflow-auto bg-neutral-50/50 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
