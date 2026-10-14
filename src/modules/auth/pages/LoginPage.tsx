import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore, Role } from "../../../store/useAuthStore";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { authApi } from "../../../api/authApi";
import { LogIn, Sparkles, AlertCircle } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const data = await authApi.login({ email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface p-8 sm:p-10 rounded-3xl border border-border shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary text-xl mx-auto shadow-sm">
            🌱
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Đăng nhập tài khoản</h1>
          <p className="text-muted text-xs sm:text-sm">
            Hệ thống Cửa hàng Tiện lợi CSM Store
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              required
              placeholder="ten@csm.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">Mật khẩu</Label>
            <Input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold shadow-sm">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </span>
            )}
          </Button>
        </form>

        {import.meta.env.DEV && <DevQuickLoginSection from={from} />}
      </div>
    </div>
  );
}

function DevQuickLoginSection({ from }: { from: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleQuickLogin = async (role: Role) => {
    setErrorMsg("");
    setLoading(true);
    try {
      await useAuthStore.getState().loginAsRole?.(role);
      navigate(role === "CUSTOMER" ? from : "/admin", { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Đăng nhập nhanh thất bại.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTestRole = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      await useAuthStore.getState().toggleTestRole?.();
      navigate("/admin", { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Chuyển role thất bại.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 border-t border-border/80 space-y-3">
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-danger-pastel text-danger-dark text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Đăng nhập nhanh kiểm thử (DEV):</span>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={handleToggleTestRole}
          className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors"
          title="Chuyển đổi vai trò test giữa ADMIN và BRANCH_MANAGER"
        >
          Đổi role (toggleTestRole)
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleQuickLogin("CUSTOMER")}
          className="text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-primary-tint/60 hover:bg-primary-tint text-primary-dark border border-primary/20 transition-all flex items-center justify-between"
        >
          <span>👤 Khách hàng (customer@csm.vn)</span>
          <span className="text-[10px] text-muted">Role: CUSTOMER</span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleQuickLogin("BRANCH_MANAGER")}
          className="text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-info-pastel/70 hover:bg-info-pastel text-info-dark border border-info/20 transition-all flex items-center justify-between"
        >
          <span>🏪 Quản lý br-01 (manager.q1@csm.vn)</span>
          <span className="text-[10px] text-muted">Role: MANAGER</span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleQuickLogin("ADMIN")}
          className="text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-accent-tint/70 hover:bg-accent-tint text-accent-dark border border-accent/20 transition-all flex items-center justify-between"
        >
          <span>👑 Quản trị viên (admin@csm.vn)</span>
          <span className="text-[10px] text-muted">Role: ADMIN</span>
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
