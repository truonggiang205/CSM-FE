import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { authApi, UserProfile } from "../../../api/authApi";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Button } from "../../../components/ui/Button";
import {
  User as UserIcon,
  ShoppingBag,
  LogOut,
  Calendar,
  Shield,
  MapPin,
  Mail,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserProfile>({
    queryKey: ["auth-profile"],
    queryFn: authApi.getProfile,
    retry: 1,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return { label: "Quản trị viên", color: "bg-accent-tint text-accent-dark border-accent/30" };
      case "BRANCH_MANAGER":
        return { label: "Quản lý chi nhánh", color: "bg-info-pastel text-info-dark border-info/30" };
      case "STAFF":
        return { label: "Nhân viên bán hàng", color: "bg-warning-pastel text-warning-dark border-warning/30" };
      default:
        return { label: "Khách hàng thân thiết", color: "bg-primary-tint text-primary-dark border-primary/30" };
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-3xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-xl">
        <ErrorState
          title="Không thể tải thông tin hồ sơ"
          message={
            (error as any)?.response?.data?.message ||
            "Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại sau."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const roleInfo = getRoleLabel(profile.role);
  const initials = (profile.email?.[0] || "U").toUpperCase();

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl space-y-8">
      {/* Header Profile Hero Card */}
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        {/* Soft background decor */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-primary-tint/30 pointer-events-none blur-2xl" />

        <div className="w-20 h-20 rounded-3xl bg-primary-tint border-2 border-primary/25 flex items-center justify-center text-primary-dark font-extrabold text-3xl shadow-sm shrink-0">
          {initials}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
              {profile.fullName || profile.email.split("@")[0]}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleInfo.color}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {roleInfo.label}
            </span>
          </div>

          <p className="text-muted text-sm flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-4 h-4 text-primary" />
            <span className="truncate">{profile.email}</span>
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="h-10 px-4 rounded-2xl border-danger/30 text-danger-dark hover:bg-danger-pastel hover:border-danger/50 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin tài khoản */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border/70">
            <UserIcon className="w-4 h-4 text-primary" />
            Chi tiết tài khoản
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted text-xs">Mã người dùng:</span>
              <span className="font-mono text-xs font-medium text-foreground bg-surface-soft px-2 py-0.5 rounded-lg border border-border">
                {profile.id.slice(0, 13)}...
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted text-xs">Email đăng nhập:</span>
              <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                {profile.email}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted text-xs">Vai trò:</span>
              <span className="text-xs font-bold text-primary-dark">
                {profile.role}
              </span>
            </div>

            {profile.branch_id && (
              <div className="flex items-center justify-between">
                <span className="text-muted text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  Chi nhánh trực thuộc:
                </span>
                <span className="text-xs font-bold font-mono text-accent-dark">
                  {profile.branch_id}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Ngày tham gia:
              </span>
              <span className="text-xs text-foreground font-medium">
                {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Lối tắt quản lý & Mua sắm */}
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border/70">
            <ShoppingBag className="w-4 h-4 text-primary" />
            Lối tắt tiện ích
          </h2>

          <div className="space-y-3">
            <Link
              to="/orders"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-soft hover:bg-primary-tint/40 border border-border hover:border-primary/30 transition-all text-xs font-semibold text-foreground group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-tint text-primary flex items-center justify-center font-bold">
                  📦
                </div>
                <div>
                  <div className="text-foreground">Đơn hàng của tôi</div>
                  <div className="text-[11px] text-muted font-normal">
                    Theo dõi trạng thái và lịch sử giao hàng
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
            </Link>

            <Link
              to="/products"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-soft hover:bg-primary-tint/40 border border-border hover:border-primary/30 transition-all text-xs font-semibold text-foreground group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-tint text-primary flex items-center justify-center font-bold">
                  🛍️
                </div>
                <div>
                  <div className="text-foreground">Tiếp tục mua sắm</div>
                  <div className="text-[11px] text-muted font-normal">
                    Khám phá đồ tươi ngon & sản phẩm mới nhất
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
            </Link>

            {profile.role !== "CUSTOMER" && (
              <Link
                to="/admin"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-accent-tint/30 hover:bg-accent-tint/50 border border-accent/20 transition-all text-xs font-semibold text-accent-dark group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-tint text-accent flex items-center justify-center font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-foreground font-bold">Bảng điều khiển quản trị</div>
                    <div className="text-[11px] text-muted font-normal">
                      Quản lý đơn hàng, kho và doanh thu chi nhánh
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-accent-dark group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
