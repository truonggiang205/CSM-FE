import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { authApi } from "../../../api/authApi";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
      });

      setSuccessMsg("Đăng ký thành công! Đang chuyển hướng...");
      setAuth(data.user, data.accessToken, data.refreshToken);

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
      setErrorMsg(typeof msg === "string" ? msg : Array.isArray(msg) ? msg.join(", ") : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface p-8 sm:p-10 rounded-3xl border border-border shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary text-xl mx-auto shadow-sm">
            ✨
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Đăng ký tài khoản</h1>
          <p className="text-muted text-xs sm:text-sm">
            Trở thành thành viên của CSM Store để nhận nhiều ưu đãi
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-success-pastel border border-primary/25 text-primary-dark text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="register-name">Họ và tên</Label>
            <Input
              id="register-name"
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              required
              placeholder="ten@csm.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-password">Mật khẩu (ít nhất 6 ký tự)</Label>
            <Input
              id="register-password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-confirm-password">Xác nhận mật khẩu</Label>
            <Input
              id="register-confirm-password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-sm font-semibold shadow-sm mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang tạo tài khoản...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Đăng ký tài khoản
              </span>
            )}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-border/60">
          <p className="text-xs text-muted">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
