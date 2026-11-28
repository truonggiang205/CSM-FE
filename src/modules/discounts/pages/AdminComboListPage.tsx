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
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { comboApi, Combo, CreateComboPayload } from "../../../api/comboApi";
import { productApi } from "../../../api/productApi";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Card } from "../../../components/ui/Card";
import { ProductImage } from "../../../components/ui/ProductImage";
import { ProductSearchSelect } from "../../../components/ui/ProductSearchSelect";
import { storefrontApi } from "../../../api/storefrontApi";
import { branchApi } from "../../../api/branchApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { resolveAssetUrl } from "../../../lib/assetUrl";
import { NumberInput } from "../../../components/ui/NumberInput";
import { Pagination, paginate } from "../../../components/ui/Pagination";
import { FieldError, FormErrorSummary, invalidClass } from "../../../components/ui/FieldError";
import { formatDateTimeVN, toDateTimeLocalValue } from "../../../lib/datetime";

/** Giới hạn nhập liệu — khớp với kiểm tra ở BE (discount-service). */
const COMBO_LIMITS = {
  nameMin: 3,
  nameMax: 100,
  descriptionMax: 255,
  priceMin: 1000,
  priceMax: 100_000_000,
  itemQtyMax: 99,
  maxQuantityMax: 100_000,
  imageUrlMax: 500,
};

const COMBO_FIELD_LABELS: Record<string, string> = {
  name: "Tên Combo",
  description: "Mô tả",
  image: "Ảnh combo",
  items: "Sản phẩm thành phần",
  combo_price: "Giá bán Combo",
  start_date: "Ngày bắt đầu",
  end_date: "Ngày kết thúc",
  max_quantity: "Số suất tối đa",
};

