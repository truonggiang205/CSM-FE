import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Tag,
  DollarSign,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { productApi } from "../../../api/productApi";
import { Product, Category } from "../../../types/product";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { useAuthStore } from "../../../store/useAuthStore";

interface ProductFormData {
  name: string;
  sku: string;
  base_price: number;
  category_id: string;
  description: string;
  image_url: string;
}

const emptyFormData: ProductFormData = {
  name: "",
  sku: "",
  base_price: 10000,
  category_id: "",
  description: "",
  image_url: "",
};

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
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = 10;

  // Modal thêm/sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    if (!value || (key === "category" && value === "ALL") || (key === "page" && value === "1")) {
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
        productApi.getProducts({ all: true }),
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

      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Mở modal thêm mới
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      ...emptyFormData,
      category_id: categories[0]?.id || "",
      sku: `SKU-${Date.now().toString().slice(-6)}`,
    });
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
      category_id: p.category?.id || categories[0]?.id || "",
      description: p.description || "",
      image_url: p.images?.[0] || "",
    });
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
      setFormError(`Dung lượng ảnh vượt quá 2MB (tệp hiện tại: ${sizeMB}MB). Vui lòng chọn ảnh nhỏ hơn.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Kiểm tra định dạng (.jpg, .jpeg, .png, .webp)
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const mime = (file.type || "").toLowerCase();

    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mime);

    if (!isExtAllowed || !isMimeAllowed) {
      setFormError("Chỉ chấp nhận tệp hình ảnh định dạng JPG, PNG hoặc WEBP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Tệp hợp lệ: tạo preview
    setFormError(null);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (!formData.sku.trim()) {
      setFormError("Vui lòng nhập mã SKU");
      return;
    }
    if (formData.base_price < 0) {
      setFormError("Giá niêm yết không được nhỏ hơn 0");
      return;
    }

    setFormLoading(true);
    try {
      let savedProduct: Product;

      if (editingProduct) {
        // Cập nhật sản phẩm qua PUT /products/:id
        savedProduct = await productApi.updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          base_price: Number(formData.base_price),
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
      setFormError(errMsg);
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

      {/* Thẻ chỉ số tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Tổng sản phẩm</p>
            <p className="text-xl font-bold text-foreground">
              {loading ? "..." : products.length}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-accent-tint border border-accent/25 flex items-center justify-center text-accent-dark shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Danh mục hàng</p>
            <p className="text-xl font-bold text-foreground">
              {loading ? "..." : categories.length}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-info-pastel border border-info/25 flex items-center justify-center text-info-dark shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Giá trung bình</p>
            <p className="text-xl font-bold text-foreground">
              {loading
                ? "..."
                : products.length > 0
                ? formatPrice(
                    Math.round(products.reduce((acc, cur) => acc + (cur.price || 0), 0) / products.length)
                  )
                : "0 ₫"}
            </p>
          </div>
        </Card>
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

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => updateSearchParam("category", e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2.5 rounded-xl bg-surface-soft hover:bg-border/60 border border-border text-foreground text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all appearance-none"
                aria-label="Lọc theo danh mục"
              >
                <option value="ALL">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted text-[10px]">
                ▼
              </div>
            </div>
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
                        <div className="h-5 bg-surface-soft rounded-full w-20" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="h-7 bg-surface-soft rounded w-16 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted">
                      <Package className="w-10 h-10 text-muted/60 mx-auto mb-2" />
                      <p className="font-semibold text-foreground">Không tìm thấy sản phẩm nào</p>
                      <p className="text-xs text-muted mt-1">
                        Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác
                      </p>
                      {(searchQuery || selectedCategory !== "ALL") && (
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
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground line-clamp-1">{p.name}</p>
                              <p className="text-xs text-muted line-clamp-1">
                                {p.description || "Chưa có mô tả"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          <span className="px-2 py-0.5 rounded bg-surface-soft border border-border">
                            {p.sku || `SKU-${p.id.slice(0, 6)}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-tint text-primary-dark border border-primary/20">
                            <Tag className="w-3 h-3" />
                            {p.category?.name || "Hàng tổng hợp"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">
                          {formatPrice(p.price)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đang bán
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
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
          <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted bg-surface-soft/40 rounded-xl">
            <div>
              Trang <b className="text-foreground">{currentPage}</b> / <b className="text-foreground">{totalPages}</b> (Tổng <b className="text-foreground">{filteredProducts.length}</b> sản phẩm)
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => updateSearchParam("page", String(Math.max(1, currentPage - 1)))}
                  className="rounded-xl h-8 text-xs font-semibold"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Trước
                </Button>
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted">...</span>}
                        <button
                          type="button"
                          onClick={() => updateSearchParam("page", String(p))}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPage === p
                              ? "bg-primary text-white shadow-2xs"
                              : "text-muted hover:text-foreground hover:bg-surface"
                          }`}
                          aria-label={`Tới trang ${p}`}
                          aria-current={currentPage === p ? "page" : undefined}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => updateSearchParam("page", String(Math.min(totalPages, currentPage + 1)))}
                  className="rounded-xl h-8 text-xs font-semibold"
                  aria-label="Trang sau"
                >
                  Sau <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            )}
          </div>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="productName">Tên sản phẩm *</Label>
                <Input
                  id="productName"
                  required
                  placeholder="Ví dụ: Trà Sữa Trân Châu CSM"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sku">Mã SKU *</Label>
                  <Input
                    id="sku"
                    required
                    placeholder="Ví dụ: SKU-TS-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="base_price">Giá niêm yết (VNĐ) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    min={0}
                    step={1000}
                    required
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Danh mục sản phẩm</Label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Mô tả sản phẩm</Label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Nhập thông tin mô tả chi tiết sản phẩm..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Phần quản lý hình ảnh & tải tệp ảnh */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-surface-soft/60 border border-border">
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
                    placeholder="https://... URL hình ảnh"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="rounded-xl text-xs"
                  />
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
    </div>
  );
}

export default AdminProductListPage;
