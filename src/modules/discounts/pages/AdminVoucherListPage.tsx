import { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Search,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Percent,
  Banknote,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Pencil,
  Trash2,
  Clock,
  PauseCircle,
  Ban,
  CalendarX,
} from "lucide-react";
import { discountApi, VoucherItem } from "../../../api/discountApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Pagination, paginate } from "../../../components/ui/Pagination";
import { useAuthStore } from "../../../store/useAuthStore";
import { formatDateTimeVN } from "../../../lib/datetime";
import { canTogglePromo, getPromoStatus, PromoStatus, PROMO_STATUS_META } from "../../../lib/promoStatus";
import { AdminVoucherFormModal } from "../components/AdminVoucherFormModal";

type PendingAction = { kind: "toggle" | "delete"; voucher: VoucherItem } | null;

const STATUS_HINT: Record<PromoStatus, string> = {
  ACTIVE: "Đang trong thời gian áp dụng và đang bật",
  UPCOMING: "Chưa tới thời gian bắt đầu, sẽ tự bật khi tới giờ",
  PAUSED: "Đang trong thời gian áp dụng nhưng admin đã tạm ngưng",
  SOLD_OUT: "Đã dùng hết tổng lượt, tự tắt cho tới khi tăng thêm lượt",
  ENDED: "Đã quá thời gian kết thúc",
};

const getVoucherStatus = (v: VoucherItem, nowMs: number): PromoStatus =>
  getPromoStatus({
    isActive: v.is_active,
    startMs: new Date(v.start_date).getTime(),
    endMs: new Date(v.end_date).getTime(),
    exhausted: !!v.usage_limit && (v.used_count || 0) >= v.usage_limit,
    nowMs,
  });

