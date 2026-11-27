import { useState, useEffect, useMemo } from "react";
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
  Building2,
  Tag,
  ChevronRight,
  Home,
  ShieldCheck,
  UserCheck,
  UserCog,
  LayoutTemplate,
  Zap,
  Layers,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: string[];
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupName: "Tổng quan",
    items: [
      {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        allowedRoles: ["STAFF", "BRANCH_MANAGER", "ADMIN"],
      },
    ],
  },
  {
    groupName: "Bán hàng & Vận hành",
    items: [
      {
        name: "Đơn hàng",
        href: "/admin/orders",
        icon: ShoppingBag,
        allowedRoles: ["STAFF", "BRANCH_MANAGER", "ADMIN"],
      },
      {
        name: "Quản lý tồn kho",
        href: "/admin/inventory",
        icon: Store,
        allowedRoles: ["BRANCH_MANAGER", "ADMIN"],
      },
      {
        name: "Giao diện trang chủ",
        href: "/admin/storefront",
        icon: LayoutTemplate,
        allowedRoles: ["BRANCH_MANAGER", "ADMIN"],
      },
    ],
  },
  {
    groupName: "Quản trị hệ thống",
    items: [
      {
        name: "Quản lý sản phẩm",
        href: "/admin/products",
        icon: Package,
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Khuyến mãi & Voucher",
        href: "/admin/vouchers",
        icon: Tag,
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Quản lý Giờ Vàng",
        href: "/admin/flash-sales",
        icon: Zap,
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Quản lý Combo",
        href: "/admin/combos",
        icon: Layers,
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Quản lý chi nhánh",
        href: "/admin/branches",
        icon: Building2,
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Quản lý người dùng",
        href: "/admin/customers",
        icon: Users,
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Cài đặt",
        href: "/admin/settings",
        icon: Settings,
        allowedRoles: ["ADMIN"],
      },
    ],
  },
];

// Bản đồ tên hiển thị cho Breadcrumb
const BREADCRUMB_MAP: Record<string, { parent?: { title: string; href: string }; title: string }> = {
  "/admin": { title: "Tổng quan hệ thống" },
  "/admin/orders": { parent: { title: "Vận hành", href: "/admin/orders" }, title: "Quản lý đơn hàng" },
  "/admin/inventory": { parent: { title: "Vận hành", href: "/admin/inventory" }, title: "Quản lý tồn kho" },
  "/admin/storefront": { parent: { title: "Vận hành", href: "/admin/storefront" }, title: "Giao diện trang chủ" },
  "/admin/products": { parent: { title: "Hệ thống", href: "/admin/products" }, title: "Quản lý sản phẩm" },
  "/admin/vouchers": { parent: { title: "Hệ thống", href: "/admin/vouchers" }, title: "Quản lý voucher" },
  "/admin/flash-sales": { parent: { title: "Hệ thống", href: "/admin/flash-sales" }, title: "Quản lý Giờ Vàng" },
  "/admin/combos": { parent: { title: "Hệ thống", href: "/admin/combos" }, title: "Quản lý Combo" },
  "/admin/branches": { parent: { title: "Hệ thống", href: "/admin/branches" }, title: "Quản lý chi nhánh" },
  "/admin/customers": { parent: { title: "Hệ thống", href: "/admin/customers" }, title: "Quản lý người dùng" },
  "/admin/settings": { parent: { title: "Hệ thống", href: "/admin/settings" }, title: "Cài đặt cấu hình" },
  "/admin/profile": { parent: { title: "Tài khoản", href: "/admin/profile" }, title: "Hồ sơ của tôi" },
};

