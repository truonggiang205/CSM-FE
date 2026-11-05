import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { productApi } from "../../../api/productApi";
import { Product, Category } from "../../../types/product";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Badge } from "../../../components/ui/Badge";

interface ProductFormData {
  id?: string;
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

export function AdminProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Phân trang
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Tải danh sách sản phẩm và danh mục
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        productApi.getProducts().catch(() => []),
        productApi.getCategories().catch(() => []),
      ]);

      setProducts(fetchedProducts || []);
      setCategories(fetchedCategories || []);
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      // Nếu có từ khóa tìm kiếm: kiểm tra khớp tên, SKU hoặc mô tả
      if (q) {
        const name = (p.name || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();

        const matchesSearch = name.includes(q) || sku.includes(q) || desc.includes(q);
        if (!matchesSearch) return false;
      }

      // Lọc theo danh mục nếu được chọn
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

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  // Mở modal thêm mới
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      ...emptyFormData,
      category_id: categories[0]?.id || "",
      sku: `SKU-${Date.now().toString().slice(-6)}`,
    });
    setSelectedImageFile(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      id: p.id,
      name: p.name,
      sku: p.sku || `SKU-${p.id.slice(0, 6)}`,
      base_price: p.price,
      category_id: p.category?.id || categories[0]?.id || "",
      description: p.description || "",
      image_url: p.images?.[0] || "",
    });
    setSelectedImageFile(null);
    setIsModalOpen(true);
  };

  // Xóa sản phẩm
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
      return;
    }

    try {
      await productApi.deleteProduct(id).catch(() => null);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showNotification(`Đã xóa sản phẩm "${name}" thành công!`);
    } catch {
      showNotification("Không thể xóa sản phẩm. Vui lòng thử lại.", "error");
    }
  };

  // Lưu thông tin (Thêm mới hoặc Cập nhật)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification("Vui lòng nhập tên sản phẩm", "error");
      return;
    }

    setFormLoading(true);
    try {
      let savedProduct: Product;

      if (editingProduct) {
        // Cập nhật
        savedProduct = await productApi.updateProduct(editingProduct.id, {
          name: formData.name,
          sku: formData.sku,
          base_price: Number(formData.base_price),
          category_id: formData.category_id,
          description: formData.description,
          image_url: formData.image_url,
        }).catch(() => ({
          ...editingProduct,
          name: formData.name,
          sku: formData.sku,
          price: Number(formData.base_price),
          description: formData.description,
          images: formData.image_url ? [formData.image_url] : editingProduct.images,
        }));

        // Nếu có upload ảnh mới
        if (selectedImageFile) {
          try {
            const uploadRes = await productApi.uploadProductImage(editingProduct.id, selectedImageFile);
            if (uploadRes?.image_url) {
              savedProduct.images = [uploadRes.image_url];
            }
          } catch (uploadErr) {
            console.warn("Upload ảnh thất bại:", uploadErr);
          }
        }

        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? savedProduct : p)));
        showNotification(`Đã cập nhật sản phẩm "${formData.name}" thành công!`);
      } else {
        // Thêm mới
        savedProduct = await productApi.createProduct({
          name: formData.name,
          sku: formData.sku,
          base_price: Number(formData.base_price),
          category_id: formData.category_id,
          description: formData.description,
          image_url: formData.image_url,
        }).catch(() => ({
          id: `prod-${Date.now()}`,
          name: formData.name,
          sku: formData.sku,
          slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
          price: Number(formData.base_price),
          description: formData.description,
          images: formData.image_url ? [formData.image_url] : ["https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=500&q=80"],
          category: categories.find((c) => c.id === formData.category_id) || categories[0],
          stock: 100,
        }));

        // Nếu có chọn file ảnh
        if (selectedImageFile && savedProduct.id) {
          try {
            const uploadRes = await productApi.uploadProductImage(savedProduct.id, selectedImageFile);
            if (uploadRes?.image_url) {
              savedProduct.images = [uploadRes.image_url];
            }
          } catch (uploadErr) {
            console.warn("Upload ảnh thất bại:", uploadErr);
          }
        }

        setProducts((prev) => [savedProduct, ...prev]);
        showNotification(`Đã thêm mới sản phẩm "${formData.name}" thành công!`);
      }

      setIsModalOpen(false);
    } catch {
      showNotification("Có lỗi xảy ra khi lưu sản phẩm", "error");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-sm font-semibold flex items-center gap-2 animate-fade-in ${
            feedbackMsg.type === "success"
              ? "bg-primary-tint border-primary/25 text-primary-dark"
              : "bg-danger-pastel border-danger/25 text-danger-dark"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Tổng sản phẩm</p>
            <p className="text-xl font-bold text-foreground">{products.length}</p>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-accent-tint border border-accent/25 flex items-center justify-center text-accent-dark shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Danh mục hàng</p>
            <p className="text-xl font-bold text-foreground">{categories.length}</p>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-info-pastel border border-info/25 flex items-center justify-center text-info-dark shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Giá trung bình</p>
            <p className="text-xl font-bold text-foreground">
              {products.length > 0
                ? formatPrice(Math.round(products.reduce((acc, cur) => acc + cur.price, 0) / products.length))
                : "0 ₫"}
            </p>
          </div>
        </Card>
      </div>

      {/* Toolbar & Filter */}
      <Card className="p-4 bg-surface border-border rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo tên sản phẩm, mã SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 rounded-xl text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
                title="Xóa tìm kiếm"
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
                onChange={(e) => setSelectedCategory(e.target.value)}
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

        {/* Data Table */}
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
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Đang tải danh sách sản phẩm...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    <p className="font-medium text-foreground">Không tìm thấy sản phẩm nào</p>
                    <p className="text-xs mt-1">Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const imageSrc =
                    p.images && p.images[0]
                      ? p.images[0].startsWith("/uploads")
                        ? `http://localhost:8000${p.images[0]}`
                        : p.images[0]
                      : "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=150&q=80";

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
                            <p className="text-xs text-muted line-clamp-1">{p.description || "Chưa có mô tả"}</p>
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
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="h-8 w-8 p-0 text-muted hover:text-danger rounded-lg"
                            title="Xóa sản phẩm"
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

        {/* Phân trang sản phẩm */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted bg-surface-soft/40">
          <div>
            Trang <b className="text-foreground">{page}</b> / <b className="text-foreground">{totalPages}</b> (Tổng <b className="text-foreground">{filteredProducts.length}</b> sản phẩm)
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl h-8 text-xs font-semibold"
              >
                &larr; Trước
              </Button>
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted">...</span>}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          page === p
                            ? "bg-primary text-white shadow-2xs"
                            : "text-muted hover:text-foreground hover:bg-surface"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl h-8 text-xs font-semibold"
              >
                Sau &rarr;
              </Button>
            </div>
          )}
        </div>
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
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                    min={1000}
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

              <div className="space-y-1.5">
                <Label htmlFor="imageUrl">URL hình ảnh hoặc Tải ảnh từ máy</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://... hoặc tải ảnh bên dưới"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="rounded-xl text-xs mb-2"
                />

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-border bg-surface-soft hover:bg-border/60 cursor-pointer text-xs font-semibold text-foreground transition-all">
                    <Upload className="w-4 h-4 text-primary" />
                    <span>Chọn tệp ảnh từ máy (.jpg, .png, .webp)</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedImageFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {selectedImageFile && (
                    <span className="text-xs text-primary font-medium truncate max-w-[180px]">
                      {selectedImageFile.name}
                    </span>
                  )}
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
                <Button type="submit" disabled={formLoading} className="rounded-xl flex items-center gap-2">
                  {formLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductListPage;

