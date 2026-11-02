import { Link } from "react-router-dom";
import { Home, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface p-8 sm:p-10 rounded-3xl border border-border shadow-card text-center space-y-6">
        <div className="space-y-2">
          <div className="w-20 h-20 rounded-3xl bg-primary-tint/70 border border-primary/25 flex items-center justify-center text-primary text-3xl mx-auto shadow-xs font-black">
            404
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Không tìm thấy trang
          </h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Đường dẫn bạn yêu cầu không tồn tại, đã bị gỡ bỏ hoặc bạn đã nhập sai địa chỉ URL.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="default" className="rounded-2xl gap-2 font-bold text-xs sm:text-sm shadow-sm">
            <Link to="/">
              <Home className="w-4 h-4" />
              <span>Về trang chủ</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="default" className="rounded-2xl gap-2 font-bold text-xs sm:text-sm">
            <Link to="/products">
              <ShoppingBag className="w-4 h-4" />
              <span>Mua sắm ngay</span>
            </Link>
          </Button>
        </div>

        <div className="pt-4 border-t border-border/60">
          <button
            onClick={() => window.history.back()}
            className="text-xs font-semibold text-muted hover:text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang trước</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
