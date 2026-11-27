import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { authApi, UserProfile } from "../../../api/authApi";
import { branchApi } from "../../../api/branchApi";
import { orderApi } from "../../../api/orderApi";
import { OrderStatusBadge } from "../../orders/components/OrderStatusBadge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { UserAvatar } from "../../../components/ui/UserAvatar";
import {
  User as UserIcon,
  ShoppingBag,
  LogOut,
  Calendar,
  Shield,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Pencil,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Wallet,
  Clock,
  Camera,
  Trash2,
} from "lucide-react";

const PHONE_REGEX = /^(\+84|0)\d{9,10}$/;

/** Lấy thông báo lỗi tiếng Việt từ phản hồi của BE (message có thể là chuỗi hoặc mảng) */
function getErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

const normalizePhone = (value: string) => value.replace(/[\s.\-()]/g, "");

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatDate = (isoString?: string, withTime = false) => {
  if (!isoString) return "Chưa có";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: withTime ? "2-digit" : "long",
      day: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
};

const getRoleInfo = (role?: string) => {
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

/** Đánh giá độ mạnh mật khẩu đơn giản: 0 (yếu) → 3 (mạnh) */
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "bg-border" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 6) return { score: 0, label: "Quá ngắn", color: "bg-danger" };
  return [
    { score: 1, label: "Yếu", color: "bg-danger" },
    { score: 1, label: "Yếu", color: "bg-danger" },
    { score: 2, label: "Trung bình", color: "bg-warning" },
    { score: 3, label: "Mạnh", color: "bg-primary" },
  ][score];
}

function Feedback({ type, message }: { type: "success" | "error"; message: string }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-2xl border px-3 py-2.5 text-xs font-medium ${
        isSuccess
          ? "bg-primary-tint/50 border-primary/25 text-primary-dark"
          : "bg-danger-pastel/60 border-danger/25 text-danger-dark"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
      )}
      <span>{message}</span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-muted text-xs flex items-center gap-1.5 shrink-0 pt-px">
        {icon}
        {label}
      </span>
      <span className="text-xs font-semibold text-foreground text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ảnh đại diện: bấm để đổi, có xem trước và xoá                         */
