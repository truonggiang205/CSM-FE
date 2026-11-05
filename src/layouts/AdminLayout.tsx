import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Quản lý sản phẩm", href: "/admin/products", icon: Package },
    { name: "Quản lý tồn kho", href: "/admin/inventory", icon: Store },
    { name: "Đơn hàng", href: "/admin/orders", icon: ShoppingBag },
    { name: "Quản lý người dùng", href: "/admin/customers", icon: Users },
    { name: "Cài đặt", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-x-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col shadow-[2px_0_12px_rgba(78,159,118,0.03)] shrink-0 h-screen sticky top-0 z-30">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-lg text-foreground">
            <span className="w-8 h-8 rounded-xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary text-sm shadow-xs">
              🌱
            </span>
            <span>CSM <span className="text-primary font-black">Admin</span></span>
          </Link>
        </div>

        <div className="px-4 pt-4 pb-2 shrink-0">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium text-primary-dark bg-primary-tint/60 hover:bg-primary-tint rounded-xl border border-primary/20 transition-all shadow-2xs"
          >
            &larr; Về cửa hàng chính
          </Link>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto" aria-label="Menu quản trị máy tính">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-tint text-primary-dark font-bold border border-primary/25 shadow-sm"
                    : "text-muted hover:bg-surface-soft hover:text-foreground border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary-dark" : "text-muted"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-border space-y-3 shrink-0 bg-surface">
          <div className="p-3 rounded-2xl bg-surface-soft border border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary font-bold text-xs">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate">{user?.email || "Quản trị viên"}</span>
                <span className="text-[10px] font-semibold text-primary-dark">{user?.role}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-semibold text-danger-dark bg-danger-pastel/70 hover:bg-danger-pastel border border-danger/25 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header Mobile */}
        <header className="h-16 bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:hidden sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-foreground hover:bg-surface-soft min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label={isMobileMenuOpen ? "Đóng menu quản trị" : "Mở menu quản trị"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-base text-foreground flex items-center gap-1.5">
              <span>🌱</span>
              <span>CSM <span className="text-primary font-black">Admin</span></span>
            </span>
          </div>

          <Link
            to="/"
            className="text-xs font-semibold text-primary-dark hover:text-primary bg-primary-tint/60 px-2.5 py-1.5 rounded-xl border border-primary/20 flex items-center gap-1"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Về cửa hàng</span>
          </Link>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative w-[280px] max-w-[85vw] bg-surface h-full shadow-2xl flex flex-col z-10 border-r border-border"
              >
                <div className="h-16 px-4 border-b border-border flex items-center justify-between">
                  <span className="font-bold text-base text-foreground flex items-center gap-1.5">
                    <span>🌱</span>
                    <span>CSM <span className="text-primary font-black">Admin</span></span>
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft min-h-[40px] min-w-[40px] flex items-center justify-center"
                    aria-label="Đóng menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-4 pt-3 pb-1">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-primary-dark bg-primary-tint/60 hover:bg-primary-tint rounded-xl border border-primary/20 transition-all"
                  >
                    <Store className="w-3.5 h-3.5" />
                    Về cửa hàng mua sắm
                  </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Menu quản trị di động">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-primary-tint text-primary-dark font-bold border border-primary/25 shadow-xs"
                            : "text-muted hover:bg-surface-soft hover:text-foreground"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-primary-dark" : "text-muted"}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-border space-y-3 bg-surface-soft/40 shrink-0">
                  <div className="p-3 rounded-2xl bg-surface border border-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-tint text-primary-dark font-bold flex items-center justify-center text-xs border border-primary/20">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-foreground">{user?.email}</p>
                        <p className="text-[10px] text-muted">{user?.role} {user?.branch_id ? `(${user.branch_id})` : ""}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      window.location.href = "/";
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-semibold text-danger-dark bg-danger-pastel/70 hover:bg-danger-pastel border border-danger/25 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Content Body */}
        <div className="flex-1 overflow-auto bg-background p-4 sm:p-6 md:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full flex-1"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