const isValidImageUrl = (url: string) => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(url) || url.startsWith("/uploads/");

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const [statusFilter, setStatusFilterRaw] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(6);
  // Đổi tìm kiếm / bộ lọc / số dòng thì quay về trang 1
  const setStatusFilter = (v: "ALL" | "ACTIVE" | "INACTIVE") => {
    setStatusFilterRaw(v);
    setPage(1);
  };
  const setPageSize = (v: number) => {
    setPageSizeRaw(v);
    setPage(1);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [comboPrice, setComboPrice] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxQuantity, setMaxQuantity] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ComboItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Ảnh tải từ máy: giữ file + ảnh xem trước, chỉ tải lên khi bấm lưu
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const resetImagePicker = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes((file.type || "").toLowerCase())) {
      setImageError("Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError(`Ảnh vượt quá 2MB (tệp hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB). Vui lòng chọn ảnh nhỏ hơn.`);
      e.target.value = "";
      return;
    }
    setImageError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

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

  /**
   * Tồn kho theo từng chi nhánh của mọi sản phẩm: productId -> { branchId: số còn bán được }.
   * Một đơn combo chỉ lấy hàng ở một chi nhánh, nên "đủ hàng" nghĩa là có ít nhất một chi nhánh đủ.
   */
  const [stockByBranch, setStockByBranch] = useState<Map<string, Record<string, number>> | null>(null);
  const [branchCount, setBranchCount] = useState(0);

  const fetchStock = async () => {
    try {
      const branches = await branchApi.getBranches();
      const rows = await Promise.all(branches.map((b) => inventoryApi.getInventoryByBranch(b.id).catch(() => [])));
      const map = new Map<string, Record<string, number>>();
      branches.forEach((b, i) => {
        for (const item of rows[i]) {
          if (!item.product_id) continue;
          const pid = String(item.product_id);
          const entry = map.get(pid) || {};
          entry[b.id] = Number(item.available) || 0;
          map.set(pid, entry);
        }
      });
      setBranchCount(branches.length);
      setStockByBranch(map);
    } catch {
      setStockByBranch(null); // không đọc được tồn kho: không chặn, BE vẫn kiểm tra lại khi lưu
    }
  };

  /** Số lượng lớn nhất một chi nhánh còn bán được của sản phẩm (null = chưa rõ). */
  const bestBranchStock = (productId: string): number | null => {
    if (!stockByBranch) return null;
    const entry = stockByBranch.get(productId);
    if (!entry) return 0;
    return Math.max(0, ...Object.values(entry));
  };

  /** Số chi nhánh đủ hàng để bán ít nhất 1 suất combo. */
  const branchesAbleToSell = (comboItems: { product_id: string; quantity: number }[]): number | null => {
    if (!stockByBranch || branchCount === 0) return null;
    const branchIds = new Set<string>();
    stockByBranch.forEach((entry) => Object.keys(entry).forEach((id) => branchIds.add(id)));
    let ok = 0;
    branchIds.forEach((bid) => {
      if (comboItems.every((ci) => (stockByBranch.get(ci.product_id)?.[bid] ?? 0) >= (Number(ci.quantity) || 1))) ok += 1;
    });
    return ok;
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
    fetchStock();
  }, []);

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const openCreateModal = () => {
    setEditingComboId(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setComboPrice(null);
    setStartDate("");
    setEndDate("");
    setMaxQuantity(null);
    setFieldErrors({});
    setFormSubmitted(false);
    setIsActive(true);
    setItems([]);
    setFormError(null);
    resetImagePicker();
    setIsModalOpen(true);
  };

  const openEditModal = (combo: Combo) => {
    setEditingComboId(combo.id);
    setName(combo.name);
    setDescription(combo.description || "");
    setImageUrl(combo.image_url || "");
    setComboPrice(Number(combo.combo_price) || null);
    // datetime-local cần giờ địa phương (toISOString là giờ UTC, lệch 7 tiếng)
    setStartDate(toDateTimeLocalValue(combo.start_date));
    setEndDate(toDateTimeLocalValue(combo.end_date));
    setMaxQuantity(combo.max_quantity !== null && combo.max_quantity !== undefined ? Number(combo.max_quantity) : null);
    setFieldErrors({});
    setFormSubmitted(false);
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
    resetImagePicker();
    setIsModalOpen(true);
  };

  // Thêm một dòng trống để người dùng tự tìm và chọn món (không tự gán món có sẵn)
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { product_id: "", product_name: "", product_image: undefined, original_price: 0, quantity: 1 },
    ]);
  };

  const handleSelectProduct = (idx: number, productId: string | null) => {
    const prod = productId ? availableProducts.find((p) => p.id === productId) : null;
    setItems((prev) =>
      prev.map((row, i) =>
        i === idx
          ? prod
            ? {
                ...row,
                product_id: prod.id,
                product_name: prod.name,
                product_image: prod.images?.[0],
                original_price: Number(prod.price) || 0,
              }
            : { ...row, product_id: "", product_name: "", product_image: undefined, original_price: 0 }
          : row
      )
    );
  };

  const productOptions = availableProducts.map((p) => {
    const best = bestBranchStock(p.id);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: Number(p.price) || 0,
      available: best ?? undefined,
      disabled: best === 0,
      disabledReason: best === 0 ? "Hết hàng ở tất cả chi nhánh" : undefined,
    };
  });

  const handleQuantityChange = (idx: number, qty: number | null) => {
    setItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, quantity: qty ?? 0 } : row))
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

  const validateCombo = (nowMs: number) => {
    const e: Record<string, string> = {};
    const L = COMBO_LIMITS;
    const n = name.trim();
    if (!n) e.name = "Vui lòng nhập tên Combo.";
    else if (n.length < L.nameMin) e.name = `Tên Combo tối thiểu ${L.nameMin} ký tự.`;
    else if (n.length > L.nameMax) e.name = `Tên Combo tối đa ${L.nameMax} ký tự (hiện tại ${n.length}).`;

    if (description.length > L.descriptionMax)
      e.description = `Mô tả tối đa ${L.descriptionMax} ký tự (hiện tại ${description.length}).`;

    const url = imageUrl.trim();
    if (!imageFile && url) {
      if (url.length > L.imageUrlMax) e.image = `URL ảnh tối đa ${L.imageUrlMax} ký tự.`;
      else if (!isValidImageUrl(url)) e.image = "URL ảnh không hợp lệ, cần bắt đầu bằng http:// hoặc https:// (VD: https://example.com/anh.jpg).";
    }
    if (imageError) e.image = imageError;

    if (items.length === 0) e.items = "Vui lòng thêm món vào combo.";
    else if (items.some((i) => !i.product_id)) e.items = "Còn dòng món chưa chọn sản phẩm. Hãy chọn sản phẩm hoặc xoá dòng đó.";
    else if (items.some((i) => !i.quantity || i.quantity < 1 || i.quantity > L.itemQtyMax))
      e.items = `Số lượng mỗi món phải từ 1 đến ${L.itemQtyMax}.`;
    else if (items.reduce((sum, i) => sum + i.quantity, 0) < 2) e.items = "Combo cần có tổng số lượng từ 2 sản phẩm trở lên.";
    else {
      const short = items.find((i) => {
        const best = bestBranchStock(i.product_id);
        return best !== null && i.quantity > best;
      });
      if (short) {
        const best = bestBranchStock(short.product_id) ?? 0;
        e.items =
          best === 0
            ? `"${short.product_name}" đã hết hàng ở tất cả chi nhánh, không thể thêm vào combo.`
            : `"${short.product_name}" chỉ còn tối đa ${best} tại một chi nhánh, không đủ ${short.quantity} cho mỗi suất combo.`;
      }
    }

    const fmt = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + "đ";
    if (comboPrice === null) e.combo_price = "Vui lòng nhập giá bán Combo, không được để trống.";
    else if (comboPrice < L.priceMin) e.combo_price = `Giá bán Combo phải từ ${fmt(L.priceMin)} trở lên.`;
    else if (comboPrice > L.priceMax) e.combo_price = `Giá bán Combo không vượt quá ${fmt(L.priceMax)}.`;
    else if (calculatedOriginalTotal > 0 && comboPrice > calculatedOriginalTotal)
      e.combo_price = `Giá bán Combo (${fmt(comboPrice)}) không được lớn hơn tổng giá gốc (${fmt(calculatedOriginalTotal)}).`;

    const startMs = startDate ? new Date(startDate).getTime() : null;
    const endMs = endDate ? new Date(endDate).getTime() : null;
    const original = editingComboId ? combos.find((c) => c.id === editingComboId) : null;
    const startChanged = !original || toDateTimeLocalValue(original.start_date) !== startDate;
    const endChanged = !original || toDateTimeLocalValue(original.end_date) !== endDate;
    if (startMs !== null && startChanged && startMs < nowMs - 60_000)
      e.start_date = `Ngày bắt đầu không được ở quá khứ (bây giờ là ${formatDateTimeVN(nowMs)}).`;
    if (endMs !== null && endChanged && endMs <= nowMs) e.end_date = "Ngày kết thúc phải ở tương lai.";
    else if (startMs !== null && endMs !== null && endMs <= startMs) e.end_date = "Ngày kết thúc phải sau ngày bắt đầu.";

    if (maxQuantity !== null && (maxQuantity < 1 || maxQuantity > L.maxQuantityMax))
      e.max_quantity = `Số suất tối đa từ 1 đến ${new Intl.NumberFormat("vi-VN").format(L.maxQuantityMax)} (để trống nếu không giới hạn).`;
    return e;
  };

  // Sau lần bấm lưu đầu tiên, lỗi được cập nhật ngay khi người dùng sửa
  useEffect(() => {
    if (formSubmitted) setFieldErrors(validateCombo(Date.now()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSubmitted, name, description, imageUrl, imageFile, imageError, items, comboPrice, startDate, endDate, maxQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitted(true);
    const found = validateCombo(Date.now());
    setFieldErrors(found);
    if (Object.keys(found).length > 0) return;

    let finalImageUrl = imageUrl.trim();
    if (imageFile) {
      try {
        setSubmitting(true);
        finalImageUrl = await storefrontApi.uploadImage(imageFile);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "Tải ảnh combo thất bại";
        setImageError(Array.isArray(msg) ? msg.join(", ") : msg);
        setSubmitting(false);
        return;
      }
    }

    const payload: CreateComboPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      image_url: finalImageUrl || undefined,
      combo_price: Number(comboPrice),
      original_price: calculatedOriginalTotal,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      max_quantity: maxQuantity,
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchCombos();
              fetchStock();
            }}
            className="rounded-xl gap-1.5"
          >
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
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
        <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginate(filteredCombos, page, pageSize).map((combo) => {
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
                    <h3 className="font-black text-base text-foreground line-clamp-1 break-all" title={combo.name}>{combo.name}</h3>
                    {combo.description && (
                      <p className="text-xs text-muted line-clamp-2 mt-0.5">{combo.description}</p>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-soft border border-border/60 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Món thành phần ({combo.items?.length || 0})
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
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
                      {(() => {
                        const able = branchesAbleToSell(combo.items || []);
                        if (able === null) return null;
                        return able === 0 ? (
                          <div className="font-semibold text-danger-dark">Không đủ tồn kho ở chi nhánh nào</div>
                        ) : (
                          <div>
                            Đủ hàng: <strong className="text-foreground">{able}/{branchCount}</strong> chi nhánh
                          </div>
                        );
                      })()}
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
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredCombos.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[6, 12, 24, 48]}
          unit="combo"
        />
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
            <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-6">
              {formError && (
                <div className="mb-4 p-3 rounded-2xl bg-danger-pastel border border-danger/30 text-danger-dark text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSubmitted && (
                <div className="mb-4">
                  <FormErrorSummary
                    errors={fieldErrors}
                    order={["name", "description", "image", "items", "combo_price", "start_date", "end_date", "max_quantity"]}
                    labels={COMBO_FIELD_LABELS}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Form Inputs */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-3 p-4 rounded-2xl bg-surface-soft border border-border/60">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">
                      1. Thông tin Combo
                    </h3>
                    <div data-field="name">
                      <label className="text-xs font-bold text-foreground block mb-1">Tên Combo *</label>
                      <Input
                        maxLength={COMBO_LIMITS.nameMax}
                        placeholder="Ví dụ: Combo Bữa Sáng Năng Lượng"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        aria-invalid={!!fieldErrors.name || undefined}
                        className={`rounded-xl bg-surface text-xs ${invalidClass(fieldErrors.name)}`}
                      />
                      <FieldError message={fieldErrors.name} />
                    </div>
                    <div data-field="description">
                      <label className="text-xs font-bold text-foreground block mb-1">Mô tả ngắn</label>
                      <Input
                        maxLength={COMBO_LIMITS.descriptionMax}
                        placeholder="Ví dụ: Bánh mì giòn nóng kèm cà phê sữa thơm béo, tiết kiệm 9k"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`rounded-xl bg-surface text-xs ${invalidClass(fieldErrors.description)}`}
                      />
                      <FieldError message={fieldErrors.description} />
                    </div>
                    <div className="space-y-2" data-field="image">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" /> Ảnh đại diện Combo (tuỳ chọn)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl border border-border bg-surface overflow-hidden flex items-center justify-center shrink-0">
                          {imagePreview || imageUrl.trim() ? (
                            <img
                              src={imagePreview || resolveAssetUrl(imageUrl.trim())}
                              alt="Ảnh combo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-muted" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border bg-surface hover:bg-surface-soft cursor-pointer text-xs font-semibold">
                            <Upload className="w-3.5 h-3.5 text-primary" />
                            <span>Chọn ảnh từ máy (JPG, PNG, WEBP ≤ 2MB)</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              className="hidden"
                              onChange={handleImageFileChange}
                            />
                          </label>
                          {imageFile && (
                            <button
                              type="button"
                              onClick={resetImagePicker}
                              className="text-xs text-muted hover:text-danger"
                            >
                              Bỏ ảnh đã chọn
                            </button>
                          )}
                        </div>
                      </div>
                      {imageFile && (
                        <p className="text-[11px] text-muted truncate">
                          {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB) — sẽ tải lên khi lưu combo
                        </p>
                      )}
                      <Input
                        maxLength={COMBO_LIMITS.imageUrlMax}
                        placeholder="Hoặc dán URL ảnh (https://...). Để trống để tự ghép ảnh các món thành phần"
                        value={imageUrl}
                        disabled={!!imageFile}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className={`rounded-xl bg-surface text-xs ${invalidClass(fieldErrors.image)}`}
                      />
                      <FieldError message={fieldErrors.image || imageError} />
                    </div>
                  </div>

                  {/* Items Builder */}
                  <div
                    data-field="items"
                    className={`space-y-3 p-4 rounded-2xl bg-surface-soft border ${fieldErrors.items ? "border-danger ring-1 ring-danger/30" : "border-border/60"}`}
                  >
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
                        Chưa có món nào. Bấm "Thêm món vào Combo" rồi gõ tên hoặc mã SKU để tìm sản phẩm.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 -mr-1">
                        {items.map((row, idx) => (
                          <div
                            key={idx}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-xl bg-surface border border-border/80"
                          >
                            <ProductSearchSelect
                              className="flex-1 min-w-[180px]"
                              options={productOptions}
                              value={row.product_id}
                              onChange={(opt) => handleSelectProduct(idx, opt?.id ?? null)}
                              excludeIds={items.filter((_, i) => i !== idx).map((i) => i.product_id).filter(Boolean)}
                              showPrice
                            />
                            {row.product_id && bestBranchStock(row.product_id) !== null && (
                              <span
                                className={`text-[10px] font-semibold whitespace-nowrap ${
                                  row.quantity > (bestBranchStock(row.product_id) ?? 0) ? "text-danger-dark" : "text-muted"
                                }`}
                                title="Số lượng lớn nhất còn bán được tại một chi nhánh"
                              >
                                Kho: {bestBranchStock(row.product_id)}
                              </span>
                            )}

                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted font-semibold">SL:</span>
                              <NumberInput
                                value={row.quantity || null}
                                onValueChange={(v) => handleQuantityChange(idx, v)}
                                maxDigits={2}
                                invalid={formSubmitted && (!row.quantity || row.quantity < 1)}
                                wrapperClassName="w-16"
                                className="h-9 rounded-lg text-xs text-center font-bold px-2"
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

                    <FieldError message={fieldErrors.items} />
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
                      <div data-field="combo_price">
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Giá bán Combo (VNĐ) *
                        </label>
                        <NumberInput
                          value={comboPrice}
                          onValueChange={setComboPrice}
                          thousandSeparator
                          maxDigits={9}
                          suffix="đ"
                          placeholder="Từ 1.000đ, không lớn hơn tổng giá gốc"
                          invalid={!!fieldErrors.combo_price}
                          className="rounded-xl bg-surface text-xs font-bold"
                        />
                        <FieldError message={fieldErrors.combo_price} />
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
                      <div data-field="start_date">
                        <label className="text-xs font-bold text-foreground block mb-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Ngày bắt đầu
                        </label>
                        <Input
                          type="datetime-local"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={`rounded-xl bg-surface text-xs ${invalidClass(fieldErrors.start_date)}`}
                        />
                        <FieldError message={fieldErrors.start_date} />
                      </div>
                      <div data-field="end_date">
                        <label className="text-xs font-bold text-foreground block mb-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Ngày kết thúc
                        </label>
                        <Input
                          type="datetime-local"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={`rounded-xl bg-surface text-xs ${invalidClass(fieldErrors.end_date)}`}
                        />
                        <FieldError message={fieldErrors.end_date} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div data-field="max_quantity">
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Số lượng suất tối đa (tuỳ chọn)
                        </label>
                        <NumberInput
                          value={maxQuantity}
                          onValueChange={setMaxQuantity}
                          thousandSeparator
                          maxDigits={6}
                          placeholder="Không giới hạn"
                          invalid={!!fieldErrors.max_quantity}
                          className="rounded-xl bg-surface text-xs"
                        />
                        <FieldError message={fieldErrors.max_quantity} />
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
                      <h4 className="text-lg font-black text-foreground line-clamp-2 break-words">
                        {name.trim() || "Tên Combo của bạn"}
                      </h4>
                      <p className="text-xs text-muted line-clamp-2 mt-0.5">
                        {description.trim() || "Mô tả ngắn hấp dẫn về gói combo tiết kiệm..."}
                      </p>
                    </div>

                    <div className="py-4 px-3 rounded-2xl bg-surface-soft border border-border/60">
                      <div className="flex items-center justify-center flex-wrap gap-2 max-h-56 overflow-y-auto">
                        {items.length === 0 ? (
                          <span className="text-xs text-muted">Chưa chọn sản phẩm</span>
                        ) : (
                          items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {idx > 0 && <Plus className="w-3.5 h-3.5 text-primary shrink-0" />}
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
                            </div>
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

