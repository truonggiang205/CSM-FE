import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, LayoutGrid, Globe2, Building2, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { branchApi } from "../../../api/branchApi";
import { GLOBAL_SCOPE } from "../../../api/storefrontApi";
import { BannerManager } from "../components/BannerManager";
import { SectionManager } from "../components/SectionManager";

type Tab = "banners" | "sections";

export function AdminStorefrontPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const managerBranchId = user?.branch_id || "";

  const [tab, setTab] = useState<Tab>("banners");
  const [scope, setScope] = useState<string>(isAdmin ? GLOBAL_SCOPE : managerBranchId);
  const [toast, setToast] = useState<string | null>(null);

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: branchApi.getBranches,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isAdmin) setScope(managerBranchId);
  }, [isAdmin, managerBranchId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const scopeLabel = useMemo(() => {
    if (scope === GLOBAL_SCOPE) return "Toàn chuỗi";
    return branches.find((b) => b.id === scope)?.name || scope;
  }, [scope, branches]);

  if (!isAdmin && !managerBranchId) {
    return (
      <div className="p-6 rounded-3xl border border-border bg-surface text-sm text-muted">
        Tài khoản quản lý của bạn chưa được gán chi nhánh nên chưa thể tùy chỉnh trang chủ.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>🖼️</span>
            <span>Giao diện trang chủ</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            Tùy chỉnh banner và các khối sản phẩm nổi bật khách nhìn thấy ở trang chủ.
          </p>
        </div>
        <Link
          to="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Xem trang chủ
        </Link>
      </div>

      {/* Phạm vi áp dụng */}
      <div className="p-4 rounded-2xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          {scope === GLOBAL_SCOPE ? <Globe2 className="w-4 h-4 text-primary" /> : <Building2 className="w-4 h-4 text-primary" />}
          Phạm vi áp dụng:
        </div>
        {isAdmin ? (
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-surface border border-border font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
            data-testid="storefront-scope"
          >
            <option value={GLOBAL_SCOPE}>Toàn chuỗi (mọi chi nhánh)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                Chi nhánh: {b.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="px-3 py-2 rounded-xl text-xs bg-surface-soft border border-border font-semibold text-foreground">
            Chi nhánh: {scopeLabel}
          </span>
        )}
        <p className="text-[11px] text-muted sm:ml-auto max-w-md">
          {scope === GLOBAL_SCOPE
            ? "Nội dung toàn chuỗi hiển thị ở mọi chi nhánh. Chi nhánh có cấu hình riêng sẽ được ưu tiên."
            : "Nội dung riêng của chi nhánh này, được ưu tiên hiển thị trước nội dung toàn chuỗi."}
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(
          [
            { key: "banners", label: "Banner", icon: ImageIcon },
            { key: "sections", label: "Sản phẩm nổi bật", icon: LayoutGrid },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px flex items-center gap-1.5 transition-colors ${
              tab === key ? "border-primary text-primary-dark" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "banners" ? (
        <BannerManager key={`b-${scope}`} scope={scope} onNotify={setToast} />
      ) : (
        <SectionManager key={`s-${scope}`} scope={scope} isGlobalScope={scope === GLOBAL_SCOPE} onNotify={setToast} />
      )}
    </div>
  );
}
