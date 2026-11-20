import React, { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Search,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Percent,
  Banknote,
  Copy,
  Check,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { discountApi, VoucherItem, CreateVoucherPayload } from "../../../api/discountApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Card } from "../../../components/ui/Card";
import { useAuthStore } from "../../../store/useAuthStore";

interface VoucherFormData {
  code: string;
  description: string;
  discount_type: "FIXED_AMOUNT" | "PERCENTAGE";
  discount_value: number;
  min_order_value: number;
  max_discount_amount: number;
  usage_limit: number;
  start_date: string;
  end_date: string;
}

const getDefaultDates = () => {
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30); // mặc định có hạn 30 ngày
  return {
    start: now.toISOString().slice(0, 16),
    end: end.toISOString().slice(0, 16),
  };
};

export function AdminVoucherListPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<VoucherFormData>(() => {
    const dates = getDefaultDates();
    return {
      code: "",
      description: "",
      discount_type: "FIXED_AMOUNT",
      discount_value: 20000,
      min_order_value: 50000,
      max_discount_amount: 50000,
      usage_limit: 100,
      start_date: dates.start,
      end_date: dates.end,
    };
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await discountApi.getAllVouchers();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Lỗi tải danh sách voucher:", err);
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

  const handleToggle = async (id: string, currentStatus: boolean, code: string) => {
    try {
      await discountApi.toggleVoucher(id);
      showNotification(`Đã ${currentStatus ? "tạm dừng" : "kích hoạt"} voucher ${code}!`);
      fetchVouchers();
    } catch (err: any) {
      alert("Lỗi khi thay đổi trạng thái voucher");
    }
  };

  const handleOpenCreateModal = () => {
    const dates = getDefaultDates();
    setFormData({
      code: "",
      description: "",
      discount_type: "FIXED_AMOUNT",
      discount_value: 20000,
      min_order_value: 50000,
      max_discount_amount: 50000,
      usage_limit: 100,
      start_date: dates.start,
      end_date: dates.end,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = formData.code.trim().toUpperCase();
    if (!code) {
      setFormError("Vui lòng nhập mã voucher");
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setFormError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    if (formData.discount_value <= 0) {
      setFormError("Giá trị giảm giá phải lớn hơn 0");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateVoucherPayload = {
        code,
        description: formData.description.trim() || undefined,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_value: Number(formData.min_order_value) || 0,
        max_discount_amount:
          formData.discount_type === "PERCENTAGE"
            ? Number(formData.max_discount_amount) || undefined
            : undefined,
        usage_limit: Number(formData.usage_limit) || 100,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      await discountApi.createVoucher(payload);
      setIsModalOpen(false);
      showNotification(`Tạo voucher '${code}' thành công!`);
      fetchVouchers();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Tạo voucher thất bại";
      setFormError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // Filter & Search Logic
  const filteredVouchers = useMemo(() => {
    const now = new Date();
    return vouchers.filter((v) => {
      const matchesSearch =
        v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") {
        matchesStatus = v.is_active && new Date(v.end_date) >= now;
      } else if (statusFilter === "INACTIVE") {
        matchesStatus = !v.is_active;
      } else if (statusFilter === "EXPIRED") {
        matchesStatus = new Date(v.end_date) < now;
      }

      let matchesType = true;
      if (typeFilter !== "ALL") {
        matchesType = v.discount_type === typeFilter;
      }

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vouchers, searchQuery, statusFilter, typeFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = vouchers.length;
    const now = new Date();
    const active = vouchers.filter((v) => v.is_active && new Date(v.end_date) >= now).length;
    const totalUsed = vouchers.reduce((sum, v) => sum + (v.used_count || 0), 0);
    return { total, active, totalUsed };
  }, [vouchers]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVouchers}
            disabled={loading}
            className="rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="rounded-xl text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo Voucher Mới
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4.5 rounded-2xl border border-border bg-surface flex items-center gap-4 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted font-medium">Tổng số voucher</span>
            <p className="text-xl font-bold text-foreground font-mono">{stats.total}</p>
          </div>
        </Card>

        <Card className="p-4.5 rounded-2xl border border-border bg-surface flex items-center gap-4 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted font-medium">Đang có hiệu lực</span>
            <p className="text-xl font-bold text-emerald-600 font-mono">{stats.active}</p>
          </div>
        </Card>

        <Card className="p-4.5 rounded-2xl border border-border bg-surface flex items-center gap-4 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted font-medium">Lượt đã áp dụng</span>
            <p className="text-xl font-bold text-foreground font-mono">{stats.totalUsed} lượt</p>
          </div>
        </Card>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Tìm theo mã hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-xl bg-surface"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-surface border border-border font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm dừng</option>
            <option value="EXPIRED">Đã hết hạn</option>
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

      {/* Main Table */}
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
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    <div className="w-12 h-12 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary mx-auto mb-2">
                      <Tag className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">Chưa có voucher nào</p>
                    <p className="text-xs text-muted mt-0.5">
                      Bấm "Tạo Voucher Mới" để thêm mã khuyến mãi đầu tiên cho cửa hàng.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => {
                  const now = new Date();
                  const isExpired = new Date(voucher.end_date) < now;
                  const percentUsed = Math.min(
                    100,
                    Math.round(((voucher.used_count || 0) / (voucher.usage_limit || 1)) * 100)
                  );

                  return (
                    <tr key={voucher.id} className="hover:bg-surface-soft/40 transition-colors">
                      {/* Mã voucher */}
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
                          <p className="text-[11px] text-muted mt-1 max-w-xs truncate">
                            {voucher.description}
                          </p>
                        )}
                      </td>

                      {/* Loại & Mức giảm */}
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
                              <span>Giảm {voucher.discount_value}%</span>
                              {voucher.max_discount_amount && (
                                <span className="text-[10px] text-muted font-normal">
                                  (tối đa {formatCurrency(Number(voucher.max_discount_amount))})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-muted block mt-0.5">
                          {voucher.discount_type === "FIXED_AMOUNT" ? "Tiền mặt" : "Phần trăm"}
                        </span>
                      </td>

                      {/* Đơn tối thiểu */}
                      <td className="px-5 py-4 font-mono font-medium text-foreground">
                        {Number(voucher.min_order_value) > 0 ? (
                          formatCurrency(Number(voucher.min_order_value))
                        ) : (
                          <span className="text-muted">Không giới hạn</span>
                        )}
                      </td>

                      {/* Lượt dùng & Progress */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 w-28">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="font-bold text-foreground">{voucher.used_count || 0}</span>
                            <span className="text-muted">/ {voucher.usage_limit}</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-soft rounded-full overflow-hidden border border-border/60">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentUsed >= 90
                                  ? "bg-red-500"
                                  : percentUsed >= 60
                                  ? "bg-amber-500"
                                  : "bg-primary"
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Thời gian */}
                      <td className="px-5 py-4 text-[11px] text-muted">
                        <div className="flex items-center gap-1 text-foreground">
                          <Calendar className="w-3 h-3 text-muted" />
                          <span>Hết hạn: {formatDate(voucher.end_date)}</span>
                        </div>
                        <span className="text-[10px] text-muted block mt-0.5">
                          Bắt đầu: {formatDate(voucher.start_date)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 text-center">
                        {isExpired ? (
                          <span className="px-2.5 py-1 rounded-full bg-surface-soft text-muted border border-border text-[10px] font-bold">
                            Đã hết hạn
                          </span>
                        ) : voucher.is_active ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-bold">
                            Tạm dừng
                          </span>
                        )}
                      </td>

                      {/* Thao tác Toggle */}
                      <td className="px-5 py-4 text-right">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggle(voucher.id, voucher.is_active, voucher.code)}
                            title={voucher.is_active ? "Tạm dừng voucher này" : "Bật lại voucher này"}
                            className="p-1 rounded-lg hover:bg-surface-soft transition-colors text-muted hover:text-foreground"
                          >
                            {voucher.is_active ? (
                              <ToggleRight className="w-6 h-6 text-emerald-600 hover:text-emerald-700" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-muted hover:text-foreground" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Voucher Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Tạo Voucher Mới</h3>
                  <p className="text-xs text-muted">Thiết lập mã giảm giá và điều kiện áp dụng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Mã Voucher (Code) <span className="text-danger">*</span>
                </label>
                <Input
                  required
                  placeholder="VD: CSM50K, SALEHE"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "") })
                  }
                  className="rounded-xl font-mono uppercase font-bold text-primary tracking-wide"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Mô tả hiển thị</label>
                <Input
                  placeholder="VD: Giảm 20.000₫ cho đơn từ 50.000₫"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Loại giảm giá</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as "FIXED_AMOUNT" | "PERCENTAGE",
                        discount_value: e.target.value === "PERCENTAGE" ? 10 : 20000,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs bg-surface border border-border font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {formData.discount_type === "FIXED_AMOUNT"
                      ? "Mức giảm (VNĐ) *"
                      : "Mức giảm (%) *"}
                  </label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={formData.discount_type === "PERCENTAGE" ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: Number(e.target.value) })
                    }
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Đơn tối thiểu (VNĐ)</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.min_order_value}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order_value: Number(e.target.value) })
                    }
                    className="rounded-xl font-mono text-xs"
                  />
                </div>

                {formData.discount_type === "PERCENTAGE" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Giảm tối đa (VNĐ)</label>
                    <Input
                      type="number"
                      min={1000}
                      value={formData.max_discount_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, max_discount_amount: Number(e.target.value) })
                      }
                      className="rounded-xl font-mono text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Lượt dùng tối đa</label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.usage_limit}
                      onChange={(e) =>
                        setFormData({ ...formData, usage_limit: Number(e.target.value) })
                      }
                      className="rounded-xl font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {formData.discount_type === "PERCENTAGE" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Lượt dùng tối đa</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: Number(e.target.value) })
                    }
                    className="rounded-xl font-mono text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Bắt đầu áp dụng</label>
                  <Input
                    required
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Hết hạn vào</label>
                  <Input
                    required
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? "Đang tạo..." : "Xác nhận tạo Voucher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVoucherListPage;
