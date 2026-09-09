import { Outlet, Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { CartDrawer } from "../modules/cart/components/CartDrawer";
import { Button } from "../components/ui/Button";

export default function PublicLayout() {
  const { toggleCart, getTotalItems } = useCartStore();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-xl text-primary">CSM Store</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
              <Link to="/products" className="transition-colors hover:text-primary">
                Sản phẩm
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={toggleCart}>
              <ShoppingCart className="w-5 h-5" />
              {getTotalItems() > 0 && (
                <span className="absolute 0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white translate-x-1/4 -translate-y-1/4">
                  {getTotalItems()}
                </span>
              )}
            </Button>
            <Link to="/login" className="text-sm font-medium px-3 py-2 rounded-md hover:bg-neutral-100 transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-surface py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
          <p className="text-center text-sm leading-loose text-muted md:text-left">
            Built by CSM Team. The source code is available on GitHub.
          </p>
        </div>
      </footer>

      {/* Global Overlays */}
      <CartDrawer />
    </div>
  );
}
