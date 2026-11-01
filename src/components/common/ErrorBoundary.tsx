import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "../ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full bg-surface p-8 sm:p-10 rounded-3xl border border-danger/25 shadow-card text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-danger-pastel border border-danger/25 flex items-center justify-center text-danger-dark mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Đã xảy ra sự cố không mong muốn
              </h1>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Hệ thống gặp lỗi trong quá trình kết xuất dữ liệu. Chúng tôi đã ghi nhận và đang khắc phục.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="p-3 bg-surface-soft border border-border/80 rounded-2xl text-left text-[11px] font-mono text-danger-dark overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={this.handleReset}
                className="rounded-2xl gap-2 font-semibold text-xs sm:text-sm shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tải lại trang</span>
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="rounded-2xl gap-2 font-semibold text-xs sm:text-sm"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về trang chủ</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
