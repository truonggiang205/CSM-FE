import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Tag,
  ShieldAlert,
  Eye,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { productApi } from "../../../api/productApi";
import { Product, Category } from "../../../types/product";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { useAuthStore } from "../../../store/useAuthStore";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Pagination, paginate } from "../../../components/ui/Pagination";
import { ProductSearchSelect } from "../../../components/ui/ProductSearchSelect";
import { getStockSummaries, StockSummary } from "../../../lib/stock";
import { formatDateTimeVN } from "../../../lib/datetime";
import { NumberInput } from "../../../components/ui/NumberInput";
import { FieldError, FormErrorSummary, invalidClass } from "../../../components/ui/FieldError";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface ProductFormData {
  name: string;
  sku: string;
  base_price: number | null;
  category_id: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

const emptyFormData: ProductFormData = {
  name: "",
  sku: "",
  base_price: null,
  category_id: "",
  description: "",
  image_url: "",
  is_active: true,
};

/** Giới hạn nhập liệu — khớp với kiểm tra ở BE (product-service). */
const PRODUCT_LIMITS = {
  nameMin: 2,
  nameMax: 150,
  descriptionMax: 1000,
  priceMin: 1000,
  priceMax: 100_000_000,
  imageUrlMax: 500,
};

type ProductField = "name" | "base_price" | "category_id" | "description" | "image";
const PRODUCT_FIELD_ORDER: ProductField[] = ["name", "base_price", "category_id", "description", "image"];
const PRODUCT_FIELD_LABELS: Record<ProductField, string> = {
  name: "Tên sản phẩm",
  base_price: "Giá niêm yết",
  category_id: "Danh mục",
  description: "Mô tả",
  image: "Hình ảnh",
};

/** Mã SKU tự sinh: SP-yymmdd-XXXX (khoá, không cho sửa tay). BE kiểm tra trùng khi lưu. */
const generateSku = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
  return `SP-${ymd}-${rand}`;
};

const fmtVnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

function validateProductForm(f: ProductFormData, categoryIds: Set<string>): Partial<Record<ProductField, string>> {
  const e: Partial<Record<ProductField, string>> = {};
  const L = PRODUCT_LIMITS;
  const name = f.name.trim();
  if (!name) e.name = "Vui lòng nhập tên sản phẩm.";
  else if (name.length < L.nameMin) e.name = `Tên sản phẩm tối thiểu ${L.nameMin} ký tự.`;
  else if (name.length > L.nameMax) e.name = `Tên sản phẩm tối đa ${L.nameMax} ký tự (hiện tại ${name.length}).`;

  if (f.base_price === null) e.base_price = "Vui lòng nhập giá niêm yết.";
  else if (f.base_price < L.priceMin) e.base_price = `Giá niêm yết phải từ ${fmtVnd(L.priceMin)} trở lên.`;
  else if (f.base_price > L.priceMax) e.base_price = `Giá niêm yết không vượt quá ${fmtVnd(L.priceMax)}.`;

  if (!f.category_id) e.category_id = "Vui lòng chọn danh mục trong danh sách.";
  else if (!categoryIds.has(f.category_id)) e.category_id = "Danh mục không hợp lệ, vui lòng chọn lại trong danh sách.";

  if (f.description.length > L.descriptionMax)
    e.description = `Mô tả tối đa ${L.descriptionMax} ký tự (hiện tại ${f.description.length}).`;

  const url = f.image_url.trim();
  if (url) {
    if (url.length > L.imageUrlMax) e.image = `URL hình ảnh tối đa ${L.imageUrlMax} ký tự.`;
    else if (!/^https?:\/\/\S+$/i.test(url) && !url.startsWith("/uploads/"))
      e.image = "URL hình ảnh phải bắt đầu bằng http:// hoặc https://.";
  }
  return e;
}

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function resolveImageUrl(url?: string): string {
  if (!url) {
    return "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=150&q=80";
  }
  if (url.startsWith("/uploads/")) {
    const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    const origin = rawApiUrl.replace(/\/api\/v1\/?$/, "");
    return `${origin}${url}`;
  }
  return url;
}

