import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Package,
  Sparkles,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import { comboApi, Combo, CreateComboPayload } from "../../../api/comboApi";
import { productApi } from "../../../api/productApi";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Card } from "../../../components/ui/Card";
import { ProductImage } from "../../../components/ui/ProductImage";

interface ComboItemRow {
  product_id: string;
  product_name: string;
  product_image?: string;
  original_price: number;
  quantity: number;
}

export function AdminComboListPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [comboPrice, setComboPrice] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxQuantity, setMaxQuantity] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ComboItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const data = await comboApi.getAllCombos();
      setCombos(data);
    } catch {
      setCombos([]);
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
    fetchCombos();
    fetchProducts();
  }, []);

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const openCreateModal = () => {
    setEditingComboId(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setComboPrice(0);
    setStartDate("");
    setEndDate("");
    setMaxQuantity("");
    setIsActive(true);
    setItems([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (combo: Combo) => {
    setEditingComboId(combo.id);
    setName(combo.name);
    setDescription(combo.description || "");
    setImageUrl(combo.image_url || "");
    setComboPrice(Number(combo.combo_price) || 0);
    setStartDate(combo.start_date ? new Date(combo.start_date).toISOString().slice(0, 16) : "");
    setEndDate(combo.end_date ? new Date(combo.end_date).toISOString().slice(0, 16) : "");
    setMaxQuantity(combo.max_quantity !== null && combo.max_quantity !== undefined ? String(combo.max_quantity) : "");
    setIsActive(combo.is_active);
    setItems(
      (combo.items || []).map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name || i.product_id,
        product_image: i.product_image || undefined,
        original_price: Number(i.original_price) || 0,
        quantity: Number(i.quantity) || 1,
      }))
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    if (availableProducts.length === 0) return;
    const unused = availableProducts.find((p) => !items.some((i) => i.product_id === p.id)) || availableProducts[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: unused.id,
        product_name: unused.name,
        product_image: unused.images?.[0],
        original_price: Number(unused.price) || 0,
        quantity: 1,
      },
    ]);
  };

  const handleSelectProduct = (idx: number, productId: string) => {
    const prod = availableProducts.find((p) => p.id === productId);
    if (!prod) return;
    setItems((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              product_id: prod.id,
              product_name: prod.name,
              product_image: prod.images?.[0],
              original_price: Number(prod.price) || 0,
            }
          : row
      )
    );
  };

  const handleQuantityChange = (idx: number, qty: number) => {
    setItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, quantity: Math.max(1, qty) } : row))
    );
  };

  const handleRemoveItemRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const calculatedOriginalTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.original_price * item.quantity, 0),
    [items]
  );

  const calculatedSavings = Math.max(0, calculatedOriginalTotal - (Number(comboPrice) || 0));
  const calculatedDiscountPct =
    calculatedOriginalTotal > 0 ? Math.round((calculatedSavings / calculatedOriginalTotal) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Vui lòng nhập tên Combo.");
      return;
    }

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    if (items.length === 0 || totalQty < 2) {
      setFormError("Combo cần có tổng số lượng từ 2 sản phẩm trở lên.");
      return;
    }

    if (comboPrice <= 0) {
      setFormError("Vui lòng nhập giá bán Combo hợp lệ (> 0).");
      return;
    }

    if (calculatedOriginalTotal > 0 && comboPrice > calculatedOriginalTotal) {
      setFormError("Giá bán Combo không được lớn hơn tổng giá gốc.");
      return;
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      setFormError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    const payload: CreateComboPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      combo_price: Number(comboPrice),
      original_price: calculatedOriginalTotal,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      max_quantity: maxQuantity.trim() ? Number(maxQuantity) : null,
      is_active: isActive,
      items: items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        product_image: i.product_image,
        original_price: i.original_price,
        quantity: i.quantity,
      })),
    };

    try {
      setSubmitting(true);
      if (editingComboId) {
        await comboApi.updateCombo(editingComboId, payload);
      } else {
        await comboApi.createCombo(payload);
      }
      setIsModalOpen(false);
      await fetchCombos();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Không thể lưu Combo";
      setFormError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await comboApi.toggleCombo(id);
      await fetchCombos();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await comboApi.deleteCombo(id);
      setDeleteConfirmId(null);
      await fetchCombos();
    } catch {
      // ignore
    }
  };

  const filteredCombos = useMemo(() => {
    return combos.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && c.is_active) ||
        (statusFilter === "INACTIVE" && !c.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [combos, searchQuery, statusFilter]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </span>
            <span>Quản Lý Combo Khuyến Mãi</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Tạo các gói Combo ghép món ưu đãi để tăng giá trị đơn hàng (Up-sell & Cross-sell).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchCombos} className="rounded-xl gap-1.5">
            <RefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </Button>
          <Button onClick={openCreateModal} className="rounded-xl gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Tạo Combo Mới</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Tìm theo tên combo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-surface-soft text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-primary-tint text-primary-dark border-primary/30"
                  : "bg-surface text-muted border-border hover:bg-surface-soft"
              }`}
            >
              {st === "ALL" ? "Tất cả" : st === "ACTIVE" ? "Đang mở bán" : "Tạm tắt"}
            </button>
          ))}
        </div>
      </Card>

      {/* Combo List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-surface-soft border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredCombos.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl space-y-3">
          <Package className="w-10 h-10 text-muted mx-auto" />
          <h3 className="font-bold text-base text-foreground">Chưa có Combo nào</h3>
          <p className="text-xs text-muted">Nhấn "+ Tạo Combo Mới" để thiết lập gói combo đầu tiên.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCombos.map((combo) => {
            const orig = Number(combo.original_price) || 0;
            const price = Number(combo.combo_price) || 0;
            const save = Math.max(0, orig - price);
            const pct = orig > 0 ? Math.round((save / orig) * 100) : 0;

            return (
              <Card key={combo.id} className="p-5 rounded-3xl flex flex-col justify-between gap-4 border border-border/80">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        combo.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-surface-soft text-muted border-border"
                      }`}
                    >
                      {combo.is_active ? "Đang mở bán" : "Đã tắt"}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      -{pct}% ({formatVND(save)})
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base text-foreground line-clamp-1">{combo.name}</h3>
                    {combo.description && (
                      <p className="text-xs text-muted line-clamp-2 mt-0.5">{combo.description}</p>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-soft border border-border/60 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Món thành phần ({combo.items?.length || 0})
                    </div>
                    {(combo.items || []).map((ci, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground truncate">
                          {ci.quantity}x {ci.product_name || ci.product_id}
                        </span>
                        <span className="text-muted font-mono shrink-0">
                          {formatVND(Number(ci.original_price) * ci.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-muted line-through block text-[11px]">
                        {formatVND(orig)}
                      </span>
                      <span className="text-lg font-black text-rose-600 font-mono">
                        {formatVND(price)}
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-muted">
                      <div>Đã bán: <strong className="text-foreground">{combo.sold_count || 0}</strong></div>
                      {combo.max_quantity && <div>Tối đa: {combo.max_quantity} suất</div>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(combo.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary cursor-pointer"
                  >
                    {combo.is_active ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-muted" />
                    )}
                    <span>{combo.is_active ? "Đang bật" : "Đang tắt"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(combo)}
                      className="rounded-xl h-8 px-2.5 text-xs gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </Button>
                    {deleteConfirmId === combo.id ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(combo.id)}
                        className="rounded-xl h-8 px-2.5 text-xs"
                      >
                        Xác nhận xoá
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(combo.id)}
                        className="rounded-xl h-8 px-2.5 text-xs text-danger hover:bg-danger-pastel/60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal with Live Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-black text-foreground">
                  {editingComboId ? "Chỉnh sửa Combo Khuyến Mãi" : "Tạo Combo Mua Hàng Mới"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-surface-soft text-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {formError && (
                <div className="mb-4 p-3 rounded-2xl bg-danger-pastel border border-danger/30 text-danger-dark text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Form Inputs */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-3 p-4 rounded-2xl bg-surface-soft border border-border/60">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">
                      1. Thông tin Combo
                    </h3>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Tên Combo *</label>
                      <Input
                        required
                        placeholder="Ví dụ: Combo Bữa Sáng Năng Lượng"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-xl bg-surface text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Mô tả ngắn</label>
                      <Input
                        placeholder="Ví dụ: Bánh mì giòn nóng kèm cà phê sữa thơm béo, tiết kiệm 9k"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-xl bg-surface text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        Ảnh đại diện Combo (URL - tuỳ chọn)
                      </label>
                      <Input
                        placeholder="Để trống để tự ghép ảnh các món thành phần"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="rounded-xl bg-surface text-xs"
                      />
                    </div>
                  </div>

                  {/* Items Builder */}
                  <div className="space-y-3 p-4 rounded-2xl bg-surface-soft border border-border/60">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">
                        2. Sản phẩm thành phần
                      </h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="soft"
                        onClick={handleAddItemRow}
                        className="rounded-xl text-xs h-8 gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm món vào Combo</span>
                      </Button>
                    </div>

                    {items.length === 0 ? (
                      <div className="text-center py-4 text-xs text-muted border border-dashed border-border rounded-xl">
                        Chưa có món nào. Bấm "+ Thêm món vào Combo" để chọn sản phẩm.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {items.map((row, idx) => (
                          <div
                            key={idx}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-xl bg-surface border border-border/80"
                          >
                            <select
                              value={row.product_id}
                              onChange={(e) => handleSelectProduct(idx, e.target.value)}
                              className="flex-1 min-w-[160px] h-9 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground"
                            >
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatVND(p.price)})
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted font-semibold">SL:</span>
                              <Input
                                type="number"
                                min={1}
                                value={row.quantity}
                                onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                                className="w-16 h-9 rounded-lg text-xs text-center font-bold"
                              />
                            </div>

                            <span className="text-xs font-mono font-bold text-primary-dark min-w-[75px] text-right">
                              {formatVND(row.original_price * row.quantity)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-pastel/60 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                      <span className="font-semibold text-muted">Tổng giá trị gốc:</span>
                      <span className="font-black text-sm text-foreground font-mono">
                        {formatVND(calculatedOriginalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Quota */}
                  <div className="space-y-3 p-4 rounded-2xl bg-surface-soft border border-border/60">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">
                      3. Thiết lập Giá Combo & Thời hạn
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Giá bán Combo (VNĐ) *
                        </label>
                        <Input
                          type="number"
                          min={1000}
                          step={500}
                          required
                          value={comboPrice || ""}
                          onChange={(e) => setComboPrice(Number(e.target.value))}
                          className="rounded-xl bg-surface text-xs font-bold"
                        />
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">
                          Khách tiết kiệm được
                        </span>
                        <span className="text-sm font-black text-emerald-700 font-mono">
                          {formatVND(calculatedSavings)} (-{calculatedDiscountPct}%)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Ngày bắt đầu
                        </label>
                        <Input
                          type="datetime-local"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="rounded-xl bg-surface text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Ngày kết thúc
                        </label>
                        <Input
                          type="datetime-local"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="rounded-xl bg-surface text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Số lượng suất tối đa (tuỳ chọn)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Không giới hạn"
                          value={maxQuantity}
                          onChange={(e) => setMaxQuantity(e.target.value)}
                          className="rounded-xl bg-surface text-xs"
                        />
                      </div>
                      <label className="flex items-center gap-2 pt-4 cursor-pointer text-xs font-bold text-foreground">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <span>Kích hoạt mở bán ngay</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right: Live Preview Card */}
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-0">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-muted">
                    Xem trước thẻ Combo trên trang chủ
                  </div>
                  <div className="bg-surface rounded-3xl border border-border/80 shadow-card p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full border bg-amber-100 text-amber-800 border-amber-300">
                        TIẾT KIỆM {formatVND(calculatedSavings)}
                        {calculatedDiscountPct > 0 ? ` (-${calculatedDiscountPct}%)` : ""}
                      </span>
                      {maxQuantity && (
                        <span className="text-[11px] font-bold text-muted font-mono">
                          Còn {maxQuantity} suất
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-foreground">
                        {name.trim() || "Tên Combo của bạn"}
                      </h4>
                      <p className="text-xs text-muted line-clamp-2 mt-0.5">
                        {description.trim() || "Mô tả ngắn hấp dẫn về gói combo tiết kiệm..."}
                      </p>
                    </div>

                    <div className="py-4 px-3 rounded-2xl bg-surface-soft border border-border/60">
                      <div className="flex items-center justify-center flex-wrap gap-2">
                        {items.length === 0 ? (
                          <span className="text-xs text-muted">Chưa chọn sản phẩm</span>
                        ) : (
                          items.map((item, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <Plus className="w-3.5 h-3.5 text-primary" />}
                              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-surface border border-border/70 w-24 relative">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-soft mb-1">
                                  <ProductImage
                                    src={item.product_image}
                                    alt={item.product_name}
                                    productName={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="text-[10px] font-bold line-clamp-1 w-full">
                                  {item.product_name}
                                </span>
                                <span className="text-[9px] text-muted">
                                  x{item.quantity} · {formatVND(item.original_price)}
                                </span>
                              </div>
                            </React.Fragment>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-muted line-through">
                          {formatVND(calculatedOriginalTotal)}
                        </div>
                        <div className="text-xl font-black text-rose-600 font-mono">
                          {formatVND(Number(comboPrice) || 0)}
                        </div>
                      </div>
                      <Button type="button" size="sm" className="rounded-2xl text-xs gap-1.5 pointer-events-none">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Thêm Combo Vào Giỏ</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl"
                >
                  Huỷ
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl px-6">
                  {submitting ? "Đang lưu..." : editingComboId ? "Cập nhật Combo" : "Tạo Combo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