function getRoleLabel(role?: string, branchId?: string): { title: string; badge: string } {
  if (role === "ADMIN") {
    return { title: "Quản trị viên toàn chuỗi", badge: "ADMIN" };
  }
  if (role === "BRANCH_MANAGER") {
    return { title: `Quản lý ${branchId ? `chi nhánh ${branchId}` : "chi nhánh"}`, badge: "MANAGER" };
  }
  if (role === "STAFF") {
    return { title: "Nhân viên bán hàng", badge: "STAFF" };
  }
  return { title: "Người dùng", badge: "USER" };
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const userRole = user?.role || "";
  const roleInfo = getRoleLabel(user?.role, user?.branch_id ?? undefined);

  // Lọc menu theo role hiện tại
  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      groupName: group.groupName,
      items: group.items.filter((item) => item.allowedRoles.includes(userRole)),
    })).filter((group) => group.items.length > 0);
  }, [userRole]);

  // Thông tin breadcrumb hiện tại
  const currentBreadcrumb = useMemo(() => {
    const directMatch = BREADCRUMB_MAP[location.pathname];
    if (directMatch) return directMatch;

    // Nếu là subroute (ví dụ /admin/orders/123)
    if (location.pathname.startsWith("/admin/orders/")) {
      return { parent: { title: "Quản lý đơn hàng", href: "/admin/orders" }, title: "Chi tiết đơn hàng" };
    }
    return { title: "Quản trị CSM" };
  }, [location.pathname]);

  const isLinkActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-x-clip">
      {/* Sidebar Desktop: cố định theo viewport, menu tự cuộn riêng khi dài */}
      <aside
        className="w-64 bg-surface border-r border-border hidden md:flex flex-col shadow-[2px_0_12px_rgba(78,159,118,0.03)] h-dvh fixed inset-y-0 left-0 z-30"
        aria-label="Thanh điều hướng quản trị"
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
          <Link
            to="/admin"
            className="flex items-center gap-2 font-bold text-lg text-foreground focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            aria-label="Về trang tổng quan CSM Admin"
          >
            <span className="w-8 h-8 rounded-xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary text-sm shadow-2xs">
              🌱
            </span>
            <span>
              CSM <span className="text-primary font-black">Admin</span>
            </span>
          </Link>
        </div>

        <div className="px-4 pt-3 pb-2 shrink-0">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-semibold text-primary-dark bg-primary-tint/60 hover:bg-primary-tint rounded-xl border border-primary/20 transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Quay lại cửa hàng khách hàng"
          >
            &larr; Về cửa hàng chính
          </Link>
        </div>

        {/* Danh sách menu phân nhóm theo role */}
        <nav
          className="flex-1 px-3 py-2 flex flex-col gap-4 overflow-y-auto"
          aria-label="Menu quản trị máy tính"
        >
          {visibleGroups.map((group) => (
            <div key={group.groupName} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted/80">
                {group.groupName}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = isLinkActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-primary-tint text-primary-dark font-bold border border-primary/25 shadow-2xs"
                          : "text-muted hover:bg-surface-soft hover:text-foreground border border-transparent"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted"}`} />
                        <span>{item.name}</span>
                      </span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Thẻ định danh người dùng và nút đăng xuất */}
        <div className="p-3.5 border-t border-border space-y-2.5 shrink-0 bg-surface">
          <Link
            to="/admin/profile"
            title="Xem và chỉnh sửa hồ sơ của tôi"
            aria-label="Hồ sơ của tôi"
            className={`block p-2.5 rounded-2xl border transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              location.pathname === "/admin/profile"
                ? "bg-primary-tint/60 border-primary/30"
                : "bg-surface-soft border-border/60 hover:border-primary/30 hover:bg-primary-tint/30"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {user?.role === "ADMIN" ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold truncate text-foreground">
                  {user?.fullName || user?.email || "Người vận hành"}
                </span>
                <span className="text-[10px] font-semibold text-primary-dark truncate">
                  {roleInfo.title}
                </span>
              </div>
              <UserCog className="w-3.5 h-3.5 text-muted group-hover:text-primary shrink-0 transition-colors" />
            </div>
          </Link>

          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-semibold text-danger-dark bg-danger-pastel/70 hover:bg-danger-pastel border border-danger/25 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-danger"
            aria-label="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Vùng nội dung chính */}
      <main className="flex-1 min-w-0 md:pl-64 flex flex-col min-h-screen overflow-x-clip">
        {/* Header Mobile */}
        <header className="h-16 bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:hidden sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-foreground hover:bg-surface-soft min-h-[40px] min-w-[40px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={isMobileMenuOpen ? "Đóng menu quản trị" : "Mở menu quản trị"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-base text-foreground flex items-center gap-1.5">
              <span>🌱</span>
              <span>
                CSM <span className="text-primary font-black">Admin</span>
              </span>
            </span>
          </div>

          <Link
            to="/"
            className="text-xs font-semibold text-primary-dark hover:text-primary bg-primary-tint/60 px-2.5 py-1.5 rounded-xl border border-primary/20 flex items-center gap-1"
            aria-label="Quay lại cửa hàng mua sắm"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Về cửa hàng</span>
          </Link>
        </header>

        {/* Thanh Breadcrumb & Role Banner */}
        <div className="bg-surface/50 border-b border-border/80 px-4 sm:px-6 md:px-8 py-2.5 flex items-center justify-between text-xs text-muted">
          <nav aria-label="Thanh điều hướng phân cấp (Breadcrumb)" className="flex items-center gap-1.5 flex-wrap">
            <Link
              to="/admin"
              className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Quản trị</span>
            </Link>
            {currentBreadcrumb.parent && (
              <>
                <ChevronRight className="w-3 h-3 text-muted/60" />
                <Link
                  to={currentBreadcrumb.parent.href}
                  className="hover:text-foreground transition-colors font-medium"
                >
                  {currentBreadcrumb.parent.title}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-muted/60" />
            <span className="font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
              {currentBreadcrumb.title}
            </span>
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-tint text-primary-dark border border-primary/20">
              {roleInfo.badge}
            </span>
            {user?.branch_id && (
              <span className="text-xs text-muted font-medium">
                Kho: <b className="text-foreground">{user.branch_id}</b>
              </span>
            )}
          </div>
        </div>

        {/* Ngăn kéo Menu Mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
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
                    <span>
                      CSM <span className="text-primary font-black">Admin</span>
                    </span>
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

                <nav
                  className="flex-1 p-3 space-y-4 overflow-y-auto"
                  aria-label="Menu quản trị di động"
                >
                  {visibleGroups.map((group) => (
                    <div key={group.groupName} className="space-y-1">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                        {group.groupName}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const isActive = isLinkActive(item.href);
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              aria-current={isActive ? "page" : undefined}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                isActive
                                  ? "bg-primary-tint text-primary-dark font-bold border border-primary/25 shadow-xs"
                                  : "text-muted hover:bg-surface-soft hover:text-foreground"
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted"}`} />
                                <span>{item.name}</span>
                              </span>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>

                <div className="p-4 border-t border-border space-y-3 bg-surface-soft/40 shrink-0">
                  <Link
                    to="/admin/profile"
                    aria-label="Hồ sơ của tôi"
                    className="block p-3 rounded-2xl bg-surface border border-border/60 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary-tint text-primary-dark font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                        {user?.role === "ADMIN" ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-foreground">
                          {user?.fullName || user?.email}
                        </p>
                        <p className="text-[10px] text-muted">{roleInfo.title} · Hồ sơ của tôi</p>
                      </div>
                      <UserCog className="w-4 h-4 text-muted shrink-0" />
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      window.location.href = "/";
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-semibold text-danger-dark bg-danger-pastel/70 hover:bg-danger-pastel border border-danger/25 transition-all cursor-pointer"
                    aria-label="Đăng xuất di động"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Nội dung trang */}
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
