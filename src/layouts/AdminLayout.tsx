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
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col shadow-[2px_0_12px_rgba(78,159,118,0.03)]">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-lg text-foreground">
            <span className="w-8 h-8 rounded-xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary text-sm">
              🌱
            </span>
            <span>CSM <span className="text-primary">Admin</span></span>
          </Link>
        </div>

        <div className="px-4 pt-4 pb-2">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium text-primary-dark bg-primary-tint/60 hover:bg-primary-tint rounded-xl border border-primary/20 transition-all"
          >
            &larr; Về cửa hàng chính
          </Link>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-tint text-primary-dark font-semibold border border-primary/25 shadow-sm"
                    : "text-muted hover:bg-surface-soft hover:text-foreground border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary-dark" : "text-muted"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-surface-soft border border-border/60">
            <div className="w-9 h-9 rounded-xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{user?.name || "Quản trị viên"}</span>
              <span className="text-[11px] text-muted">{user?.role || "SYSTEM ADMIN"}</span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-semibold text-danger-dark bg-danger-pastel/70 hover:bg-danger-pastel border border-danger/25 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between px-6 md:hidden">
          <span className="font-bold text-lg text-primary">CSM Admin</span>
          <Link to="/" className="text-xs text-muted underline">Về cửa hàng</Link>
        </header>
        <div className="flex-1 overflow-auto bg-background p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