/* ------------------------------------------------------------------ */
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function AvatarPicker({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Giải phóng URL xem trước khi đổi ảnh khác / rời trang
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const applyUser = (user: UserProfile) => {
    queryClient.setQueryData(["auth-profile"], user);
    updateUser({ avatarUrl: user.avatarUrl ?? null });
  };

  const uploadMutation = useMutation({
    mutationFn: authApi.uploadAvatar,
    onSuccess: (res) => {
      applyUser(res.user);
      setPreview(null);
      setNotice("Đã cập nhật ảnh đại diện ✨");
    },
    onError: (err) => {
      setPreview(null);
      setError(getErrorMessage(err, "Không thể tải ảnh lên. Vui lòng thử lại."));
    },
  });

  const removeMutation = useMutation({
    mutationFn: authApi.removeAvatar,
    onSuccess: (res) => {
      applyUser(res.user);
      setNotice("Đã xoá ảnh đại diện");
    },
    onError: (err) => setError(getErrorMessage(err, "Không thể xoá ảnh. Vui lòng thử lại.")),
  });

  const busy = uploadMutation.isPending || removeMutation.isPending;

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng một ảnh
    if (!file) return;
    setError("");
    setNotice("");
    if (!AVATAR_TYPES.includes(file.type)) return setError("Chỉ nhận ảnh JPG, PNG hoặc WEBP.");
    if (file.size > AVATAR_MAX_BYTES) return setError("Ảnh vượt quá 2MB, bạn chọn ảnh nhỏ hơn nhé.");
    setPreview(URL.createObjectURL(file));
    uploadMutation.mutate(file);
  };

  return (
    <div className="flex flex-col items-center gap-2 shrink-0 relative">
      <div className="relative">
        {preview ? (
          <span className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary/25 shadow-sm block">
            <img src={preview} alt="Ảnh đại diện mới (đang tải lên)" className="w-full h-full object-cover opacity-70" />
          </span>
        ) : (
          <UserAvatar
            avatarUrl={profile.avatarUrl}
            name={profile.fullName}
            email={profile.email}
            className="w-24 h-24 rounded-3xl border-2 shadow-sm"
            textClassName="text-3xl font-extrabold"
          />
        )}
        {uploadMutation.isPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-3xl bg-surface/40">
            <Loader2 className="w-6 h-6 animate-spin text-primary-dark" />
          </span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md ring-4 ring-surface hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-primary/40"
          aria-label={profile.avatarUrl ? "Đổi ảnh đại diện" : "Tải ảnh đại diện"}
          title={profile.avatarUrl ? "Đổi ảnh đại diện" : "Tải ảnh đại diện"}
        >
          <Camera className="w-4 h-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
          data-testid="avatar-input"
        />
      </div>

      {profile.avatarUrl && !preview && (
        <button
          type="button"
          onClick={() => {
            setError("");
            removeMutation.mutate();
          }}
          disabled={busy}
          className="mt-1 text-[11px] font-semibold text-muted hover:text-danger-dark inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
        >
          <Trash2 className="w-3 h-3" />
          Xoá ảnh
        </button>
      )}
      {!profile.avatarUrl && !preview && !error && (
        <span className="mt-1 text-[11px] text-muted">JPG, PNG, WEBP · ≤ 2MB</span>
      )}
      {error && (
        <p role="alert" className="max-w-[160px] text-center text-[11px] font-medium text-danger-dark">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="max-w-[160px] text-center text-[11px] font-medium text-primary-dark">
          {notice}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Thẻ thông tin cá nhân: xem + chỉnh sửa họ tên, SĐT                   */
/* ------------------------------------------------------------------ */
function PersonalInfoCard({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data: branch } = useQuery({
    queryKey: ["branch", profile.branch_id],
    queryFn: () => branchApi.getBranchById(profile.branch_id as string),
    enabled: !!profile.branch_id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const startEditing = () => {
    setFullName(profile.fullName || "");
    setPhone(profile.phone || "");
    setFormError("");
    setSuccessMsg("");
    setIsEditing(true);
  };

  const mutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      queryClient.setQueryData(["auth-profile"], res.user);
      updateUser({ fullName: res.user.fullName, phone: res.user.phone });
      setIsEditing(false);
      setSuccessMsg("Đã lưu thông tin hồ sơ 🎉");
    },
    onError: (err) => setFormError(getErrorMessage(err, "Không thể cập nhật hồ sơ. Vui lòng thử lại.")),
  });

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = fullName.replace(/\s+/g, " ").trim();
    const cleanPhone = normalizePhone(phone);
    if (name.length < 2) return setFormError("Họ tên phải có ít nhất 2 ký tự.");
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      return setFormError("Số điện thoại không hợp lệ (bắt đầu bằng 0 hoặc +84, 10–11 chữ số).");
    }
    setFormError("");
    mutation.mutate({ fullName: name, phone: cleanPhone });
  };

  return (
    <section
      aria-labelledby="personal-info-title"
      className="bg-surface border border-border rounded-3xl p-6 shadow-card space-y-4"
    >
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/70">
        <h2 id="personal-info-title" className="text-base font-bold text-foreground flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-primary" />
          Thông tin cá nhân
        </h2>
        {!isEditing && (
          <Button variant="soft" size="sm" onClick={startEditing} className="gap-1.5 rounded-xl">
            <Pencil className="w-3.5 h-3.5" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      {successMsg && <Feedback type="success" message={successMsg} />}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="profile-fullname" className="text-xs font-semibold">
              Họ và tên <span className="text-danger">*</span>
            </Label>
            <Input
              id="profile-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              maxLength={100}
              autoComplete="name"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone" className="text-xs font-semibold">
              Số điện thoại
            </Label>
            <Input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0901 234 567"
              maxLength={16}
              autoComplete="tel"
            />
            <p className="text-[11px] text-muted">Dùng để điền sẵn khi thanh toán và liên hệ giao hàng.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email" className="text-xs font-semibold">
              Email đăng nhập
            </Label>
            <Input id="profile-email" value={profile.email} disabled readOnly />
            <p className="text-[11px] text-muted">Email dùng để đăng nhập nên không thể thay đổi.</p>
          </div>

          <Feedback type="error" message={formError} />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={mutation.isPending}
              className="rounded-xl"
            >
              Huỷ
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending} className="rounded-xl gap-1.5">
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-sm">
          <InfoRow icon={<UserIcon className="w-3.5 h-3.5 text-primary" />} label="Họ và tên">
            {profile.fullName || <span className="text-muted font-normal italic">Chưa cập nhật</span>}
          </InfoRow>
          <InfoRow icon={<Phone className="w-3.5 h-3.5 text-primary" />} label="Số điện thoại">
            {profile.phone || (
              <button
                type="button"
                onClick={startEditing}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                + Thêm số điện thoại
              </button>
            )}
          </InfoRow>
          <InfoRow icon={<Mail className="w-3.5 h-3.5 text-primary" />} label="Email">
            {profile.email}
          </InfoRow>
          {profile.branch_id && (
            <InfoRow icon={<MapPin className="w-3.5 h-3.5 text-accent" />} label="Chi nhánh">
              <span className="block">{branch?.name || profile.branch_id}</span>
              {branch?.address && (
                <span className="block text-[11px] text-muted font-normal mt-0.5">{branch.address}</span>
              )}
            </InfoRow>
          )}
          <InfoRow icon={<Calendar className="w-3.5 h-3.5 text-primary" />} label="Ngày tham gia">
            {formatDate(profile.created_at)}
          </InfoRow>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Thẻ đổi mật khẩu                                                     */
/* ------------------------------------------------------------------ */
function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={72}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-muted hover:text-foreground cursor-pointer"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFormError("");
  };

  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      reset();
      setIsOpen(false);
      setSuccessMsg("Đổi mật khẩu thành công! Lần đăng nhập sau hãy dùng mật khẩu mới nhé 🔐");
    },
    onError: (err) => setFormError(getErrorMessage(err, "Không thể đổi mật khẩu. Vui lòng thử lại.")),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return setFormError("Vui lòng nhập mật khẩu hiện tại.");
    if (newPassword.length < 6) return setFormError("Mật khẩu mới phải có ít nhất 6 ký tự.");
    if (newPassword === currentPassword) return setFormError("Mật khẩu mới phải khác mật khẩu hiện tại.");
    if (newPassword !== confirmPassword) return setFormError("Mật khẩu xác nhận không khớp.");
    setFormError("");
    mutation.mutate({ currentPassword, newPassword });
  };

  return (
    <section
      aria-labelledby="password-title"
      className="bg-surface border border-border rounded-3xl p-6 shadow-card space-y-4"
    >
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/70">
        <h2 id="password-title" className="text-base font-bold text-foreground flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          Bảo mật tài khoản
        </h2>
        {!isOpen && (
          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              setSuccessMsg("");
              setIsOpen(true);
            }}
            className="gap-1.5 rounded-xl"
          >
            Đổi mật khẩu
          </Button>
        )}
      </div>

      {successMsg && <Feedback type="success" message={successMsg} />}

      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordField
            id="pw-current"
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <div className="space-y-2">
            <PasswordField
              id="pw-new"
              label="Mật khẩu mới"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
            {newPassword && (
              <div className="flex items-center gap-2" aria-live="polite">
                <div className="flex-1 grid grid-cols-3 gap-1">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full ${i <= strength.score ? strength.color : "bg-border"}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-muted w-20 text-right">{strength.label}</span>
              </div>
            )}
            <p className="text-[11px] text-muted">
              Tối thiểu 6 ký tự. Nên có chữ hoa, chữ thường, số và ký tự đặc biệt.
            </p>
          </div>
          <PasswordField
            id="pw-confirm"
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          <Feedback type="error" message={formError} />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                reset();
                setIsOpen(false);
              }}
              disabled={mutation.isPending}
              className="rounded-xl"
            >
              Huỷ
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending} className="rounded-xl gap-1.5">
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl bg-surface-soft border border-border p-3.5">
          <div className="w-9 h-9 rounded-xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-foreground">Mật khẩu đăng nhập</p>
            <p className="text-muted mt-0.5">
              Hãy đổi mật khẩu định kỳ và không dùng chung với tài khoản khác để giữ an toàn.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Thống kê mua sắm (chỉ cho khách hàng)                                */
