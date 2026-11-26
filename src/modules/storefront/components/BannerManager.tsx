import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  X,
  Upload,
  ImageIcon,
  Eye,
  EyeOff,
  Calendar,
  Link2,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { storefrontApi, Banner, BannerInput } from "../../../api/storefrontApi";
import { resolveAssetUrl } from "../../../lib/assetUrl";
import {
  getErrorMessage,
  toLocalInput,
  fromLocalInput,
  getLiveStatus,
  LIVE_STATUS_STYLE,
  formatDateTime,
} from "../utils";

interface BannerManagerProps {
  scope: string;
  onNotify: (msg: string) => void;
}

interface BannerForm {
  title: string;
  highlight: string;
  badge: string;
  description: string;
  image_url: string;
  link_url: string;
  cta_text: string;
  is_active: boolean;
  start_at: string;
  end_at: string;
}

const EMPTY_FORM: BannerForm = {
  title: "",
  highlight: "",
  badge: "",
  description: "",
  image_url: "",
  link_url: "/products",
  cta_text: "Khám phá ngay",
  is_active: true,
  start_at: "",
  end_at: "",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export function BannerManager({ scope, onNotify }: BannerManagerProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBanners(await storefrontApi.listBanners(scope));
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách banner"));
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || "",
      highlight: banner.highlight || "",
      badge: banner.badge || "",
      description: banner.description || "",
      image_url: banner.image_url || "",
      link_url: banner.link_url || "",
      cta_text: banner.cta_text || "",
      is_active: banner.is_active,
      start_at: toLocalInput(banner.start_at),
      end_at: toLocalInput(banner.end_at),
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      setFormError("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFormError("Dung lượng ảnh vượt quá 2MB");
      return;
    }
    setUploading(true);
    setFormError(null);
    try {
      const url = await storefrontApi.uploadImage(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      setFormError(getErrorMessage(err, "Tải ảnh thất bại"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setFormError("Vui lòng nhập tiêu đề banner");
    if (!form.image_url.trim()) return setFormError("Vui lòng tải ảnh hoặc nhập link ảnh");
    const start_at = fromLocalInput(form.start_at);
    const end_at = fromLocalInput(form.end_at);
    if (start_at && end_at && new Date(start_at) > new Date(end_at)) {
      return setFormError("Ngày bắt đầu phải trước ngày kết thúc");
    }

    const payload: BannerInput = {
      title: form.title.trim(),
      highlight: form.highlight.trim() || null,
      badge: form.badge.trim() || null,
      description: form.description.trim() || null,
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim() || null,
      cta_text: form.cta_text.trim() || null,
      is_active: form.is_active,
      start_at,
      end_at,
    };

    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await storefrontApi.updateBanner(editing.id, payload);
        onNotify("Đã cập nhật banner");
      } else {
        await storefrontApi.createBanner({ ...payload, branch_id: scope });
        onNotify("Đã thêm banner mới");
      }
      setIsFormOpen(false);
      fetchBanners();
    } catch (err) {
      setFormError(getErrorMessage(err, "Lưu banner thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (banner: Banner) => {
    try {
      await storefrontApi.updateBanner(banner.id, { is_active: !banner.is_active });
      setBanners((list) => list.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b)));
      onNotify(banner.is_active ? "Đã tắt banner" : "Đã bật banner");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm(`Xóa banner "${banner.title}"?`)) return;
    try {
      await storefrontApi.deleteBanner(banner.id);
      setBanners((list) => list.filter((b) => b.id !== banner.id));
      onNotify("Đã xóa banner");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[index], next[target]] = [next[target], next[index]];
    const previous = banners;
    setBanners(next);
    try {
      await storefrontApi.reorderBanners(next.map((b) => b.id));
    } catch (err) {
      setBanners(previous);
      setError(getErrorMessage(err, "Không sắp xếp được banner"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-muted max-w-xl">
          Banner hiển thị ở slider đầu trang chủ theo thứ tự bên dưới. Banner của chi nhánh luôn đứng trước banner toàn
          chuỗi. Nếu chưa có banner nào đang hiển thị, trang chủ dùng banner mặc định.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchBanners} disabled={loading} className="rounded-xl text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button size="sm" onClick={openCreate} className="rounded-xl text-xs font-semibold gap-1.5" data-testid="banner-create">
            <Plus className="w-4 h-4" />
            Thêm banner
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark border border-danger/20 text-xs font-medium">{error}</div>
      )}

      <div className="bg-surface rounded-3xl border border-border shadow-card divide-y divide-border/60">
        {loading && banners.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
            Đang tải banner...
          </div>
        ) : banners.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary mx-auto mb-2">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-semibold text-foreground text-sm">Chưa có banner nào</p>
            <p className="text-xs text-muted mt-0.5">Bấm "Thêm banner" để tạo banner đầu tiên cho phạm vi này.</p>
          </div>
        ) : (
          banners.map((banner, index) => {
            const status = LIVE_STATUS_STYLE[getLiveStatus(banner)];
            return (
              <div key={banner.id} className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center" data-testid="banner-row">
                <div className="flex sm:flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-soft disabled:opacity-30"
                    aria-label="Đưa lên"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === banners.length - 1}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-soft disabled:opacity-30"
                    aria-label="Đưa xuống"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <img
                  src={resolveAssetUrl(banner.image_url)}
                  alt={banner.title}
                  className="w-full sm:w-32 h-32 sm:h-20 object-cover rounded-2xl border border-border bg-surface-soft shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${status.className}`}>{status.label}</span>
                    {banner.badge && <span className="text-[11px] text-muted truncate">{banner.badge}</span>}
                  </div>
                  <p className="font-bold text-sm text-foreground truncate">
                    {banner.title}
                    {banner.highlight && <span className="text-primary-dark font-semibold"> · {banner.highlight}</span>}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                    {banner.link_url && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[240px]">
                        <Link2 className="w-3 h-3" />
                        {banner.link_url}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {banner.start_at || banner.end_at
                        ? `${formatDateTime(banner.start_at) || "Ngay bây giờ"} → ${formatDateTime(banner.end_at) || "Không giới hạn"}`
                        : "Không giới hạn thời gian"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(banner)}
                    className="rounded-xl text-xs gap-1"
                    title={banner.is_active ? "Tắt banner" : "Bật banner"}
                  >
                    {banner.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {banner.is_active ? "Tắt" : "Bật"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(banner)} className="rounded-xl text-xs gap-1">
                    <Pencil className="w-3.5 h-3.5" />
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(banner)}
                    className="rounded-xl text-xs text-danger-dark hover:text-danger-dark"
                    aria-label="Xóa banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleSubmit}
            className="bg-surface rounded-3xl border border-border p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">{editing ? "Sửa banner" : "Thêm banner mới"}</h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-muted hover:text-foreground" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark border border-danger/20 text-xs font-medium">{formError}</div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Ảnh banner *</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="w-full sm:w-40 h-28 rounded-2xl border border-dashed border-border bg-surface-soft overflow-hidden flex items-center justify-center shrink-0">
                  {form.image_url ? (
                    <img src={resolveAssetUrl(form.image_url)} alt="Xem trước" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-xl text-xs gap-1.5"
                  >
                    {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploading ? "Đang tải ảnh..." : "Tải ảnh lên (≤ 2MB)"}
                  </Button>
                  <Input
                    placeholder="Hoặc dán link ảnh https://..."
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Tiêu đề *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Giờ Vàng Tiện Lợi" maxLength={150} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Dòng nổi bật</label>
                <Input value={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.value })} placeholder="Đồng Giá Từ 15.000₫" maxLength={150} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nhãn nhỏ</label>
                <Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="🔥 FLASH SALE" maxLength={80} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Chữ trên nút</label>
                <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Săn deal ngay" maxLength={60} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Link khi bấm nút</label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/products?q=sale" maxLength={500} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Bắt đầu hiển thị</label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Kết thúc hiển thị</label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>
            <p className="text-[11px] text-muted -mt-2">Để trống nếu muốn hiển thị không giới hạn thời gian.</p>

            <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-primary" />
              Bật hiển thị
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="rounded-xl text-xs">
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={saving || uploading} className="rounded-xl text-xs font-semibold">
                {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm banner"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
