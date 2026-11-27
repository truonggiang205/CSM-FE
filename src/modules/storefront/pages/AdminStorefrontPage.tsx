import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Image as ImageIcon,
  LayoutGrid,
  Globe2,
  Building2,
  ExternalLink,
  CheckCircle2,
  Megaphone,
  Rows3,
  MousePointerClick,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { branchApi } from "../../../api/branchApi";
import { GLOBAL_SCOPE, HOME_SECTION_TYPES, storefrontApi } from "../../../api/storefrontApi";
import { BannerManager } from "../components/BannerManager";
import { SectionManager } from "../components/SectionManager";
import { AnnouncementManager } from "../components/AnnouncementManager";
import { LayoutManager } from "../components/LayoutManager";

type Tab = "banners" | "sections" | "announcements" | "layout";

const TABS: { key: Tab; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "banners", label: "Banner", hint: "Slider, trang sản phẩm, giỏ hàng, popup", icon: ImageIcon },
  { key: "sections", label: "Sản phẩm nổi bật", hint: "Giờ vàng, CSM Picks, Mới lên kệ", icon: LayoutGrid },
  { key: "announcements", label: "Thanh thông báo", hint: "Dòng chữ chạy trên cùng", icon: Megaphone },
  { key: "layout", label: "Bố cục trang chủ", hint: "Thứ tự và ẩn/hiện các khối", icon: Rows3 },
];

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

  // Tóm tắt những gì khách của phạm vi này đang thấy (cùng API trang chủ dùng)
  const { data: live, refetch: refetchLive } = useQuery({
    queryKey: ["storefront", "admin-overview", scope],
    queryFn: () => storefrontApi.getHome(scope === GLOBAL_SCOPE ? null : scope),
    enabled: !!scope,
  });

  useEffect(() => {
    if (!isAdmin) setScope(managerBranchId);
  }, [isAdmin, managerBranchId]);

  useEffect(() => {
    if (!toast) return;
    refetchLive();
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast, refetchLive]);

  const scopeLabel = useMemo(() => {
    if (scope === GLOBAL_SCOPE) return "Toàn chuỗi";
    return branches.find((b) => b.id === scope)?.name || scope;
  }, [scope, branches]);

  const stats = useMemo(() => {
    if (!live) return null;
    const allBanners = [...live.banners, ...live.placements.PRODUCTS_TOP, ...live.placements.CART, ...live.placements.POPUP];
    return {
      banners: allBanners.length,
      clicks: allBanners.reduce((sum, b) => sum + (b.click_count || 0), 0),
      announcements: live.announcements.length,
      sections: HOME_SECTION_TYPES.filter((t) => live.sections[t]).length,
      hiddenBlocks: live.layout ? live.layout.filter((b) => !b.visible).length : 0,
      customLayout: !!live.layout,
    };
  }, [live]);

  if (!isAdmin && !managerBranchId) {
    return (
      <div className="p-6 rounded-3xl border border-border bg-surface text-sm text-muted">
        Tài khoản quản lý của bạn chưa được gán chi nhánh nên chưa thể tùy chỉnh trang chủ.
      </div>
    );
  }

  const tabCount: Record<Tab, string | null> = {
    banners: stats ? `${stats.banners}` : null,
    sections: stats ? `${stats.sections}/3` : null,
    announcements: stats ? `${stats.announcements}` : null,
    layout: stats ? (stats.customLayout ? "Riêng" : "Mặc định") : null,
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-6 right-6 z-[60] p-3.5 pr-5 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Giao diện trang chủ</h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5 max-w-2xl">
            Tùy chỉnh những gì khách nhìn thấy trên web: banner, thanh thông báo, sản phẩm nổi bật và thứ tự các khối.
          </p>
        </div>
        <Link
          to="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border bg-surface text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary-dark shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở trang khách
        </Link>
      </div>

      {/* Phạm vi + tóm tắt */}
      <div className="rounded-3xl border border-border bg-surface shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-5 border-b border-border bg-gradient-to-r from-primary-tint/50 to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-surface border border-primary/20 flex items-center justify-center text-primary shrink-0">
              {scope === GLOBAL_SCOPE ? <Globe2 className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Bạn đang chỉnh cho</p>
              {isAdmin ? (
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="mt-0.5 -ml-1 px-1 py-0.5 rounded-lg bg-transparent text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer max-w-full"
                  data-testid="storefront-scope"
                  aria-label="Chọn phạm vi áp dụng"
                >
                  <option value={GLOBAL_SCOPE}>Toàn chuỗi (mọi chi nhánh)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      Chi nhánh {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mt-0.5 text-base font-bold text-foreground flex items-center gap-1.5">
                  Chi nhánh {scopeLabel}
                  <Lock className="w-3.5 h-3.5 text-muted" aria-label="Quản lý chỉ chỉnh được chi nhánh của mình" />
                </p>
              )}
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-muted md:ml-auto md:max-w-sm md:text-right">
            {scope === GLOBAL_SCOPE
              ? "Áp dụng cho mọi chi nhánh. Nội dung riêng của chi nhánh (nếu có) được ưu tiên hiển thị trước."
              : "Chỉ khách chọn chi nhánh này mới thấy. Nội dung toàn chuỗi vẫn hiện sau nội dung của chi nhánh."}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/70" data-testid="storefront-overview">
          {[
            {
              tab: "banners" as Tab,
              icon: ImageIcon,
              value: stats?.banners ?? "–",
              label: "banner đang hiển thị",
              sub: stats ? (
                <span className="inline-flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3" />
                  {stats.clicks} lượt bấm
                </span>
              ) : null,
            },
            { tab: "sections" as Tab, icon: LayoutGrid, value: stats ? `${stats.sections}/3` : "–", label: "khối sản phẩm đã chọn", sub: "Còn lại tự chọn mặc định" },
            { tab: "announcements" as Tab, icon: Megaphone, value: stats?.announcements ?? "–", label: "thông báo đang chạy", sub: "Chạy lần lượt, nghỉ 1 phút" },
            {
              tab: "layout" as Tab,
              icon: Rows3,
              value: stats ? (stats.customLayout ? "Riêng" : "Mặc định") : "–",
              label: "bố cục trang chủ",
              sub: stats && stats.hiddenBlocks > 0 ? `${stats.hiddenBlocks} khối đang ẩn` : "Hiện đủ 10 khối",
            },
          ].map((s) => (
            <button
              key={s.tab}
              type="button"
              onClick={() => setTab(s.tab)}
              className="p-4 text-left hover:bg-surface-soft/70 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <s.icon className="w-4 h-4 text-primary" />
                <ChevronRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xl font-bold text-foreground mt-1.5">{s.value}</p>
              <p className="text-[11px] text-muted">{s.label}</p>
              {s.sub && <p className="text-[10px] text-muted/80 mt-0.5">{s.sub}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Thanh tab */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Mục tùy chỉnh">
        {TABS.map(({ key, label, hint, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl border text-left transition-all shrink-0 ${
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface text-foreground border-border hover:border-primary/40 hover:bg-primary-tint/30"
              }`}
            >
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? "bg-white/20" : "bg-primary-tint text-primary"}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span>
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  {label}
                  {tabCount[key] && (
                    <span className={`text-[10px] px-1.5 py-px rounded-full ${active ? "bg-white/25" : "bg-surface-soft border border-border text-muted"}`}>
                      {tabCount[key]}
                    </span>
                  )}
                </span>
                <span className={`block text-[10px] ${active ? "text-white/80" : "text-muted"}`}>{hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {tab === "banners" && <BannerManager key={`b-${scope}`} scope={scope} onNotify={setToast} />}
        {tab === "sections" && (
          <SectionManager key={`s-${scope}`} scope={scope} isGlobalScope={scope === GLOBAL_SCOPE} onNotify={setToast} />
        )}
        {tab === "announcements" && <AnnouncementManager key={`a-${scope}`} scope={scope} onNotify={setToast} />}
        {tab === "layout" && (
          <LayoutManager key={`l-${scope}`} scope={scope} isGlobalScope={scope === GLOBAL_SCOPE} onNotify={setToast} />
        )}
      </div>
    </div>
  );
}
