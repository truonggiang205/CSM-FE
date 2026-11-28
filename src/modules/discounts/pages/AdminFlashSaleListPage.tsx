import React, { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Plus,
  RefreshCw,
  Search,
  Clock,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import {
  flashSaleApi,
  FlashSaleCampaign,
  CreateFlashSalePayload,
  FlashSaleDiscountType,
  formatFlashSaleDiscount,
} from "../../../api/flashSaleApi";
import { productApi } from "../../../api/productApi";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { NumberInput } from "../../../components/ui/NumberInput";
import { ProductSearchSelect, ProductOption } from "../../../components/ui/ProductSearchSelect";
import { FieldError, FormErrorSummary, invalidClass } from "../../../components/ui/FieldError";
import { formatDateTimeVN, toLocalMs } from "../../../lib/datetime";
import { getStockSummaries } from "../../../lib/stock";
import { getPromoStatus, canTogglePromo, PROMO_STATUS_META, PromoStatus } from "../../../lib/promoStatus";
import { Card } from "../../../components/ui/Card";
import { Pagination, paginate } from "../../../components/ui/Pagination";

interface ItemRow {
  product_id: string;
  product_name: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  /** Giảm theo % hay trừ thẳng tiền mặt */
  discount_type: FlashSaleDiscountType;
  /** Số % (PERCENT) hoặc số tiền VNĐ (FIXED_AMOUNT) */
  discount_value: number | null;
  quantity_limit: number | null;
  max_per_user: number | null;
  /** Số suất đã bán (chỉ có khi sửa ca) — số suất mới không được nhỏ hơn. */
  sold_count?: number;
}

/** Tính lại giá sale và % hiển thị từ kiểu giảm + mức giảm. */
function applyDiscount(row: ItemRow): ItemRow {
  const orig = Math.max(0, Number(row.original_price) || 0);
  const value = Math.max(0, Number(row.discount_value) || 0);
  const sale =
    row.discount_type === "FIXED_AMOUNT" ? orig - value : Math.round(orig * (1 - value / 100));
  const pct = orig > 0 ? Math.round(((orig - sale) / orig) * 100) : 0;
  return { ...row, sale_price: sale, discount_percentage: pct };
}

export function AdminFlashSaleListPage() {
  const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PromoStatus>("ALL");
  const [sortBy, setSortBy] = useState<"START_DESC" | "START_ASC" | "CREATED_DESC" | "NAME_ASC">("START_DESC");
  const [pageError, setPageError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [detailCampaign, setDetailCampaign] = useState<FlashSaleCampaign | null>(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  const getTodayDateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const getCampaignBounds = (c: FlashSaleCampaign) => {
    const todayStr = getTodayDateStr();
    const sDate = (c.start_date || c.apply_date || todayStr).slice(0, 10);
    const eDate = (c.end_date || c.apply_date || sDate).slice(0, 10);
    const sTime = c.start_time.length === 5 ? `${c.start_time}:00` : c.start_time;
    const eTime = c.end_time.length === 5 ? `${c.end_time}:00` : c.end_time;
    const startMs = new Date(`${sDate}T${sTime}`).getTime();
    const endMs = new Date(`${eDate}T${eTime}`).getTime();
    return { sDate, eDate, sTime, eTime, startMs, endMs };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(getTodayDateStr());
  const [endDate, setEndDate] = useState(getTodayDateStr());
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("13:00");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentTicker, setCurrentTicker] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTicker(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await flashSaleApi.getAll();
      setCampaigns(data);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const prods = await productApi.getProducts();
      setAvailableProducts(prods || []);
    } catch {
      setAvailableProducts([]);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchProducts();
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [collapsedRows, setCollapsedRows] = useState<Record<number, boolean>>({});
  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>({});

  // Tải tồn kho khả dụng (tổng các chi nhánh) cho các món đang chọn để giới hạn số suất mở bán
  useEffect(() => {
    const ids = items.map((i) => i.product_id).filter((id) => id && stockByProduct[id] === undefined);
    if (ids.length === 0) return;
    let cancelled = false;
    getStockSummaries(ids).then((map) => {
      if (cancelled) return;
      setStockByProduct((prev) => {
        const next = { ...prev };
        for (const [id, s] of Object.entries(map)) next[id] = s.totalAvailable;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [items, stockByProduct]);

  const productOptions: ProductOption[] = useMemo(
    () =>
      availableProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        available: stockByProduct[p.id],
      })),
    [availableProducts, stockByProduct]
  );

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const openCreateModal = () => {
    const today = getTodayDateStr();
    setEditingCampaignId(null);
    setName("");
    setStartDate(today);
    setEndDate(today);
    setStartTime("11:00");
    setEndTime("13:00");
    setIsActive(true);
    setItems([]);
    setCollapsedRows({});
    setFormError(null);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (camp: FlashSaleCampaign) => {
    const bounds = getCampaignBounds(camp);
    setEditingCampaignId(camp.id);
    setName(camp.name);
    setStartDate(bounds.sDate);
    setEndDate(bounds.eDate);
    setStartTime(camp.start_time.slice(0, 5));
    setEndTime(camp.end_time.slice(0, 5));
    setIsActive(camp.is_active);
    const rows = (camp.items || []).map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name || "",
      original_price: Number(i.original_price) || 0,
      sale_price: Number(i.sale_price) || 0,
      discount_percentage: Number(i.discount_percentage) || 0,
      discount_type: (i.discount_type === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENT") as FlashSaleDiscountType,
      discount_value:
        i.discount_type === "FIXED_AMOUNT"
          ? Number(i.discount_value) || Math.max(0, Number(i.original_price) - Number(i.sale_price))
          : Number(i.discount_value) || Number(i.discount_percentage) || 0,
      quantity_limit: Number(i.quantity_limit) || 50,
      max_per_user: Number(i.max_per_user) || 2,
      sold_count: Number(i.sold_count) || 0,
    }));
    setItems(rows);
    // Khi sửa ca có nhiều món: thu gọn sẵn để form gọn
    setCollapsedRows(Object.fromEntries(rows.map((_, idx) => [idx, rows.length > 1])));
    setFormError(null);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: "",
        product_name: "",
        original_price: 0,
        sale_price: 0,
        discount_percentage: 0,
        discount_type: "PERCENT",
        discount_value: 20,
        quantity_limit: null,
        max_per_user: 2,
      },
    ]);
    // Thu gọn các món cũ để món mới nằm ngay trong tầm nhìn, không phải kéo lên/xuống nhiều
    setCollapsedRows((prev) => {
      const next: Record<number, boolean> = { ...prev };
      items.forEach((_, idx) => {
        next[idx] = true;
      });
      next[items.length] = false;
      return next;
    });
    clearError("items");
    setTimeout(() => {
      document
        .querySelector(`[data-row="${items.length}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  const handleUpdateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems((prev) => {
      const next = [...prev];
      let cur: ItemRow = { ...next[index], ...patch };

      if ("discount_type" in patch && patch.discount_type !== next[index].discount_type) {
        // Đổi kiểu giảm: giữ nguyên giá sale hiện tại, quy đổi mức giảm sang đơn vị mới
        const orig = cur.original_price;
        const sale = next[index].sale_price;
        cur.discount_value =
          cur.discount_type === "FIXED_AMOUNT"
            ? Math.max(0, orig - sale)
            : orig > 0
              ? Math.max(0, Math.round(((orig - sale) / orig) * 100))
              : 0;
        cur = applyDiscount(cur);
      } else if ("original_price" in patch || "discount_value" in patch) {
        cur = applyDiscount(cur);
      }

      next[index] = cur;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setCollapsedRows((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        if (i < index) next[i] = v;
        else if (i > index) next[i - 1] = v;
      });
      return next;
    });
    setErrors((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) if (!k.startsWith("item.")) next[k] = v;
      return next;
    });
  };

  const toggleRow = (index: number) => setCollapsedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  const setAllCollapsed = (collapsed: boolean) =>
    setCollapsedRows(Object.fromEntries(items.map((_, idx) => [idx, collapsed])));

  const handleToggle = async (id: string) => {
    setPageError(null);
    try {
      const updated = await flashSaleApi.toggle(id);
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err: any) {
      // Ví dụ: bật lại ca bị trùng khung giờ với ca khác -> server chặn, phải báo cho admin biết lý do
      const msg = err?.response?.data?.message;
      setPageError((Array.isArray(msg) ? msg.join(" ") : msg) || "Không thể bật / tắt ca Giờ Vàng. Vui lòng thử lại.");
      fetchCampaigns();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await flashSaleApi.delete(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirmId(null);
    } catch {
      fetchCampaigns();
    }
  };

  /** Kiểm tra toàn bộ form, trả về lỗi theo đúng thứ tự hiển thị (trên → dưới, trái → phải). */
  const validateForm = (nowMs: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) errs.name = "Vui lòng nhập tên chiến dịch.";
    else if (trimmedName.length > 100) errs.name = "Tên chiến dịch tối đa 100 ký tự.";

    if (!startDate) errs.startDate = "Vui lòng chọn ngày bắt đầu.";
    if (!startTime) errs.startTime = "Vui lòng chọn thời gian bắt đầu.";
    if (!endDate) errs.endDate = "Vui lòng chọn ngày kết thúc.";
    if (!endTime) errs.endTime = "Vui lòng chọn thời gian kết thúc.";

    if (startDate && startTime && endDate && endTime) {
      const startMs = toLocalMs(startDate, startTime);
      const endMs = toLocalMs(endDate, endTime);
      const original = editingCampaignId ? campaigns.find((c) => c.id === editingCampaignId) : undefined;
      const originalStartMs = original ? getCampaignBounds(original).startMs : null;
      const startChanged = originalStartMs === null || originalStartMs !== startMs;

      if (startChanged && startMs < nowMs - 60_000) {
        errs.startTime = `Thời gian bắt đầu (${formatDateTimeVN(startMs)}) không được ở quá khứ.`;
      }
      if (endMs <= startMs) {
        errs.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu.";
      } else if (endMs <= nowMs) {
        errs.endTime = `Thời gian kết thúc (${formatDateTimeVN(endMs)}) đã ở quá khứ.`;
      } else {
        const conflict = campaigns.find((c) => {
          if (editingCampaignId && c.id === editingCampaignId) return false;
          if (!c.is_active || !isActive) return false;
          const b2 = getCampaignBounds(c);
          return startMs < b2.endMs && b2.startMs < endMs;
        });
        if (conflict) {
          const b2 = getCampaignBounds(conflict);
          errs.startTime = `Khung giờ ${formatDateTimeVN(startMs)} → ${formatDateTimeVN(endMs)} bị trùng với ca "${conflict.name}" (${formatDateTimeVN(b2.startMs)} → ${formatDateTimeVN(b2.endMs)}).`;
        }
      }
    }

    if (items.length === 0) errs.items = "Vui lòng thêm ít nhất 1 món tham gia ca sale.";

    items.forEach((row, i) => {
      const label = row.product_name || `Món #${i + 1}`;
      if (!row.product_id) {
        errs[`item.${i}.product`] = `Món #${i + 1}: vui lòng chọn sản phẩm.`;
      }
      const dv = Number(row.discount_value) || 0;
      if (row.discount_value === null) {
        errs[`item.${i}.discount`] = `${label}: vui lòng nhập mức giảm.`;
      } else if (row.discount_type === "PERCENT" && (dv < 1 || dv > 99)) {
        errs[`item.${i}.discount`] = `${label}: mức giảm % phải từ 1 đến 99.`;
      } else if (row.discount_type === "FIXED_AMOUNT" && (dv < 1 || dv >= row.original_price)) {
        errs[`item.${i}.discount`] = `${label}: số tiền giảm phải từ 1đ và nhỏ hơn giá gốc ${formatVND(row.original_price)}.`;
      } else if (row.product_id && (row.sale_price <= 0 || row.sale_price >= row.original_price)) {
        errs[`item.${i}.discount`] = `${label}: giá sale phải lớn hơn 0đ và nhỏ hơn giá gốc.`;
      }

      const stock = row.product_id ? stockByProduct[row.product_id] : undefined;
      const sold = row.sold_count || 0;
      if (!row.quantity_limit || row.quantity_limit < 1) {
        errs[`item.${i}.quantity`] = `${label}: vui lòng nhập số suất mở bán (lớn hơn 0).`;
      } else if (row.quantity_limit < sold) {
        errs[`item.${i}.quantity`] = `${label}: số suất không được nhỏ hơn số suất đã bán (${sold}).`;
      } else if (stock !== undefined && Number.isFinite(stock) && row.quantity_limit - sold > stock) {
        errs[`item.${i}.quantity`] = `${label}: số suất còn mở bán (${row.quantity_limit - sold}) vượt quá tồn kho khả dụng (${stock}).`;
      }

      if (!row.max_per_user || row.max_per_user < 1) {
        errs[`item.${i}.maxPerUser`] = `${label}: vui lòng nhập số suất tối đa / khách (lớn hơn 0).`;
      } else if (row.quantity_limit && row.max_per_user > row.quantity_limit) {
        errs[`item.${i}.maxPerUser`] = `${label}: tối đa / khách không được lớn hơn số suất mở bán (${row.quantity_limit}).`;
      }
    });

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errs = validateForm(currentTicker);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Mở rộng các món đang lỗi để người dùng thấy ngay ô cần sửa
      setCollapsedRows((prev) => {
        const next = { ...prev };
        Object.keys(errs).forEach((k) => {
          const m = /^item\.(\d+)\./.exec(k);
          if (m) next[Number(m[1])] = false;
        });
        return next;
      });
      setTimeout(() => {
        document.getElementById("flashsale-form-errors")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      return;
    }

    setSubmitting(true);
    const payload: CreateFlashSalePayload = {
      name: name.trim(),
      apply_date: startDate,
      start_date: startDate,
      end_date: endDate,
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      is_active: isActive,
      items: items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        original_price: Number(i.original_price),
        sale_price: Number(i.sale_price),
        discount_percentage: Number(i.discount_percentage),
        discount_type: i.discount_type,
        discount_value: Number(i.discount_value),
        quantity_limit: Number(i.quantity_limit),
        max_per_user: Number(i.max_per_user),
      })),
    };

    try {
      if (editingCampaignId) {
        const updated = await flashSaleApi.update(editingCampaignId, payload);
        setCampaigns((prev) => prev.map((c) => (c.id === editingCampaignId ? updated : c)));
      } else {
        const created = await flashSaleApi.create(payload);
        setCampaigns((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(
        (Array.isArray(msg) ? msg.join(" ") : msg) || "Không thể lưu ca Giờ Vàng. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Status theo thời gian thực: Sắp diễn ra / Đang diễn ra / Tạm ngưng / Đã kết thúc.
   * State (công tắc) chỉ "Bật" khi đang diễn ra; ngoài khung giờ thì công tắc bị khoá.
   */
  const getCampaignStatus = (c: FlashSaleCampaign): PromoStatus => {
    const { startMs, endMs } = getCampaignBounds(c);
    return getPromoStatus({ isActive: c.is_active, startMs, endMs, nowMs: currentTicker });
  };

  const filteredCampaigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = campaigns.filter((c) => {
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.items?.some((i) => (i.product_name || "").toLowerCase().includes(q));
      if (!matchQuery) return false;
      return statusFilter === "ALL" || getCampaignStatus(c) === statusFilter;
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name, "vi");
      if (sortBy === "CREATED_DESC")
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      const diff = getCampaignBounds(a).startMs - getCampaignBounds(b).startMs;
      return sortBy === "START_ASC" ? diff : -diff;
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, searchQuery, statusFilter, sortBy, currentTicker]);

  const stats = useMemo(() => {
    const counts: Record<PromoStatus, number> = { ACTIVE: 0, UPCOMING: 0, PAUSED: 0, SOLD_OUT: 0, ENDED: 0 };
    campaigns.forEach((c) => {
      counts[getCampaignStatus(c)]++;
    });
    return { total: campaigns.length, ...counts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, currentTicker]);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint border border-accent/25 text-xs font-bold text-accent-dark">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Quản Lý Ưu Đãi CSM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
            Quản Lý Giờ Vàng (Flash Sale)
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Cấu hình các khung giờ giảm giá thần tốc, phân bổ suất ưu đãi và giám sát tiến độ thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCampaigns}
            disabled={loading}
            className="rounded-xl gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Tải lại</span>
          </Button>

          <Button onClick={openCreateModal} className="rounded-xl gap-1.5 text-xs font-bold shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Tạo ca Giờ Vàng</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-4 rounded-2xl bg-surface border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary-dark font-black">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">Tổng số ca</div>
            <div className="text-xl font-black text-foreground">{stats.total}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-surface border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-xs text-muted">Đang diễn ra</div>
            <div className="text-xl font-black text-emerald-800">{stats.ACTIVE}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-surface border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-black">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">Sắp diễn ra</div>
            <div className="text-xl font-black text-amber-800">{stats.UPCOMING}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-surface border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-soft border border-border flex items-center justify-center text-muted font-black">
            <Clock className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <div className="text-xs text-muted">Đã kết thúc</div>
            <div className="text-xl font-black text-muted">{stats.ENDED}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-surface border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-black">
            <ToggleLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">Tạm ngưng</div>
            <div className="text-xl font-black text-slate-700">{stats.PAUSED}</div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên chiến dịch hoặc tên món..."
            className="pl-9 rounded-xl text-xs h-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Sắp xếp"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-xs font-semibold"
          >
            <option value="START_DESC">Bắt đầu: mới → cũ</option>
            <option value="START_ASC">Bắt đầu: cũ → mới</option>
            <option value="CREATED_DESC">Mới tạo gần đây</option>
            <option value="NAME_ASC">Tên A → Z</option>
          </select>
          {(["ALL", "ACTIVE", "UPCOMING", "PAUSED", "ENDED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === st
                  ? "bg-primary-tint text-primary-dark border-primary/30 shadow-2xs"
                  : "bg-surface text-muted border-border hover:bg-surface-soft"
              }`}
            >
              {st === "ALL" ? "Tất cả" : PROMO_STATUS_META[st].label}
            </button>
          ))}
        </div>
      </div>

      {pageError && (
        <div role="alert" className="p-3.5 rounded-2xl bg-danger-pastel/70 border border-danger/30 text-danger-dark text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{pageError}</span>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setPageError(null)} className="p-1 rounded hover:bg-danger/10">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-muted font-medium bg-surface rounded-2xl border border-border">
            Đang tải danh sách ca Giờ Vàng...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-3xl border border-dashed border-border/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent-dark mx-auto">
              <Zap className="w-6 h-6" />
            </div>
            <div className="text-base font-bold text-foreground">Chưa có ca Giờ Vàng nào</div>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Bấm "+ Tạo ca Giờ Vàng" để thiết lập ca giảm giá theo khung giờ với các suất mở bán ưu đãi.
            </p>
            <Button onClick={openCreateModal} size="sm" className="rounded-xl text-xs font-bold">
              <Plus className="w-4 h-4 mr-1" />
              Tạo ca Giờ Vàng đầu tiên
            </Button>
          </div>
        ) : (
          paginate(filteredCampaigns, page, pageSize).map((camp) => {
            const status = getCampaignStatus(camp);
            const statusInfo = PROMO_STATUS_META[status];
            const toggleable = canTogglePromo(status);
            const stateOn = status === "ACTIVE";
            const isExpanded = expandedCampaignId === camp.id;
            const totalQuantity = (camp.items || []).reduce((acc, cur) => acc + (cur.quantity_limit || 0), 0);
            const totalSold = (camp.items || []).reduce((acc, cur) => acc + (cur.sold_count || 0), 0);

            return (
              <Card
                key={camp.id}
                className="rounded-3xl border border-border/80 bg-surface shadow-card overflow-hidden transition-all"
              >
                <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>

                      {(() => {
                        const b = getCampaignBounds(camp);
                        return (
                          <span className="text-xs text-muted flex items-center gap-1.5 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-accent" />
                            <span>
                              {formatDateTimeVN(b.startMs)} → {formatDateTimeVN(b.endMs)}
                            </span>
                          </span>
                        );
                      })()}
                    </div>

                    <h3 className="text-lg font-black text-foreground truncate" title={camp.name}>
                      {camp.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-0.5">
                      <span>
                        Sản phẩm tham gia: <strong className="text-foreground">{camp.items?.length || 0} món</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Tiến độ bán:{" "}
                        <strong className="text-foreground">
                          {totalSold} / {totalQuantity} suất
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!toggleable}
                      onClick={() => handleToggle(camp.id)}
                      title={
                        toggleable
                          ? stateOn
                            ? "Tạm ngưng ca đang diễn ra"
                            : "Bật lại ca đang tạm ngưng"
                          : status === "UPCOMING"
                            ? "Ca sẽ tự bật khi tới giờ bắt đầu"
                            : "Ca đã kết thúc"
                      }
                      aria-pressed={stateOn}
                      className="rounded-xl h-9 text-xs font-semibold gap-1.5 disabled:opacity-60"
                    >
                      {stateOn ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-primary" />
                          <span className="text-primary-dark font-bold">Bật</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-muted" />
                          <span className="text-muted">Tắt</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailCampaign(camp)}
                      className="rounded-xl h-9 text-xs font-semibold gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi tiết</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(camp)}
                      className="rounded-xl h-9 text-xs font-semibold gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmId(camp.id)}
                      className="rounded-xl h-9 text-xs font-semibold gap-1 text-danger hover:bg-danger-pastel/40 border-danger/25"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xoá</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCampaignId(isExpanded ? null : camp.id)}
                      className="rounded-xl h-9 text-xs font-semibold gap-1 text-muted"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span>{isExpanded ? "Thu gọn" : "Xem món"}</span>
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-surface-soft/40 p-4 sm:p-6 space-y-3">
                    <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Danh Sách Món Trong Ca
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[26rem] overflow-y-auto pr-1">
                      {(camp.items || []).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-3.5 rounded-2xl bg-surface border border-border/80 flex flex-col justify-between space-y-2 shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="text-xs font-bold text-foreground line-clamp-2 break-words"
                                title={item.product_name || item.product_id}
                              >
                                {item.product_name || `Mã: ${item.product_id}`}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[10px] font-black shrink-0">
                                {formatFlashSaleDiscount(item)}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted font-mono mt-0.5">ID: {item.product_id}</div>
                          </div>

                          <div className="flex items-baseline justify-between pt-1 border-t border-border/50">
                            <div>
                              <div className="text-xs text-muted line-through">
                                {formatVND(Number(item.original_price))}
                              </div>
                              <div className="text-sm font-black text-danger-dark">
                                {formatVND(Number(item.sale_price))}
                              </div>
                            </div>
                            <div className="text-right text-[11px] text-muted">
                              <div>Suất: <strong className="text-foreground">{item.sold_count || 0}/{item.quantity_limit || 0}</strong></div>
                              <div>Tối đa: <strong className="text-foreground">{item.max_per_user || 2}</strong>/khách</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}

        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredCampaigns.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          unit="ca"
          className="pt-2"
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-surface border border-border shadow-modal overflow-hidden max-h-[92vh] flex flex-col my-auto">
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-tint border border-accent/25 flex items-center justify-center text-accent-dark">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">
                    {editingCampaignId ? "Chỉnh Sửa Ca Giờ Vàng" : "Tạo Ca Giờ Vàng Mới"}
                  </h2>
                  <p className="text-xs text-muted">
                    Thiết lập khung giờ và các món ưu đãi giảm giá thần tốc
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-soft"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex-1 min-h-0 flex flex-col">
              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
                <div id="flashsale-form-errors" className="space-y-2">
                  {formError && (
                    <div role="alert" className="p-3.5 rounded-2xl bg-danger-pastel/70 border border-danger/30 text-danger-dark text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}
                  <FormErrorSummary errors={errors} />
                </div>

                <div className="space-y-4">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>1. Thông Tin Khung Giờ</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5" data-field="name">
                      <label className="text-xs font-bold text-foreground">Tên Chiến Dịch *</label>
                      <Input
                        value={name}
                        maxLength={100}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearError("name");
                        }}
                        placeholder="VD: Giờ Vàng Bữa Trưa 11h - 13h"
                        className={`rounded-xl text-xs h-10 ${invalidClass(errors.name)}`}
                        aria-invalid={Boolean(errors.name) || undefined}
                      />
                      <FieldError message={errors.name} />
                    </div>

                    <div className="space-y-1.5" data-field="startDate">
                      <label className="text-xs font-bold text-foreground">Ngày Bắt Đầu *</label>
                      <Input
                        type="date"
                        value={startDate}
                        min={editingCampaignId ? undefined : getTodayDateStr()}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (endDate < e.target.value) setEndDate(e.target.value);
                          clearError("startDate");
                          clearError("startTime");
                        }}
                        className={`rounded-xl text-xs h-10 ${invalidClass(errors.startDate)}`}
                      />
                      <FieldError message={errors.startDate} />
                    </div>

                    <div className="space-y-1.5" data-field="startTime">
                      <label className="text-xs font-bold text-foreground">Thời Gian Bắt Đầu *</label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          clearError("startTime");
                        }}
                        className={`rounded-xl text-xs h-10 font-mono ${invalidClass(errors.startTime)}`}
                      />
                      <FieldError message={errors.startTime} />
                    </div>

                    <div className="space-y-1.5" data-field="endDate">
                      <label className="text-xs font-bold text-foreground">Ngày Kết Thúc *</label>
                      <Input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          clearError("endDate");
                          clearError("endTime");
                        }}
                        className={`rounded-xl text-xs h-10 ${invalidClass(errors.endDate)}`}
                      />
                      <FieldError message={errors.endDate} />
                    </div>

                    <div className="space-y-1.5" data-field="endTime">
                      <label className="text-xs font-bold text-foreground">Thời Gian Kết Thúc *</label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          clearError("endTime");
                        }}
                        className={`rounded-xl text-xs h-10 font-mono ${invalidClass(errors.endTime)}`}
                      />
                      <FieldError message={errors.endTime} />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="h-10 inline-flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="rounded text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        Kích hoạt ngay khi lưu
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-border" data-field="items">
                  <div className="sticky -top-5 sm:-top-6 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 py-2 bg-surface/95 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-accent" />
                      <span>2. Danh Sách Món</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {items.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setAllCollapsed(!items.every((_, i) => collapsedRows[i]))}
                          className="rounded-xl text-xs font-semibold gap-1 text-muted"
                        >
                          {items.every((_, i) => collapsedRows[i]) ? (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" /> Mở rộng tất cả
                            </>
                          ) : (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" /> Thu gọn tất cả
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddItem}
                        className="rounded-xl text-xs font-bold gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm món
                      </Button>
                    </div>
                  </div>
                  <FieldError message={errors.items} />

                  {items.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-border text-muted text-xs">
                      Chưa có món nào. Bấm <strong>"Thêm món"</strong> để chọn món giảm giá cho ca này.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((row, idx) => {
                        const collapsed = Boolean(collapsedRows[idx]);
                        const rowHasError = Object.keys(errors).some((k) => k.startsWith(`item.${idx}.`));
                        const stock = row.product_id ? stockByProduct[row.product_id] : undefined;
                        return (
                          <div
                            key={idx}
                            data-row={idx}
                            className={`rounded-2xl bg-surface-soft/60 border ${rowHasError ? "border-danger/50" : "border-border"}`}
                          >
                            <div className="flex items-center justify-between gap-2 p-3.5">
                              <button
                                type="button"
                                onClick={() => toggleRow(idx)}
                                className="flex-1 min-w-0 flex items-center gap-2 text-left"
                                aria-expanded={!collapsed}
                              >
                                {collapsed ? (
                                  <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                                ) : (
                                  <ChevronUp className="w-4 h-4 text-muted shrink-0" />
                                )}
                                <span className="text-xs font-bold text-foreground shrink-0">#{idx + 1}</span>
                                <span className="text-xs font-semibold text-foreground truncate" title={row.product_name}>
                                  {row.product_name || "Chưa chọn sản phẩm"}
                                </span>
                                {collapsed && row.product_id && (
                                  <span className="hidden sm:flex items-center gap-2 text-[11px] text-muted shrink-0">
                                    <span className="px-1.5 py-0.5 rounded-full bg-danger text-white font-black text-[10px]">
                                      {formatFlashSaleDiscount({ ...row, discount_value: row.discount_value ?? 0 })}
                                    </span>
                                    <span className="font-mono font-bold text-danger-dark">{formatVND(row.sale_price)}</span>
                                    <span>· {row.quantity_limit ?? 0} suất</span>
                                  </span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-danger hover:text-danger-dark text-xs font-semibold flex items-center gap-1 shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xoá món</span>
                              </button>
                            </div>

                            {!collapsed && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 px-3.5 pb-3.5">
                                <div className="sm:col-span-2 md:col-span-4 space-y-1" data-field={`item.${idx}.product`}>
                                  <label className="text-[11px] font-bold text-foreground">Sản phẩm *</label>
                                  <ProductSearchSelect
                                    options={productOptions}
                                    value={row.product_id}
                                    excludeIds={items.map((i) => i.product_id).filter(Boolean)}
                                    invalid={Boolean(errors[`item.${idx}.product`])}
                                    onChange={(opt) => {
                                      handleUpdateItem(idx, {
                                        product_id: opt?.id || "",
                                        product_name: opt?.name || "",
                                        original_price: opt?.price || 0,
                                      });
                                      clearError(`item.${idx}.product`);
                                      clearError(`item.${idx}.quantity`);
                                    }}
                                  />
                                  <FieldError message={errors[`item.${idx}.product`]} />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-foreground">Giá gốc niêm yết</label>
                                  <NumberInput
                                    readOnly
                                    tabIndex={-1}
                                    thousandSeparator
                                    suffix="đ"
                                    value={row.original_price}
                                    onValueChange={() => undefined}
                                    title="Giá gốc lấy theo giá niêm yết của sản phẩm, không sửa ở đây"
                                    className="rounded-xl text-xs h-9 font-mono"
                                  />
                                </div>

                                <div className="space-y-1" data-field={`item.${idx}.discount`}>
                                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <label className="text-[11px] font-bold text-foreground whitespace-nowrap">Mức giảm *</label>
                                    <div
                                      role="radiogroup"
                                      aria-label="Kiểu giảm giá"
                                      className="inline-flex rounded-lg border border-border bg-surface-soft p-0.5 text-[10px] font-bold"
                                    >
                                      {([
                                        { value: "PERCENT", label: "%" },
                                        { value: "FIXED_AMOUNT", label: "Tiền mặt" },
                                      ] as const).map((opt) => (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          role="radio"
                                          aria-checked={row.discount_type === opt.value}
                                          onClick={() => {
                                            handleUpdateItem(idx, { discount_type: opt.value });
                                            clearError(`item.${idx}.discount`);
                                          }}
                                          className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                                            row.discount_type === opt.value
                                              ? "bg-accent text-white shadow-xs"
                                              : "text-muted hover:text-foreground"
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <NumberInput
                                    thousandSeparator={row.discount_type === "FIXED_AMOUNT"}
                                    maxDigits={row.discount_type === "PERCENT" ? 2 : 9}
                                    value={row.discount_value}
                                    onValueChange={(v) => {
                                      handleUpdateItem(idx, { discount_value: v });
                                      clearError(`item.${idx}.discount`);
                                    }}
                                    suffix={row.discount_type === "PERCENT" ? "%" : "đ"}
                                    invalid={Boolean(errors[`item.${idx}.discount`])}
                                    className="rounded-xl text-xs h-9 font-mono font-bold text-accent"
                                    aria-label={row.discount_type === "PERCENT" ? "Phần trăm giảm" : "Số tiền giảm"}
                                  />
                                  <FieldError message={errors[`item.${idx}.discount`]} />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-foreground">Giá sale ưu đãi</label>
                                  <NumberInput
                                    readOnly
                                    tabIndex={-1}
                                    thousandSeparator
                                    suffix="đ"
                                    value={row.sale_price}
                                    onValueChange={() => undefined}
                                    title="Giá sale được tính tự động từ giá gốc và mức giảm"
                                    className="rounded-xl text-xs h-9 font-mono font-bold"
                                  />
                                </div>

                                <div className="space-y-1" data-field={`item.${idx}.quantity`}>
                                  <label className="text-[11px] font-bold text-foreground">Số suất mở bán *</label>
                                  <NumberInput
                                    maxDigits={6}
                                    value={row.quantity_limit}
                                    onValueChange={(v) => {
                                      handleUpdateItem(idx, { quantity_limit: v });
                                      clearError(`item.${idx}.quantity`);
                                      clearError(`item.${idx}.maxPerUser`);
                                    }}
                                    invalid={Boolean(errors[`item.${idx}.quantity`])}
                                    className="rounded-xl text-xs h-9 font-mono"
                                  />
                                  {row.product_id && stock !== undefined && Number.isFinite(stock) && (
                                    <p className="text-[10px] text-muted">Tồn kho khả dụng: {stock}</p>
                                  )}
                                  <FieldError message={errors[`item.${idx}.quantity`]} />
                                </div>

                                <div className="space-y-1" data-field={`item.${idx}.maxPerUser`}>
                                  <label className="text-[11px] font-bold text-foreground">Tối đa / khách *</label>
                                  <NumberInput
                                    maxDigits={4}
                                    value={row.max_per_user}
                                    onValueChange={(v) => {
                                      handleUpdateItem(idx, { max_per_user: v });
                                      clearError(`item.${idx}.maxPerUser`);
                                    }}
                                    invalid={Boolean(errors[`item.${idx}.maxPerUser`])}
                                    className="rounded-xl text-xs h-9 font-mono"
                                  />
                                  <FieldError message={errors[`item.${idx}.maxPerUser`]} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 sm:px-6 py-4 border-t border-border bg-surface flex items-center justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                >
                  {submitting ? "Đang lưu..." : editingCampaignId ? "Cập nhật ca sale" : "Lưu ca Giờ Vàng"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailCampaign(null);
          }}
        >
          <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-surface border border-border shadow-modal overflow-hidden">
            <div className="p-5 border-b border-border flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${PROMO_STATUS_META[getCampaignStatus(detailCampaign)].className}`}
                >
                  {PROMO_STATUS_META[getCampaignStatus(detailCampaign)].label}
                </span>
                <h3 className="mt-1.5 text-lg font-black text-foreground break-words">{detailCampaign.name}</h3>
                <p className="text-xs text-muted mt-0.5">
                  {formatDateTimeVN(getCampaignBounds(detailCampaign).startMs)} →{" "}
                  {formatDateTimeVN(getCampaignBounds(detailCampaign).endMs)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setDetailCampaign(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-soft shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="py-2 pr-2 font-semibold">Món</th>
                    <th className="py-2 px-2 font-semibold text-right">Giá gốc</th>
                    <th className="py-2 px-2 font-semibold text-right">Giá sale</th>
                    <th className="py-2 px-2 font-semibold text-right">Đã bán / suất</th>
                    <th className="py-2 pl-2 font-semibold text-right">Tối đa / khách</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailCampaign.items || []).map((item, idx) => (
                    <tr key={item.id || idx} className="border-b border-border/60 align-top">
                      <td className="py-2 pr-2 font-semibold text-foreground break-words">
                        {item.product_name || item.product_id}
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-danger text-white text-[10px] font-black">
                          {formatFlashSaleDiscount(item)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-muted">{formatVND(Number(item.original_price))}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-danger-dark">{formatVND(Number(item.sale_price))}</td>
                      <td className="py-2 px-2 text-right font-mono">
                        {item.sold_count || 0} / {item.quantity_limit || 0}
                      </td>
                      <td className="py-2 pl-2 text-right font-mono">{item.max_per_user || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 shadow-modal space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-danger-pastel border border-danger/30 flex items-center justify-center text-danger-dark">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Xác nhận xoá ca Giờ Vàng?</h3>
              <p className="text-xs text-muted mt-1">
                Toàn bộ danh sách ưu đãi và số suất trong ca này sẽ bị xoá vĩnh viễn khỏi hệ thống.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Huỷ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl text-xs font-bold"
              >
                Xác nhận xoá
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