export function AdminVoucherListPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilterRaw] = useState<"ALL" | PromoStatus>("ALL");
  const [typeFilter, setTypeFilterRaw] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(10);
  // Đổi bộ lọc / số dòng mỗi trang thì quay về trang 1.
  const setStatusFilter = (v: "ALL" | PromoStatus) => {
    setStatusFilterRaw(v);
    setPage(1);
  };
  const setTypeFilter = (v: string) => {
    setTypeFilterRaw(v);
    setPage(1);
  };
  const setPageSize = (v: number) => {
    setPageSizeRaw(v);
    setPage(1);
  };

  // Đồng hồ nội bộ: trạng thái tự chuyển (Sắp diễn ra → Đang diễn ra → Đã kết thúc) khi tới hạn.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const [formOpen, setFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await discountApi.getAllVouchers();
      setVouchers(Array.isArray(data) ? data : []);
      setNowMs(Date.now());
    } catch (err: any) {
      console.error("Lỗi tải danh sách voucher:", err);
      setPageError("Không tải được danh sách voucher. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const readError = (err: any, fallback: string) => {
    const msg = err?.response?.data?.message || err?.message || fallback;
    return Array.isArray(msg) ? msg.join(", ") : msg;
  };

  const handleConfirmAction = async () => {
    if (!pending) return;
    const { kind, voucher } = pending;
    try {
      setActionLoading(true);
      setPageError(null);
      if (kind === "toggle") {
        await discountApi.toggleVoucher(voucher.id);
        showNotification(`Đã ${voucher.is_active ? "tạm ngưng" : "bật lại"} voucher ${voucher.code}!`);
      } else {
        await discountApi.deleteVoucher(voucher.id);
        showNotification(`Đã xoá voucher ${voucher.code}!`);
      }
      setPending(null);
      fetchVouchers();
    } catch (err: any) {
      setPending(null);
      setPageError(readError(err, kind === "toggle" ? "Lỗi khi thay đổi trạng thái voucher" : "Xoá voucher thất bại"));
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const withStatus = useMemo(
    () => vouchers.map((v) => ({ voucher: v, status: getVoucherStatus(v, nowMs) })),
    [vouchers, nowMs],
  );

  const filteredVouchers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return withStatus.filter(({ voucher: v, status }) => {
      const matchesSearch =
        !q || v.code.toLowerCase().includes(q) || (v.description || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesType = typeFilter === "ALL" || v.discount_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [withStatus, searchQuery, statusFilter, typeFilter]);

  const pagedVouchers = paginate(filteredVouchers, page, pageSize);

  const stats = useMemo(() => {
    const count: Record<PromoStatus, number> = { ACTIVE: 0, UPCOMING: 0, PAUSED: 0, SOLD_OUT: 0, ENDED: 0 };
    withStatus.forEach(({ status }) => {
      count[status] += 1;
    });
    return { total: withStatus.length, ...count };
  }, [withStatus]);

  const statCards: { key: "ALL" | PromoStatus; label: string; value: number; icon: React.ReactNode; tone: string }[] = [
    { key: "ALL", label: "Tổng số voucher", value: stats.total, icon: <Tag className="w-4 h-4" />, tone: "text-primary bg-primary-tint" },
    { key: "ACTIVE", label: "Đang diễn ra", value: stats.ACTIVE, icon: <Check className="w-4 h-4" />, tone: "text-emerald-600 bg-emerald-500/10" },
    { key: "UPCOMING", label: "Sắp diễn ra", value: stats.UPCOMING, icon: <Clock className="w-4 h-4" />, tone: "text-amber-600 bg-amber-500/10" },
    { key: "PAUSED", label: "Tạm ngưng", value: stats.PAUSED, icon: <PauseCircle className="w-4 h-4" />, tone: "text-slate-600 bg-slate-500/10" },
    { key: "SOLD_OUT", label: "Hết lượt dùng", value: stats.SOLD_OUT, icon: <Ban className="w-4 h-4" />, tone: "text-rose-600 bg-rose-500/10" },
    { key: "ENDED", label: "Đã kết thúc", value: stats.ENDED, icon: <CalendarX className="w-4 h-4" />, tone: "text-muted bg-surface-soft" },
  ];

  return (
    <div className="space-y-6">
      {actionSuccessMsg && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>🎟️</span>
            <span>Quản lý Khuyến Mãi & Voucher</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            Tạo mã giảm giá, kiểm soát lượt sử dụng và điều kiện thanh toán cho khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchVouchers} disabled={loading} className="rounded-xl text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => {
                setEditingVoucher(null);
                setFormOpen(true);
              }}
              className="rounded-xl text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo Voucher Mới
            </Button>
          )}
        </div>
      </div>

      {pageError && (
        <div className="p-3.5 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{pageError}</span>
          <button type="button" onClick={() => setPageError(null)} className="font-bold">
            Đóng
          </button>
        </div>
      )}

      {/* Thống kê theo trạng thái — bấm để lọc nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setStatusFilter(c.key)}
            className={`text-left p-4 rounded-2xl border bg-surface flex items-center gap-3 transition-colors ${
              statusFilter === c.key ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"
            }`}
          >
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.tone}`}>{c.icon}</span>
            <span className="min-w-0">
              <span className="block text-[11px] text-muted font-medium truncate">{c.label}</span>
              <span className="block text-lg font-bold text-foreground font-mono">{c.value}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Tìm theo mã hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs rounded-xl bg-surface"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | PromoStatus)}
            className="px-3 py-2 rounded-xl text-xs bg-surface border border-border font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {(Object.keys(PROMO_STATUS_META) as PromoStatus[]).map((s) => (
              <option key={s} value={s}>
                {PROMO_STATUS_META[s].label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-surface border border-border font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Tất cả loại giảm giá</option>
            <option value="FIXED_AMOUNT">Giảm tiền mặt (₫)</option>
            <option value="PERCENTAGE">Giảm theo %</option>
          </select>
        </div>
      </div>

      {/* Bảng voucher */}
      <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-soft border-b border-border text-muted font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-4">Mã Voucher</th>
                <th className="px-5 py-4">Loại & Mức giảm</th>
                <th className="px-5 py-4">Đơn tối thiểu</th>
                <th className="px-5 py-4">Lượt sử dụng</th>
                <th className="px-5 py-4">Thời gian hiệu lực</th>
                <th className="px-5 py-4 text-center">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
                    Đang tải danh sách voucher...
                  </td>
                </tr>
              ) : pagedVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    <div className="w-12 h-12 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary mx-auto mb-2">
                      <Tag className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {vouchers.length === 0 ? "Chưa có voucher nào" : "Không có voucher phù hợp bộ lọc"}
                    </p>
                  </td>
                </tr>
              ) : (
                pagedVouchers.map(({ voucher, status }) => {
                  const percentUsed = Math.min(
                    100,
                    Math.round(((voucher.used_count || 0) / (voucher.usage_limit || 1)) * 100),
                  );
                  const meta = PROMO_STATUS_META[status];
                  const toggleable = canTogglePromo(status);
                  const isOn = status === "ACTIVE";

                  return (
                    <tr key={voucher.id} className="hover:bg-surface-soft/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary tracking-wide bg-primary-tint/60 px-2.5 py-1 rounded-lg border border-primary/20">
                            {voucher.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(voucher.code)}
                            title="Sao chép mã"
                            className="text-muted hover:text-foreground transition-colors"
                          >
                            {copiedCode === voucher.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {voucher.description && (
                          <p className="text-[11px] text-muted mt-1 max-w-xs truncate" title={voucher.description}>
                            {voucher.description}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          {voucher.discount_type === "FIXED_AMOUNT" ? (
                            <>
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{formatCurrency(Number(voucher.discount_value))}</span>
                            </>
                          ) : (
                            <>
                              <Percent className="w-3.5 h-3.5 text-blue-600" />
                              <span>Giảm {Number(voucher.discount_value)}%</span>
                            </>
                          )}
                        </div>
                        {voucher.discount_type === "PERCENTAGE" && voucher.max_discount_amount ? (
                          <span className="text-[11px] text-muted block mt-0.5">
                            Tối đa {formatCurrency(Number(voucher.max_discount_amount))}
                          </span>
                        ) : null}
                      </td>

                      <td className="px-5 py-4 font-mono font-medium text-foreground">
                        {Number(voucher.min_order_value) > 0 ? (
                          formatCurrency(Number(voucher.min_order_value))
                        ) : (
                          <span className="text-muted">Không yêu cầu</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1 w-28">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="font-bold text-foreground">{voucher.used_count || 0}</span>
                            <span className="text-muted">/ {voucher.usage_limit}</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-soft rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentUsed >= 90 ? "bg-red-500" : percentUsed >= 60 ? "bg-amber-500" : "bg-primary"
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-foreground whitespace-nowrap">
                        <div>
                          <span className="text-muted">Bắt đầu: </span>
                          <span className="font-mono">{formatDateTimeVN(voucher.start_date)}</span>
                        </div>
                        <div className="mt-0.5">
                          <span className="text-muted">Kết thúc: </span>
                          <span className="font-mono">{formatDateTimeVN(voucher.end_date)}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          title={STATUS_HINT[status]}
                          className={`inline-block px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              disabled={!toggleable}
                              onClick={() => setPending({ kind: "toggle", voucher })}
                              title={
                                toggleable
                                  ? isOn
                                    ? "Tạm ngưng voucher này"
                                    : "Bật lại voucher này"
                                  : `Không bật/tắt được: ${STATUS_HINT[status].toLowerCase()}`
                              }
                              className="p-1 rounded-lg hover:bg-surface-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isOn ? (
                                <ToggleRight className="w-6 h-6 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-muted" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVoucher(voucher);
                                setFormOpen(true);
                              }}
                              title="Chỉnh sửa"
                              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-soft"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPending({ kind: "delete", voucher })}
                              title="Xoá voucher"
                              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-pastel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredVouchers.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          unit="voucher"
          className="border-t border-border px-5 py-3"
        />
      </div>

      <AdminVoucherFormModal
        open={formOpen}
        voucher={editingVoucher}
        onClose={() => setFormOpen(false)}
        onSaved={(msg) => {
          setFormOpen(false);
          showNotification(msg);
          fetchVouchers();
        }}
      />

      <ConfirmDialog
        open={!!pending}
        tone={pending?.kind === "delete" ? "danger" : pending?.voucher.is_active ? "warning" : "default"}
        title={
          pending?.kind === "delete"
            ? `Xoá voucher ${pending.voucher.code}?`
            : pending?.voucher.is_active
              ? `Tạm ngưng voucher ${pending?.voucher.code}?`
              : `Bật lại voucher ${pending?.voucher.code}?`
        }
        description={
          pending?.kind === "delete"
            ? "Voucher sẽ bị xoá vĩnh viễn và khách hàng không thể dùng mã này nữa. Thao tác không thể hoàn tác."
            : pending?.voucher.is_active
              ? "Khách hàng sẽ tạm thời không áp dụng được mã này cho tới khi bạn bật lại."
              : "Khách hàng sẽ áp dụng được mã này ngay khi bật lại."
        }
        confirmLabel={
          pending?.kind === "delete" ? "Xoá voucher" : pending?.voucher.is_active ? "Tạm ngưng" : "Bật lại"
        }
        requireText={pending?.kind === "delete" ? pending.voucher.code : undefined}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

export default AdminVoucherListPage;
