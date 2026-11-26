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
} from "lucide-react";
import {
  flashSaleApi,
  FlashSaleCampaign,
  CreateFlashSalePayload,
} from "../../../api/flashSaleApi";
import { productApi } from "../../../api/productApi";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Card } from "../../../components/ui/Card";

interface ItemRow {
  product_id: string;
  product_name: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  quantity_limit: number;
  max_per_user: number;
}

export function AdminFlashSaleListPage() {
  const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [applyDate, setApplyDate] = useState("");
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("13:00");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentTicker, setCurrentTicker] = useState<number>(Date.now());

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

  const openCreateModal = () => {
    setEditingCampaignId(null);
    setName("");
    setApplyDate("");
    setStartTime("11:00");
    setEndTime("13:00");
    setIsActive(true);
    setItems([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (camp: FlashSaleCampaign) => {
    setEditingCampaignId(camp.id);
    setName(camp.name);
    setApplyDate(camp.apply_date ? camp.apply_date.slice(0, 10) : "");
    setStartTime(camp.start_time.slice(0, 5));
    setEndTime(camp.end_time.slice(0, 5));
    setIsActive(camp.is_active);
    setItems(
      (camp.items || []).map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name || "",
        original_price: Number(i.original_price) || 0,
        sale_price: Number(i.sale_price) || 0,
        discount_percentage: Number(i.discount_percentage) || 0,
        quantity_limit: Number(i.quantity_limit) || 50,
        max_per_user: Number(i.max_per_user) || 2,
      }))
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddItem = (productId?: string) => {
    const selectedProd = availableProducts.find((p) => p.id === productId);
    const orig = selectedProd ? selectedProd.price : 20000;
    const pct = 20;
    const sale = Math.round(orig * (1 - pct / 100));

    setItems([
      ...items,
      {
        product_id: selectedProd ? selectedProd.id : "",
        product_name: selectedProd ? selectedProd.name : "",
        original_price: orig,
        sale_price: sale,
        discount_percentage: pct,
        quantity_limit: 50,
        max_per_user: 2,
      },
    ]);
  };

  const handleUpdateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems((prev) => {
      const next = [...prev];
      const cur = { ...next[index], ...patch };

      if ("original_price" in patch || "discount_percentage" in patch) {
        const orig = cur.original_price;
        const pct = cur.discount_percentage;
        cur.sale_price = Math.round(orig * (1 - pct / 100));
      } else if ("sale_price" in patch) {
        const orig = cur.original_price;
        const sale = cur.sale_price;
        if (orig > 0) {
          cur.discount_percentage = Math.max(0, Math.round(((orig - sale) / orig) * 100));
        }
      }

      next[index] = cur;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await flashSaleApi.toggle(id);
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Vui lòng nhập tên chiến dịch");
      return;
    }
    if (!startTime || !endTime) {
      setFormError("Vui lòng chọn khung giờ bắt đầu và kết thúc");
      return;
    }
    if (startTime >= endTime) {
      setFormError("Giờ kết thúc phải lớn hơn giờ bắt đầu");
      return;
    }

    const s1 = startTime.length === 5 ? `${startTime}:00` : startTime;
    const e1 = endTime.length === 5 ? `${endTime}:00` : endTime;
    const conflict = campaigns.find((c) => {
      if (editingCampaignId && c.id === editingCampaignId) return false;
      if (!c.is_active) return false;
      const dateOverlap = !applyDate || !c.apply_date || applyDate === c.apply_date.slice(0, 10);
      if (!dateOverlap) return false;
      const s2 = c.start_time.length === 5 ? `${c.start_time}:00` : c.start_time;
      const e2 = c.end_time.length === 5 ? `${c.end_time}:00` : c.end_time;
      return s1 < e2 && s2 < e1;
    });

    if (conflict) {
      setFormError(
        `Khung giờ ${startTime} - ${endTime} bị trùng với ca '${conflict.name}' (${conflict.start_time.slice(0, 5)} - ${conflict.end_time.slice(0, 5)}). Mỗi khung giờ chỉ được phép tồn tại duy nhất 1 ca Giờ Vàng.`
      );
      return;
    }
    if (items.length === 0) {
      setFormError("Vui lòng thêm ít nhất 1 sản phẩm tham gia ca sale");
      return;
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].product_id.trim() || !items[i].product_name.trim()) {
        setFormError(`Sản phẩm dòng ${i + 1} chưa có ID hoặc Tên sản phẩm`);
        return;
      }
      if (items[i].sale_price <= 0) {
        setFormError(`Giá sale dòng ${i + 1} phải lớn hơn 0`);
        return;
      }
    }

    setSubmitting(true);
    const payload: CreateFlashSalePayload = {
      name: name.trim(),
      apply_date: (applyDate ? applyDate : null) as any,
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      is_active: isActive,
      items: items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        original_price: Number(i.original_price),
        sale_price: Number(i.sale_price),
        discount_percentage: Number(i.discount_percentage),
        quantity_limit: Number(i.quantity_limit) || 50,
        max_per_user: Number(i.max_per_user) || 2,
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
      setFormError(err?.response?.data?.message || "Không thể lưu ca Giờ Vàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCampaignStatus = (c: FlashSaleCampaign) => {
    if (!c.is_active) return { label: "TẠM NGƯNG", color: "bg-muted/15 text-muted border-border" };

    const now = new Date();
    const curH = String(now.getHours()).padStart(2, "0");
    const curM = String(now.getMinutes()).padStart(2, "0");
    const curS = String(now.getSeconds()).padStart(2, "0");
    const curTime = `${curH}:${curM}:${curS}`;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    if (c.apply_date) {
      const campDateStr = c.apply_date.slice(0, 10);
      if (campDateStr < todayStr) {
        return { label: "ĐÃ KẾT THÚC", color: "bg-surface-soft text-muted border-border" };
      }
      if (campDateStr > todayStr) {
        return { label: "SẮP DIỄN RA", color: "bg-amber-100 text-amber-800 border-amber-300" };
      }
    }

    const s = c.start_time.length === 5 ? `${c.start_time}:00` : c.start_time;
    const e = c.end_time.length === 5 ? `${c.end_time}:00` : c.end_time;

    if (curTime >= s && curTime <= e) {
      return { label: "ĐANG DIỄN RA", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    }
    if (curTime < s) {
      return { label: "SẮP DIỄN RA", color: "bg-amber-100 text-amber-800 border-amber-300" };
    }
    return { label: "ĐÃ KẾT THÚC", color: "bg-surface-soft text-muted border-border" };
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchQuery =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.items?.some((i) => (i.product_name || "").toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchQuery) return false;
      if (statusFilter === "ALL") return true;

      const st = getCampaignStatus(c).label;
      if (statusFilter === "ACTIVE") return st === "ĐANG DIỄN RA";
      if (statusFilter === "UPCOMING") return st === "SẮP DIỄN RA";
      if (statusFilter === "ENDED") return st === "ĐÃ KẾT THÚC";
      if (statusFilter === "INACTIVE") return !c.is_active;
      return true;
    });
  }, [campaigns, searchQuery, statusFilter, currentTicker]);

  const stats = useMemo(() => {
    let active = 0;
    let upcoming = 0;
    let ended = 0;
    let totalItems = 0;
    campaigns.forEach((c) => {
      const st = getCampaignStatus(c).label;
      if (st === "ĐANG DIỄN RA") active++;
      else if (st === "SẮP DIỄN RA") upcoming++;
      else if (st === "ĐÃ KẾT THÚC") ended++;
      totalItems += c.items?.length || 0;
    });
    return { total: campaigns.length, active, upcoming, ended, totalItems };
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
            <div className="text-xl font-black text-emerald-800">{stats.active}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-surface border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-black">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">Sắp diễn ra</div>
            <div className="text-xl font-black text-amber-800">{stats.upcoming}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-surface border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-soft border border-border flex items-center justify-center text-muted font-black">
            <Clock className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <div className="text-xs text-muted">Đã kết thúc</div>
            <div className="text-xl font-black text-muted">{stats.ended}</div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-surface border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pastel-mint border border-primary/20 flex items-center justify-center text-primary-dark font-black">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">Món tham gia</div>
            <div className="text-xl font-black text-foreground">{stats.totalItems}</div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên chiến dịch hoặc tên món..."
            className="pl-9 rounded-xl text-xs h-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["ALL", "ACTIVE", "UPCOMING", "ENDED", "INACTIVE"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === st
                  ? "bg-primary-tint text-primary-dark border-primary/30 shadow-2xs"
                  : "bg-surface text-muted border-border hover:bg-surface-soft"
              }`}
            >
              {st === "ALL" && "Tất cả"}
              {st === "ACTIVE" && "Đang diễn ra"}
              {st === "UPCOMING" && "Sắp diễn ra"}
              {st === "ENDED" && "Đã kết thúc"}
              {st === "INACTIVE" && "Tạm ngưng"}
            </button>
          ))}
        </div>
      </div>

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
          filteredCampaigns.map((camp) => {
            const statusInfo = getCampaignStatus(camp);
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
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>

                      <span className="text-xs text-muted flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        {camp.start_time.slice(0, 5)} - {camp.end_time.slice(0, 5)}
                      </span>

                      <span className="text-xs text-muted flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {camp.apply_date ? camp.apply_date.slice(0, 10) : "Lặp lại mỗi ngày"}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-foreground truncate">{camp.name}</h3>

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
                      onClick={() => handleToggle(camp.id)}
                      className="rounded-xl h-9 text-xs font-semibold gap-1.5"
                    >
                      {camp.is_active ? (
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(camp.items || []).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-3.5 rounded-2xl bg-surface border border-border/80 flex flex-col justify-between space-y-2 shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-foreground truncate">
                                {item.product_name || `Mã: ${item.product_id}`}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[10px] font-black shrink-0">
                                -{item.discount_percentage}%
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
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-soft"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-danger-pastel/70 border border-danger/30 text-danger-dark text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span>1. Thông Tin Khung Giờ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Tên Chiến Dịch *</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="VD: Giờ Vàng Bữa Trưa 11h - 13h"
                      className="rounded-xl text-xs h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Giờ Bắt Đầu * (HH:mm)</label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="rounded-xl text-xs h-10 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Giờ Kết Thúc * (HH:mm)</label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="rounded-xl text-xs h-10 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Ngày Áp Dụng (Để trống nếu lặp hàng ngày)</label>
                    <Input
                      type="date"
                      value={applyDate}
                      onChange={(e) => setApplyDate(e.target.value)}
                      className="rounded-xl text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="text-xs font-bold text-foreground">Trạng Thái Mở Bán</label>
                    <div className="h-10 flex items-center gap-2 px-3 rounded-xl border border-border bg-surface-soft/40">
                      <input
                        type="checkbox"
                        id="active_cb"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="active_cb" className="text-xs font-semibold text-foreground cursor-pointer">
                        Kích hoạt ngay khi lưu
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-accent" />
                    <span>2. Danh Sách Món Giờ Vàng ({items.length} món)</span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddItem()}
                    className="rounded-xl text-xs font-bold gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm món
                  </Button>
                </div>

                {items.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-border text-muted text-xs">
                    Chưa có món nào. Bấm <strong>"Thêm món"</strong> để chọn món giảm giá cho ca này.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((row, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-surface-soft/60 border border-border space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">Món #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-danger hover:text-danger-dark text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xoá món</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[11px] font-bold text-foreground">Chọn Món Sẵn Có Hoặc Nhập</label>
                            <select
                              value={row.product_id}
                              onChange={(e) => {
                                const pid = e.target.value;
                                const prod = availableProducts.find((p) => p.id === pid);
                                if (prod) {
                                  handleUpdateItem(idx, {
                                    product_id: prod.id,
                                    product_name: prod.name,
                                    original_price: prod.price,
                                  });
                                } else {
                                  handleUpdateItem(idx, { product_id: pid });
                                }
                              }}
                              className="w-full h-9 rounded-xl border border-border bg-surface px-2.5 text-xs font-medium focus:outline-hidden"
                            >
                              <option value="">-- Chọn từ sản phẩm trong DB --</option>
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatVND(p.price)})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">Mã Sản Phẩm *</label>
                            <Input
                              value={row.product_id}
                              onChange={(e) => handleUpdateItem(idx, { product_id: e.target.value })}
                              placeholder="VD: p1"
                              className="rounded-xl text-xs h-9 font-mono"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">Tên Sản Phẩm *</label>
                            <Input
                              value={row.product_name}
                              onChange={(e) => handleUpdateItem(idx, { product_name: e.target.value })}
                              placeholder="VD: Cà phê sữa đá"
                              className="rounded-xl text-xs h-9"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">Giá Gốc Niêm Yết (đ)</label>
                            <Input
                              type="number"
                              min={0}
                              value={row.original_price}
                              onChange={(e) => handleUpdateItem(idx, { original_price: Number(e.target.value) })}
                              className="rounded-xl text-xs h-9 font-mono"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">% Giảm Giá</label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={row.discount_percentage}
                              onChange={(e) => handleUpdateItem(idx, { discount_percentage: Number(e.target.value) })}
                              className="rounded-xl text-xs h-9 font-mono font-bold text-accent"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">Giá Sale Ưu Đãi (đ)</label>
                            <Input
                              type="number"
                              min={0}
                              value={row.sale_price}
                              onChange={(e) => handleUpdateItem(idx, { sale_price: Number(e.target.value) })}
                              className="rounded-xl text-xs h-9 font-mono font-bold text-danger-dark"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">Số Suất Mở Bán</label>
                            <Input
                              type="number"
                              min={1}
                              value={row.quantity_limit}
                              onChange={(e) => handleUpdateItem(idx, { quantity_limit: Number(e.target.value) })}
                              className="rounded-xl text-xs h-9 font-mono"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">Tối Đa / Khách Hàng</label>
                            <Input
                              type="number"
                              min={1}
                              value={row.max_per_user}
                              onChange={(e) => handleUpdateItem(idx, { max_per_user: Number(e.target.value) })}
                              className="rounded-xl text-xs h-9 font-mono"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-surface-soft border border-border flex items-center justify-end gap-3 shrink-0">
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
