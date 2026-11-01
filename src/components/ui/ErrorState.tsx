import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Không thể tải dữ liệu",
  message = "Đã xảy ra sự cố trong quá trình kết nối với máy chủ. Vui lòng thử lại sau.",
  onRetry,
  showHomeButton = false,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`text-center py-12 px-6 sm:px-8 bg-surface rounded-3xl border border-danger/25 shadow-card max-w-lg mx-auto space-y-4 ${className}`}
      role="alert"
    >
      <div className="w-14 h-14 mx-auto rounded-2xl bg-danger-pastel border border-danger/20 flex items-center justify-center text-danger-dark shadow-xs">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-sm mx-auto">{message}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            className="rounded-2xl gap-2 font-semibold shadow-xs text-xs sm:text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại ngay</span>
          </Button>
        )}
        {showHomeButton && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-2xl gap-2 text-xs sm:text-sm"
          >
            <Link to="/">
              <Home className="w-3.5 h-3.5" />
              <span>Về trang chủ</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