/* ------------------------------------------------------------------ */
function CustomerStats() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-order-stats"],
    queryFn: () => orderApi.getMyOrders({ page: 1, limit: 100 }),
    staleTime: 60 * 1000,
  });

  const stats = useMemo(() => {
    const orders = data?.items ?? [];
    const valid = orders.filter((o) => o.status !== "CANCELLED");
    return {
      totalOrders: data?.total ?? 0,
      totalSpent: valid.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      latest: [...orders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0],
    };
  }, [data]);

  if (isError) return null;

  const tiles = [
    {
      icon: <Package className="w-4 h-4" />,
      label: "Đơn đã đặt",
      value: isLoading ? null : stats.totalOrders.toLocaleString("vi-VN"),
    },
    {
      icon: <Wallet className="w-4 h-4" />,
      label: "Tổng chi tiêu",
      value: isLoading ? null : formatCurrency(stats.totalSpent),
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Đơn gần nhất",
      value: isLoading ? null : stats.latest ? formatDate(stats.latest.created_at) : "Chưa có",
    },
  ];

  return (
    <section aria-label="Thống kê mua sắm" className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="bg-surface border border-border rounded-3xl p-4 shadow-card flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
              {t.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted font-medium">{t.label}</p>
              {t.value === null ? (
                <Skeleton className="h-5 w-24 rounded-lg mt-1" />
              ) : (
                <p className="text-base font-bold text-foreground truncate">{t.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {stats.latest && (
        <Link
          to={`/orders/${stats.latest.id}`}
          className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-surface border border-border shadow-card hover:border-primary/30 transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-surface-soft border border-border flex items-center justify-center text-lg shrink-0">
              📦
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                Đơn gần nhất #{stats.latest.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[11px] text-muted">
                {formatDate(stats.latest.created_at, true)} · {formatCurrency(Number(stats.latest.total_amount))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={stats.latest.status} />
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
          </div>
        </Link>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Lối tắt                                                              */
/* ------------------------------------------------------------------ */
function ShortcutLink({
  to,
  emoji,
  title,
  desc,
  tone = "primary",
}: {
  to: string;
  emoji: ReactNode;
  title: string;
  desc: string;
  tone?: "primary" | "accent";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent-tint/30 hover:bg-accent-tint/50 border-accent/20"
      : "bg-surface-soft hover:bg-primary-tint/40 border-border hover:border-primary/30";
  return (
    <Link
      to={to}
      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-xs font-semibold text-foreground group ${toneClass}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-tint text-primary flex items-center justify-center font-bold">
          {emoji}
        </div>
        <div>
          <div className="text-foreground">{title}</div>
          <div className="text-[11px] text-muted font-normal">{desc}</div>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
    </Link>
  );
}

function ShortcutsCard({ isCustomer, inAdmin }: { isCustomer: boolean; inAdmin: boolean }) {
  return (
    <section
      aria-labelledby="shortcuts-title"
      className="bg-surface border border-border rounded-3xl p-6 shadow-card space-y-4"
    >
      <h2
        id="shortcuts-title"
        className="text-base font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border/70"
      >
        <ShoppingBag className="w-4 h-4 text-primary" />
        Lối tắt tiện ích
      </h2>
      <div className="space-y-3">
        {isCustomer ? (
          <>
            <ShortcutLink to="/orders" emoji="📦" title="Đơn hàng của tôi" desc="Theo dõi trạng thái và lịch sử giao hàng" />
            <ShortcutLink to="/discounts" emoji="🎟️" title="Ưu đãi & voucher" desc="Săn mã giảm giá đang có hiệu lực" />
            <ShortcutLink to="/products" emoji="🛍️" title="Tiếp tục mua sắm" desc="Khám phá đồ tươi ngon & sản phẩm mới nhất" />
          </>
        ) : (
          <>
            {!inAdmin && (
              <ShortcutLink
                to="/admin"
                emoji={<Shield className="w-4 h-4" />}
                title="Bảng điều khiển quản trị"
                desc="Quản lý đơn hàng, kho và doanh thu chi nhánh"
                tone="accent"
              />
            )}
            <ShortcutLink to="/admin/orders" emoji="🧾" title="Quản lý đơn hàng" desc="Xử lý đơn mới và cập nhật trạng thái" />
            <ShortcutLink to="/" emoji="🏪" title="Xem cửa hàng" desc="Mở trang mua sắm như khách hàng" />
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trang hồ sơ                                                          */
/* ------------------------------------------------------------------ */
export function ProfilePage() {
  const { logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const inAdmin = location.pathname.startsWith("/admin");

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

  // Đồng bộ họ tên/SĐT mới nhất vào store (header, checkout dùng lại)
  useEffect(() => {
    if (profile)
      updateUser({
        fullName: profile.fullName,
        phone: profile.phone ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      });
  }, [profile, updateUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-xl">
        <ErrorState
          title="Không thể tải thông tin hồ sơ"
          message={getErrorMessage(error, "Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại sau.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const roleInfo = getRoleInfo(profile.role);
  const isCustomer = profile.role === "CUSTOMER";
  const displayName = profile.fullName || profile.email.split("@")[0];

  return (
    <div className={`container mx-auto max-w-4xl space-y-6 ${inAdmin ? "py-2" : "px-4 sm:px-6 py-10"}`}>
      {/* Thẻ đầu trang */}
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-primary-tint/30 pointer-events-none blur-2xl" />

        <AvatarPicker profile={profile} />

        <div className="flex-1 text-center sm:text-left space-y-2 min-w-0 relative">
          <p className="text-xs font-semibold text-muted">Xin chào 👋</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate max-w-full">
              {displayName}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleInfo.color}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {roleInfo.label}
            </span>
          </div>
          <p className="text-muted text-sm flex items-center justify-center sm:justify-start gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            Thành viên từ {formatDate(profile.created_at)}
          </p>
        </div>

        {!inAdmin && (
          <div className="shrink-0 flex items-center gap-2 relative">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-10 px-4 rounded-2xl border-danger/30 text-danger-dark hover:bg-danger-pastel hover:border-danger/50 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </Button>
          </div>
        )}
      </div>

      {isCustomer && <CustomerStats />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <PersonalInfoCard profile={profile} />
        <div className="space-y-6">
          <ChangePasswordCard />
          <ShortcutsCard isCustomer={isCustomer} inAdmin={inAdmin} />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
