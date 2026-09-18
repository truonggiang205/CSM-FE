import { Outlet, Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { CartDrawer } from "../modules/cart/components/CartDrawer";
import { Button } from "../components/ui/Button";

export default function PublicLayout() {
  const { toggleCart, getTotalItems } = useCartStore();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-surface/85 backdrop-blur-md shadow-[0_2px_12px_rgba(78,159,118,0.04)]">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary text-base font-bold shadow-sm transition-transform duration-200 group-hover:scale-105">
                🌱
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
                  CSM <span className="text-primary font-extrabold">Store</span>
                </span>
                <span className="text-[10px] text-muted -mt-1 font-medium tracking-wide">PASTEL CONVENIENCE</span>
              </div>
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium ml-4">
              <Link to="/products" className="text-muted hover:text-primary transition-colors py-1">
                Tất cả sản phẩm
              </Link>
              <Link to="/admin" className="text-muted hover:text-primary transition-colors py-1 text-xs px-2.5 py-1 rounded-full bg-pastel-mint text-primary-dark font-semibold">
                Khu vực Quản trị
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary-tint/60 text-foreground"
              onClick={toggleCart}
              aria-label="Mở giỏ hàng"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {getTotalItems() > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm">
                  {getTotalItems()}
                </span>
              )}
            </Button>
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-2 rounded-xl text-primary-dark hover:bg-primary-tint/80 border border-transparent hover:border-primary/20 transition-all duration-200"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-surface py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row px-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs text-muted">
              CSM Convenience Store &bull; Phong cách tiện lợi Pastel hiện đại
            </p>
          </div>
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} CSM Team. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Global Overlays */}
      <CartDrawer />
    </div>
  );
}
