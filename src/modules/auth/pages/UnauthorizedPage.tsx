import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md bg-surface p-8 sm:p-10 rounded-3xl border border-border shadow-card space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-danger-pastel border border-danger/30 flex items-center justify-center text-danger-dark mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Không có quyền truy cập</h1>
          <p className="text-muted text-xs sm:text-sm mt-2 leading-relaxed">
            Bạn không có đủ quyền hạn để truy cập vào trang này. Khu vực này chỉ dành cho Nhân viên hoặc Quản trị viên cửa hàng.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild variant="outline">
            <Link to="/orders">Đơn hàng của tôi</Link>
          </Button>
          <Button asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