export function AdminProductListPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Bộ lọc từ URL
  const searchQuery = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "ALL";
  const rawStatus = searchParams.get("status");
  const statusFilter: StatusFilter = rawStatus === "ACTIVE" || rawStatus === "INACTIVE" ? rawStatus : "ALL";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const sizeParam = parseInt(searchParams.get("size") || "10", 10);
  const pageSize = [5, 10, 20, 50].includes(sizeParam) ? sizeParam : 10;

  // Xem chi tiết, tạm ngưng / mở bán lại
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [statusTarget, setStatusTarget] = useState<Product | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [stockMap, setStockMap] = useState<Record<string, StockSummary>>({});

  // Modal thêm/sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProductField, string>>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  // Upload ảnh & preview
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal xác nhận xóa
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const updateSearchParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (
      !value ||
      ((key === "category" || key === "status") && value === "ALL") ||
      (key === "page" && value === "1") ||
      (key === "size" && value === "10")
    ) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // Nếu đổi filter thì reset page về 1
    if (key !== "page") {
      next.delete("page");
    }
    setSearchParams(next, { replace: true });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Tải danh sách sản phẩm và danh mục từ API thật
  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        productApi.getProducts({ all: true, includeInactive: true }),
        productApi.getCategories(),
      ]);
      setProducts(fetchedProducts || []);
      setCategories(fetchedCategories || []);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải danh sách sản phẩm từ máy chủ. Vui lòng thử lại.";
      setFetchError(errMsg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dọn dẹp object URL preview ảnh khi unmount hoặc đổi file
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Lọc sản phẩm theo tìm kiếm và danh mục
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      if (q) {
        const name = (p.name || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const matchesSearch = name.includes(q) || sku.includes(q) || desc.includes(q);
        if (!matchesSearch) return false;
      }

      if (selectedCategory !== "ALL") {
        const catId = p.category?.id || (typeof p.category === "string" ? p.category : "");
        const catSlug = p.category?.slug || "";
        const catName = (p.category?.name || "").toLowerCase();

        const matchesCat =
          catId === selectedCategory ||
          catSlug === selectedCategory ||
          catName === selectedCategory.toLowerCase();

        if (!matchesCat) return false;
      }

      if (statusFilter === "ACTIVE" && p.isActive === false) return false;
      if (statusFilter === "INACTIVE" && p.isActive !== false) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = paginate(filteredProducts, currentPage, pageSize);

  const stats = useMemo(() => {
    const inactive = products.filter((p) => p.isActive === false).length;
    return { total: products.length, active: products.length - inactive, inactive };
  }, [products]);

  // Tồn kho của các sản phẩm đang hiển thị (có cache 30 giây ở lib/stock).
  const pageIdsKey = paginatedProducts.map((p) => p.id).join(",");
  useEffect(() => {
    if (!pageIdsKey) return;
    let cancelled = false;
    getStockSummaries(pageIdsKey.split(",")).then((res) => {
      if (!cancelled) setStockMap((prev) => ({ ...prev, ...res }));
    });
    return () => {
      cancelled = true;
    };
  }, [pageIdsKey]);

  const renderStock = (productId: string) => {
    const s = stockMap[productId];
    if (!s) return <span className="text-muted">...</span>;
    if (!Number.isFinite(s.totalAvailable)) return <span className="text-muted">Không rõ</span>;
    if (s.totalAvailable <= 0) return <span className="text-danger-dark font-semibold">Hết hàng</span>;
    return <span className="font-mono text-foreground">{s.totalAvailable}</span>;
  };

  const handleConfirmStatus = async () => {
    if (!statusTarget) return;
    const nextActive = statusTarget.isActive === false;
    setStatusLoading(true);
    try {
      const updated = await productApi.updateProductStatus(statusTarget.id, nextActive);
      setProducts((prev) =>
        prev.map((p) => (p.id === statusTarget.id ? { ...p, ...updated, isActive: nextActive } : p)),
      );
      setViewingProduct((v) => (v && v.id === statusTarget.id ? { ...v, isActive: nextActive } : v));
      showToast(
        nextActive
          ? `Đã mở bán lại "${statusTarget.name}".`
          : `Đã tạm ngưng "${statusTarget.name}". Khách hàng sẽ không thấy và không đặt được sản phẩm này.`,
        "success",
      );
      setStatusTarget(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không đổi được trạng thái sản phẩm";
      showToast(Array.isArray(msg) ? msg.join(", ") : msg, "error");
    } finally {
      setStatusLoading(false);
    }
  };

  // Mở modal thêm mới
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      ...emptyFormData,
      sku: generateSku(),
    });
    setFieldErrors({});
    setFormSubmitted(false);
    setSelectedImageFile(null);
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku || `SKU-${p.id.slice(0, 6)}`,
      base_price: p.price,
      category_id: p.category?.id || "",
      description: p.description || "",
      image_url: p.images?.[0] && !p.images[0].startsWith("/uploads/") ? p.images[0] : "",
      is_active: p.isActive !== false,
    });
    setFieldErrors({});
    setFormSubmitted(false);
    setSelectedImageFile(null);
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(p.images?.[0] ? resolveImageUrl(p.images[0]) : null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Xử lý chọn tệp hình ảnh với kiểm tra 2MB và định dạng
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Kiểm tra kích thước tối đa 2MB
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setFieldErrors((prev) => ({
        ...prev,
        image: `Dung lượng ảnh vượt quá 2MB (tệp hiện tại: ${sizeMB}MB). Vui lòng chọn ảnh nhỏ hơn.`,
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Kiểm tra định dạng (.jpg, .jpeg, .png, .webp)
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const mime = (file.type || "").toLowerCase();

    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mime);

    if (!isExtAllowed || !isMimeAllowed) {
      setFieldErrors((prev) => ({ ...prev, image: "Chỉ chấp nhận tệp hình ảnh định dạng JPG, PNG hoặc WEBP." }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Tệp hợp lệ: tạo preview
    setFieldErrors((prev) => ({ ...prev, image: undefined }));
    setSelectedImageFile(file);
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
  };

  const handleClearSelectedImage = () => {
    setSelectedImageFile(null);
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(editingProduct?.images?.[0] ? resolveImageUrl(editingProduct.images[0]) : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit form tạo/sửa dùng API thật (POST /products, PUT /products/:id, POST /products/:id/image)
  const categoryIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories]);

  const updateForm = (patch: Partial<ProductFormData>) => {
    const next = { ...formData, ...patch };
    setFormData(next);
    if (formSubmitted) {
      setFieldErrors((prev) => {
        const v = validateProductForm(next, categoryIds);
        // Lỗi ảnh do chọn tệp (2MB / sai định dạng) giữ nguyên cho tới khi chọn tệp khác hoặc nhập URL.
        if (!v.image && prev.image && !("image_url" in patch)) v.image = prev.image;
        return v;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitted(true);
    const found = validateProductForm(formData, categoryIds);
    // Giữ lỗi ảnh (2MB / sai định dạng) đã báo khi chọn tệp
    if (!found.image && fieldErrors.image && !formData.image_url.trim()) found.image = fieldErrors.image;
    setFieldErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setConfirmSave(true);
  };

  const doSave = async () => {
    setConfirmSave(false);
    setFormLoading(true);
    try {
      let savedProduct: Product;

      if (editingProduct) {
        // Cập nhật sản phẩm qua PUT /products/:id
        savedProduct = await productApi.updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          base_price: Number(formData.base_price),
          is_active: formData.is_active,
          category_id: formData.category_id || undefined,
          description: formData.description.trim() || undefined,
          image_url: formData.image_url.trim() || undefined,
        });

        // Tải ảnh qua POST /products/:id/image nếu có chọn file
        if (selectedImageFile) {
          try {
            const uploadRes = await productApi.uploadProductImage(editingProduct.id, selectedImageFile);
            if (uploadRes?.image_url) {
              savedProduct.images = [uploadRes.image_url];
            }
          } catch (uploadErr: any) {
            const uploadErrMsg =
              uploadErr?.response?.data?.message ||
              uploadErr?.message ||
              "Tải ảnh sản phẩm thất bại";
            showToast(`Cập nhật thông tin thành công, nhưng tải ảnh lỗi: ${uploadErrMsg}`, "error");
            setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? savedProduct : p)));
            setIsModalOpen(false);
            return;
          }
        }

        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? savedProduct : p)));
        showToast(`Đã cập nhật sản phẩm "${savedProduct.name}" thành công!`, "success");
      } else {
        // Tạo sản phẩm mới qua POST /products
        savedProduct = await productApi.createProduct({
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          base_price: Number(formData.base_price),
          is_active: formData.is_active,
          category_id: formData.category_id || undefined,
          description: formData.description.trim() || undefined,
          image_url: formData.image_url.trim() || undefined,
        });

        // Tải ảnh qua POST /products/:id/image nếu có chọn file
        if (selectedImageFile && savedProduct.id) {
          try {
            const uploadRes = await productApi.uploadProductImage(savedProduct.id, selectedImageFile);
            if (uploadRes?.image_url) {
              savedProduct.images = [uploadRes.image_url];
            }
          } catch (uploadErr: any) {
            const uploadErrMsg =
              uploadErr?.response?.data?.message ||
              uploadErr?.message ||
              "Tải ảnh sản phẩm thất bại";
            showToast(`Tạo sản phẩm thành công, nhưng tải ảnh lỗi: ${uploadErrMsg}`, "error");
            setProducts((prev) => [savedProduct, ...prev]);
            setIsModalOpen(false);
            return;
          }
        }

        setProducts((prev) => [savedProduct, ...prev]);
        showToast(`Đã tạo sản phẩm mới "${savedProduct.name}" thành công!`, "success");
      }

      setIsModalOpen(false);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi lưu thông tin sản phẩm trên máy chủ";
      setFormError(Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  // Xác nhận xóa sản phẩm qua DELETE /products/:id
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      await productApi.deleteProduct(deletingProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      showToast(`Đã xóa sản phẩm "${deletingProduct.name}" thành công!`, "success");
      setDeletingProduct(null);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể xóa sản phẩm. Có thể sản phẩm đang tồn tại trong đơn hàng hoặc tồn kho.";
      showToast(errMsg, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Kiểm tra quyền ADMIN
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="p-8 text-center space-y-4 rounded-3xl border-border bg-surface shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-danger-pastel border border-danger/20 flex items-center justify-center text-danger">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Truy cập bị giới hạn</h2>
          <p className="text-sm text-muted">
            Khu vực Quản lý sản phẩm chỉ dành cho vai trò <b className="text-foreground">Quản trị viên (ADMIN)</b> của hệ thống CSM.
          </p>
          <div className="pt-2">
            <Link to="/admin">
              <Button variant="outline" className="rounded-xl">
                &larr; Về Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề & nút hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Quản lý Sản phẩm
          </h1>
          <p className="text-sm text-muted">
            Quản lý danh mục hàng hóa, bảng giá niêm yết và thông tin chi tiết các mặt hàng trong chuỗi CSM
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl"
            aria-label="Làm mới danh sách sản phẩm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-xl shadow-sm"
            aria-label="Thêm sản phẩm mới"
          >
            <Plus className="w-4 h-4" /> Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Thông báo Toast */}
      {toastMsg && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl border text-sm font-semibold flex items-center gap-2 shadow-sm animate-fade-in ${
            toastMsg.type === "success"
              ? "bg-primary-tint border-primary/25 text-primary-dark"
              : "bg-danger-pastel border-danger/25 text-danger-dark"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Thẻ chỉ số theo trạng thái — bấm để lọc nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(
          [
            { key: "ALL", label: "Tổng sản phẩm", value: stats.total, icon: <Package className="w-5 h-5" />, tone: "bg-primary-tint text-primary" },
            { key: "ACTIVE", label: "Đang bán", value: stats.active, icon: <CheckCircle2 className="w-5 h-5" />, tone: "bg-emerald-500/10 text-emerald-600" },
            { key: "INACTIVE", label: "Tạm ngưng", value: stats.inactive, icon: <PauseCircle className="w-5 h-5" />, tone: "bg-slate-500/10 text-slate-600" },
          ] as const
        ).map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => updateSearchParam("status", c.key)}
            className={`p-4 bg-surface border rounded-2xl flex items-center gap-3 text-left transition-colors ${
              statusFilter === c.key ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"
            }`}
          >
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.tone}`}>{c.icon}</span>
            <span>
              <span className="block text-xs text-muted font-medium">{c.label}</span>
              <span className="block text-xl font-bold text-foreground">{loading ? "..." : c.value}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Thanh công cụ tìm kiếm và lọc */}
      <Card className="p-4 bg-surface border-border rounded-2xl space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo tên sản phẩm, mã SKU..."
              value={searchQuery}
              onChange={(e) => updateSearchParam("search", e.target.value)}
              className="pl-9 pr-9 rounded-xl text-sm"
              aria-label="Tìm kiếm sản phẩm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => updateSearchParam("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
                title="Xóa tìm kiếm"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => updateSearchParam("status", e.target.value)}
              className="h-9 px-3 rounded-xl bg-surface border border-border text-foreground text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              aria-label="Lọc theo trạng thái"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bán</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>
            <ProductSearchSelect
              className="w-full sm:w-60"
              options={[{ id: "ALL", name: "Tất cả danh mục" }, ...categories.map((c) => ({ id: c.id, name: c.name }))]}
              value={selectedCategory}
              onChange={(opt) => updateSearchParam("category", opt?.id || "ALL")}
              emptyLabel="Tất cả danh mục"
              placeholder="Gõ tên danh mục để tìm..."
              notFoundLabel="Không tìm thấy danh mục phù hợp"
              clearable={false}
            />
          </div>
        </div>

        {/* Trạng thái lỗi tải dữ liệu */}
        {fetchError && !loading && (
          <div className="p-6 rounded-2xl bg-danger-pastel/60 border border-danger/25 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-danger mx-auto" />
            <p className="text-sm font-semibold text-danger-dark">{fetchError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="rounded-xl border-danger/30 text-danger-dark hover:bg-danger-pastel"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Thử lại
            </Button>
          </div>
        )}

        {/* Bảng dữ liệu sản phẩm */}
        {!fetchError && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-soft text-muted text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Mã SKU</th>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Giá niêm yết</th>
                  <th className="px-4 py-3">Tồn kho</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-surface-soft border border-border shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-4 bg-surface-soft rounded-md w-3/4" />
                            <div className="h-3 bg-surface-soft rounded-md w-1/2" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-surface-soft rounded w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-surface-soft rounded-full w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-surface-soft rounded w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-surface-soft rounded w-10" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-surface-soft rounded-full w-20" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="h-7 bg-surface-soft rounded w-16 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted">
                      <Package className="w-10 h-10 text-muted/60 mx-auto mb-2" />
                      <p className="font-semibold text-foreground">Không tìm thấy sản phẩm nào</p>
                      <p className="text-xs text-muted mt-1">
                        Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác
                      </p>
                      {(searchQuery || selectedCategory !== "ALL" || statusFilter !== "ALL") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
                          className="mt-3 rounded-xl text-xs"
                        >
                          Xóa bộ lọc
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const imageSrc = resolveImageUrl(p.images?.[0]);

                    return (
                      <tr key={p.id} className="hover:bg-surface-soft/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={imageSrc}
                              alt={p.name}
                              className="w-11 h-11 object-cover rounded-xl border border-border bg-surface-soft shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className="min-w-0 max-w-[220px]">
                              <button
                                type="button"
                                onClick={() => setViewingProduct(p)}
                                className="block w-full text-left font-semibold text-foreground truncate hover:text-primary"
                                title={p.name}
                              >
                                {p.name}
                              </button>
                              <p className="text-xs text-muted truncate" title={p.description || undefined}>
                                {p.description || "Chưa có mô tả"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          <span
                            className="inline-block max-w-[140px] truncate align-middle px-2 py-0.5 rounded bg-surface-soft border border-border"
                            title={p.sku || undefined}
                          >
                            {p.sku || `SKU-${p.id.slice(0, 6)}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 max-w-[160px] px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-tint text-primary-dark border border-primary/20"
                            title={p.category?.name}
                          >
                            <Tag className="w-3 h-3 shrink-0" />
                            <span className="truncate">{p.category?.name || "Hàng tổng hợp"}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">
                          {formatPrice(p.price)}
                        </td>
                        <td className="px-4 py-3 text-xs">{renderStock(p.id)}</td>
                        <td className="px-4 py-3">
                          {p.isActive === false ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap">
                              <PauseCircle className="w-3.5 h-3.5" /> Tạm ngưng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đang bán
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingProduct(p)}
                              className="h-8 w-8 p-0 text-muted hover:text-foreground rounded-lg"
                              title="Xem chi tiết"
                              aria-label={`Xem chi tiết ${p.name}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStatusTarget(p)}
                              className="h-8 w-8 p-0 text-muted hover:text-foreground rounded-lg"
                              title={p.isActive === false ? "Mở bán lại" : "Tạm ngưng bán"}
                              aria-label={p.isActive === false ? `Mở bán lại ${p.name}` : `Tạm ngưng ${p.name}`}
                            >
                              {p.isActive === false ? (
                                <PlayCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <PauseCircle className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(p)}
                              className="h-8 w-8 p-0 text-muted hover:text-foreground rounded-lg"
                              title="Chỉnh sửa sản phẩm"
                              aria-label={`Chỉnh sửa ${p.name}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingProduct(p)}
                              className="h-8 w-8 p-0 text-muted hover:text-danger rounded-lg"
                              title="Xóa sản phẩm"
                              aria-label={`Xóa ${p.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang sản phẩm */}
        {!fetchError && !loading && (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={filteredProducts.length}
            onPageChange={(p) => updateSearchParam("page", String(p))}
            onPageSizeChange={(size) => updateSearchParam("size", String(size))}
            unit="sản phẩm"
          />
        )}
      </Card>

      {/* Modal Thêm / Chỉnh Sửa Sản Phẩm */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSubmitted && (
              <FormErrorSummary errors={fieldErrors} order={PRODUCT_FIELD_ORDER} labels={PRODUCT_FIELD_LABELS} />
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5" data-field="name">
                <Label htmlFor="productName">Tên sản phẩm *</Label>
                <Input
                  id="productName"
                  maxLength={PRODUCT_LIMITS.nameMax}
                  placeholder="Ví dụ: Trà Sữa Trân Châu CSM"
                  value={formData.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  aria-invalid={!!fieldErrors.name || undefined}
                  className={`rounded-xl ${invalidClass(fieldErrors.name)}`}
                />
                <div className="flex justify-between gap-2">
                  <FieldError message={fieldErrors.name} />
                  <span className="text-[10px] text-muted ml-auto mt-1">
                    {formData.name.length}/{PRODUCT_LIMITS.nameMax}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sku">Mã SKU (tự sinh)</Label>
                  <Input
                    id="sku"
                    readOnly
                    value={formData.sku}
                    title="Mã SKU được hệ thống tự sinh và không sửa được"
                    className="rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1.5" data-field="base_price">
                  <Label htmlFor="base_price">Giá niêm yết (VNĐ) *</Label>
                  <NumberInput
                    id="base_price"
                    value={formData.base_price}
                    onValueChange={(v) => updateForm({ base_price: v })}
                    thousandSeparator
                    maxDigits={9}
                    suffix="đ"
                    placeholder="Từ 1.000đ"
                    invalid={!!fieldErrors.base_price}
                    className="rounded-xl font-mono"
                  />
                  <FieldError message={fieldErrors.base_price} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5" data-field="category_id">
                  <Label>Danh mục sản phẩm *</Label>
                  <ProductSearchSelect
                    options={categories.map((c) => ({ id: c.id, name: c.name }))}
                    value={formData.category_id}
                    onChange={(opt) => updateForm({ category_id: opt?.id || "" })}
                    emptyLabel="-- Chọn danh mục --"
                    placeholder="Gõ tên danh mục để tìm..."
                    notFoundLabel="Không tìm thấy danh mục phù hợp"
                    invalid={!!fieldErrors.category_id}
                  />
                  <FieldError message={fieldErrors.category_id} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="productStatus">Trạng thái</Label>
                  <select
                    id="productStatus"
                    value={formData.is_active ? "ACTIVE" : "INACTIVE"}
                    onChange={(e) => updateForm({ is_active: e.target.value === "ACTIVE" })}
                    className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-foreground text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5" data-field="description">
                <Label htmlFor="description">Mô tả sản phẩm</Label>
                <textarea
                  id="description"
                  rows={3}
                  maxLength={PRODUCT_LIMITS.descriptionMax}
                  placeholder="Nhập thông tin mô tả chi tiết sản phẩm..."
                  value={formData.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none ${invalidClass(fieldErrors.description)}`}
                />
                <div className="flex justify-between gap-2">
                  <FieldError message={fieldErrors.description} />
                  <span className="text-[10px] text-muted ml-auto mt-1">
                    {formData.description.length}/{PRODUCT_LIMITS.descriptionMax}
                  </span>
                </div>
              </div>

              {/* Phần quản lý hình ảnh & tải tệp ảnh */}
              <div
                data-field="image"
                className={`space-y-2 p-3.5 rounded-2xl bg-surface-soft/60 border ${fieldErrors.image ? "border-danger ring-1 ring-danger/30" : "border-border"}`}
              >
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" /> Hình ảnh sản phẩm
                </Label>

                {/* Preview hình ảnh nếu có */}
                {imagePreviewUrl && (
                  <div className="relative inline-block border border-border rounded-2xl overflow-hidden bg-surface">
                    <img
                      src={imagePreviewUrl}
                      alt="Xem trước hình ảnh"
                      className="w-28 h-28 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleClearSelectedImage}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                      title="Gỡ ảnh đã chọn"
                      aria-label="Gỡ ảnh"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {selectedImageFile && (
                      <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-white text-[10px] text-center py-0.5 font-medium truncate px-1">
                        Ảnh mới
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-border bg-surface hover:bg-border/40 cursor-pointer text-xs font-semibold text-foreground transition-all">
                      <Upload className="w-4 h-4 text-primary" />
                      <span>Chọn tệp ảnh (.jpg, .png, .webp &le; 2MB)</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                    </label>

                    {selectedImageFile && (
                      <span className="text-xs text-primary font-medium truncate max-w-[200px]">
                        {selectedImageFile.name} ({(selectedImageFile.size / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted">
                    Hoặc nhập URL hình ảnh bên ngoài (nếu không tải tệp):
                  </p>
                  <Input
                    id="imageUrl"
                    maxLength={PRODUCT_LIMITS.imageUrlMax}
                    placeholder="https://... URL hình ảnh"
                    value={formData.image_url}
                    onChange={(e) => updateForm({ image_url: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                  <FieldError message={fieldErrors.image} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="rounded-xl"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl flex items-center gap-2"
                >
                  {formLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa sản phẩm */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-danger">
              <div className="w-10 h-10 rounded-2xl bg-danger-pastel border border-danger/25 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Xác nhận xóa sản phẩm</h3>
                <p className="text-xs text-muted">Thao tác này sẽ xóa sản phẩm khỏi danh mục hệ thống</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-soft border border-border text-xs space-y-1">
              <p>
                <b>Tên sản phẩm:</b> {deletingProduct.name}
              </p>
              <p>
                <b>Mã SKU:</b> <span className="font-mono">{deletingProduct.sku}</span>
              </p>
              <p>
                <b>Giá niêm yết:</b> {formatPrice(deletingProduct.price)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-warning-pastel/70 border border-warning/25 text-warning-dark text-xs">
              Lưu ý: Nếu sản phẩm đã phát sinh giao dịch tồn kho hoặc đơn hàng trong quá khứ, máy chủ có thể từ chối xóa để đảm bảo toàn vẹn dữ liệu kế toán.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingProduct(null)}
                disabled={deleteLoading}
                className="rounded-xl text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="rounded-xl text-xs flex items-center gap-1.5"
              >
                {deleteLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmSave}
        title={editingProduct ? `Lưu thay đổi cho "${formData.name.trim()}"?` : `Tạo sản phẩm "${formData.name.trim()}"?`}
        description={`Giá niêm yết ${fmtVnd(formData.base_price ?? 0)} · ${
          categories.find((c) => c.id === formData.category_id)?.name || ""
        } · ${formData.is_active ? "Đang bán" : "Tạm ngưng"}`}
        confirmLabel={editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
        onConfirm={doSave}
        onCancel={() => setConfirmSave(false)}
      />

      {/* Xem chi tiết sản phẩm — hiển thị đầy đủ các trường đã rút gọn ở bảng */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground break-words min-w-0">{viewingProduct.name}</h2>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft shrink-0"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={resolveImageUrl(viewingProduct.images?.[0])}
              alt={viewingProduct.name}
              className="w-full max-h-60 object-contain rounded-2xl border border-border bg-surface-soft"
            />
            <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted">Mã SKU</dt>
              <dd className="font-mono break-all">{viewingProduct.sku || "—"}</dd>
              <dt className="text-muted">Danh mục</dt>
              <dd className="break-words">{viewingProduct.category?.name || "Hàng tổng hợp"}</dd>
              <dt className="text-muted">Giá niêm yết</dt>
              <dd className="font-bold">{formatPrice(viewingProduct.price)}</dd>
              <dt className="text-muted">Tồn kho</dt>
              <dd>{renderStock(viewingProduct.id)}</dd>
              <dt className="text-muted">Trạng thái</dt>
              <dd>{viewingProduct.isActive === false ? "Tạm ngưng" : "Đang bán"}</dd>
              <dt className="text-muted">Ngày tạo</dt>
              <dd>{formatDateTimeVN(viewingProduct.createdAt)}</dd>
              <dt className="text-muted">Mô tả</dt>
              <dd className="whitespace-pre-line break-words">{viewingProduct.description || "Chưa có mô tả"}</dd>
            </dl>
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" className="rounded-xl text-xs" onClick={() => setStatusTarget(viewingProduct)}>
                {viewingProduct.isActive === false ? "Mở bán lại" : "Tạm ngưng bán"}
              </Button>
              <Button
                className="rounded-xl text-xs"
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  handleOpenEditModal(p);
                }}
              >
                Chỉnh sửa
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!statusTarget}
        tone={statusTarget?.isActive === false ? "default" : "warning"}
        title={statusTarget?.isActive === false ? `Mở bán lại "${statusTarget?.name}"?` : `Tạm ngưng bán "${statusTarget?.name}"?`}
        description={
          statusTarget?.isActive === false
            ? "Sản phẩm sẽ hiện lại ở cửa hàng và khách hàng đặt mua được."
            : "Sản phẩm sẽ bị ẩn khỏi cửa hàng và khách hàng không đặt mua được cho tới khi mở bán lại. Tồn kho vẫn được giữ nguyên."
        }
        confirmLabel={statusTarget?.isActive === false ? "Mở bán lại" : "Tạm ngưng"}
        loading={statusLoading}
        onConfirm={handleConfirmStatus}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
}

export default AdminProductListPage;
