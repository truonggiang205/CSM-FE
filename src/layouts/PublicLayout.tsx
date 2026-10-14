import React, { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useReducedMotion, motion } from "framer-motion";
import {
  ShoppingCart,
  Search,
  X,
  Store,
  Truck,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Send,
  Facebook,
  Instagram,
  Youtube,
  CheckCircle2,
  LogIn,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { CartDrawer } from "../modules/cart/components/CartDrawer";
import { CartToast } from "../components/ui/CartToast";
import { Button } from "../components/ui/Button";
import { BranchSelector } from "../components/branch/BranchSelector";

export default function PublicLayout() {
  const { toggleCart, getTotalItems } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const totalItems = getTotalItems();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Sync search input with URL `q` param when on /products
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q !== null) {
      setSearchQuery(q);
    } else if (!location.pathname.startsWith("/products")) {
      setSearchQuery("");
    }
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/products?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/products");
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      // TODO: Giao diện giả lập đăng ký bản tin (chưa có API backend)
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header Sticky */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-surface/90 backdrop-blur-md shadow-[0_2px_12px_rgba(78,159,118,0.04)]">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
              aria-label="Về trang chủ CSM Store"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary shadow-xs transition-transform duration-200 group-hover:scale-105">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors flex items-center gap-1">
                  CSM <span className="text-primary font-black">Store</span>
                </span>
                <span className="text-[10px] text-muted -mt-1 font-semibold tracking-wider hidden sm:inline">
                  PASTEL CONVENIENCE
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-2 text-sm font-medium ml-4">
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `relative px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl ${
                    isActive
                      ? "text-primary font-bold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-primary after:rounded-full"
                      : "text-muted hover:text-primary"
                  }`
                }
              >
                Tất cả sản phẩm
              </NavLink>
              {isAuthenticated && (
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `relative px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl ${
                      isActive
                        ? "text-primary font-bold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-primary after:rounded-full"
                        : "text-muted hover:text-primary"
                    }`
                  }
                >
                  Đơn hàng của tôi
                </NavLink>
              )}
              {isAuthenticated && user?.role !== "CUSTOMER" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `text-xs px-3 py-1.5 rounded-full font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isActive
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-pastel-mint text-primary-dark border-primary/25 hover:bg-primary-tint"
                    }`
                  }
                >
                  Khu vực Quản trị
                </NavLink>
              )}
            </nav>
          </div>

          {/* Global Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md mx-2 relative"
            role="search"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nước ngọt, mì ly, bánh snack, cà phê..."
                className="w-full h-10 pl-10 pr-9 rounded-2xl bg-surface-soft border border-border text-xs text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-0.5"
                  aria-label="Xoá từ khoá tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Right Actions: BranchSelector + Cart + Auth */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <BranchSelector />

            {/* Nút mở giỏ hàng kèm hiệu ứng nảy badge */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary-tint/60 text-foreground rounded-2xl h-10 w-10 focus-visible:ring-2 focus-visible:ring-primary"
              onClick={toggleCart}
              aria-label={`Mở giỏ hàng (${totalItems} món)`}
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={shouldReduceMotion ? false : { scale: 0.6 }}
                  animate={shouldReduceMotion ? { scale: 1 } : { scale: [1, 1.35, 1] }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-accent text-[11px] font-extrabold text-white shadow-sm ring-2 ring-surface"
                >
                  {totalItems}
                </motion.span>
              )}
            </Button>

            {/* Auth status */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted hidden sm:inline-block truncate max-w-[110px]">
                  Hi, {user?.name || "Bạn"}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-semibold px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 flex items-center gap-1"
                  title="Đăng xuất khỏi hệ thống"
                  aria-label="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thoát</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold px-3.5 py-2 rounded-xl text-primary-dark bg-primary-tint/70 hover:bg-primary-tint border border-primary/20 transition-all focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>

        {/* Global Search Bar (Mobile Only) */}
        <div className="md:hidden px-4 pb-2.5 pt-0.5 border-t border-border/40">
          <form onSubmit={handleSearchSubmit} className="relative w-full" role="search">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nước ngọt, mì ly, bánh snack..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-surface-soft border border-border text-xs text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                aria-label="Xoá tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Dải 3 cam kết dịch vụ */}
      <section className="border-t border-b border-border bg-surface-soft/80 py-7" aria-label="Cam kết dịch vụ">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-center gap-4 p-4 rounded-3xl bg-surface border border-border/70 shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Giao hàng siêu tốc 30 phút</h3>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  Đóng gói cẩn thận và giao nhanh từ cửa hàng CSM gần bạn nhất.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-3xl bg-surface border border-border/70 shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent-dark shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">100% Tươi mới & An toàn</h3>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  Kiểm soát hạn dùng nghiêm ngặt, đạt chuẩn an toàn vệ sinh thực phẩm.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-3xl bg-surface border border-border/70 shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-pastel-sky border border-info/20 flex items-center justify-center text-info-dark shrink-0 shadow-xs">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Phục vụ 24/7 tiện lợi</h3>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  Sẵn sàng phục vụ đồ ăn nóng sốt và nhu yếu phẩm ngày cũng như đêm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer 4 cột chuẩn bán lẻ */}
      <footer className="bg-surface border-t border-border pt-12 pb-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-border/80">
            {/* Cột 1: Giới thiệu & Mạng xã hội */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary font-bold shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-base text-foreground tracking-tight">
                    CSM <span className="text-primary font-black">Store</span>
                  </span>
                  <p className="text-[10px] text-muted -mt-0.5 font-semibold">PASTEL CONVENIENCE</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Chuỗi cửa hàng tiện lợi phong cách tươi mới, mang đến trải nghiệm mua sắm nhanh gọn, đồ ăn thức uống ngon miệng và thân thiện mỗi ngày.
              </p>
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  Kết nối mạng xã hội
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook CSM Store"
                    className="w-8 h-8 rounded-xl bg-surface-soft border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary/30 transition-all focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram CSM Store"
                    className="w-8 h-8 rounded-xl bg-surface-soft border border-border flex items-center justify-center text-muted hover:text-accent-dark hover:border-accent/30 transition-all focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Youtube CSM Store"
                    className="w-8 h-8 rounded-xl bg-surface-soft border border-border flex items-center justify-center text-muted hover:text-danger-dark hover:border-danger/30 transition-all focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Cột 2: Hệ thống cửa hàng & Liên hệ */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Hệ thống & Liên hệ</h3>
              <ul className="space-y-2.5 text-xs text-muted">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Chi nhánh 1: 123 Lê Lợi, Bến Nghé, Quận 1, TP.HCM</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Chi nhánh 2: 456 Nguyễn Lương Bằng, Quận 7, TP.HCM</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>Hotline đặt hàng: <strong className="text-foreground font-semibold">1900 8888</strong> (24/7)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>Email hỗ trợ: <span className="text-foreground">cskh@csm.vn</span></span>
                </li>
                <li className="flex items-center gap-2 pt-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="font-semibold text-success-dark">Giờ hoạt động: Mở cửa 24/7 cả năm</span>
                </li>
              </ul>
            </div>

            {/* Cột 3: Chính sách & Hỗ trợ */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Chính sách & Hỗ trợ</h3>
              <ul className="space-y-2 text-xs text-muted">
                <li>
                  <Link to="/products" className="hover:text-primary transition-colors focus-visible:underline">
                    &bull; Hướng dẫn mua sắm & thanh toán
                  </Link>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    &bull; Chính sách giao hàng siêu tốc 30 phút
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    &bull; Chính sách đổi trả sản phẩm trong 24h
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    &bull; Cam kết an toàn vệ sinh thực phẩm
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    &bull; Điều khoản sử dụng & bảo mật dữ liệu
                  </span>
                </li>
              </ul>
            </div>

            {/* Cột 4: Đăng ký nhận tin & Ưu đãi */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Ưu đãi & Bản tin
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Đăng ký ngay để nhận thông báo khuyến mãi Giờ vàng, combo ăn trưa và voucher <strong className="text-primary-dark font-bold">20.000₫</strong> cho đơn đầu tiên!
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Nhập email của bạn..."
                    className="flex-1 h-9 px-3 rounded-xl bg-surface-soft border border-border text-xs text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <Button type="submit" size="sm" className="rounded-xl px-3 font-semibold text-xs shrink-0 shadow-xs">
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Đăng ký
                  </Button>
                </div>
                {newsletterSubscribed && (
                  <p className="text-xs text-success-dark font-medium flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Cảm ơn bạn đã đăng ký nhận tin ưu đãi!
                  </p>
                )}
                <p className="text-[10px] text-muted">
                  Cam kết không spam. Bạn có thể hủy nhận tin bất kỳ lúc nào.
                </p>
              </form>
            </div>
          </div>

          {/* Dòng bản quyền & Cam kết thanh toán */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted text-center sm:text-left">
            <p>
              &copy; {new Date().getFullYear()} CSM Convenience Store. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1 text-primary-dark font-semibold">
                🌱 Thực phẩm sạch đạt chuẩn ISO 22000
              </span>
              <span className="text-border hidden sm:inline">&bull;</span>
              <span className="text-muted">Hỗ trợ COD &bull; MoMo &bull; ZaloPay &bull; ATM</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Overlays */}
      <CartDrawer />
      <CartToast />
    </div>
  );
}

