import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Pencil, Trash2, Eye, EyeOff, X, Megaphone, Calendar, MonitorSmartphone } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import {
  storefrontApi,
  Announcement,
  AnnouncementInput,
  AnnouncementTone,
  ANNOUNCEMENT_TONE_META,
} from "../../../api/storefrontApi";
import { AnnouncementLivePreview } from "./StorefrontPreviews";
import { getErrorMessage, toLocalInput, fromLocalInput, getLiveStatus, LIVE_STATUS_STYLE, formatDateTime } from "../utils";

interface AnnouncementManagerProps {
  scope: string;
  onNotify: (msg: string) => void;
}

interface AnnouncementForm {
  message: string;
  link_url: string;
  link_text: string;
  tone: AnnouncementTone;
  is_active: boolean;
  start_at: string;
  end_at: string;
}

const EMPTY_FORM: AnnouncementForm = {
  message: "",
  link_url: "",
  link_text: "",
  tone: "primary",
  is_active: true,
  start_at: "",
  end_at: "",
};

const TONES = Object.keys(ANNOUNCEMENT_TONE_META) as AnnouncementTone[];

export function AnnouncementManager({ scope, onNotify }: AnnouncementManagerProps) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await storefrontApi.listAnnouncements(scope));
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được thông báo"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: Announcement) => {
    setEditing(item);
    setForm({
      message: item.message,
      link_url: item.link_url || "",
      link_text: item.link_text || "",
      tone: item.tone || "primary",
      is_active: item.is_active,
      start_at: toLocalInput(item.start_at),
      end_at: toLocalInput(item.end_at),
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const liveItems = items.filter((a) => getLiveStatus(a) === "LIVE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) return setFormError("Vui lòng nhập nội dung thông báo");
    const start_at = fromLocalInput(form.start_at);
    const end_at = fromLocalInput(form.end_at);
    if (start_at && end_at && new Date(start_at) > new Date(end_at)) {
      return setFormError("Ngày bắt đầu phải trước ngày kết thúc");
    }
    const payload: AnnouncementInput = {
      message: form.message.trim(),
      link_url: form.link_url.trim() || null,
      link_text: form.link_text.trim() || null,
      tone: form.tone,
      is_active: form.is_active,
      start_at,
      end_at,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await storefrontApi.updateAnnouncement(editing.id, payload);
        onNotify("Đã cập nhật thông báo");
      } else {
        await storefrontApi.createAnnouncement({ ...payload, branch_id: scope });
        onNotify("Đã thêm thông báo");
      }
      setIsFormOpen(false);
      fetchItems();
    } catch (err) {
      setFormError(getErrorMessage(err, "Lưu thông báo thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: Announcement) => {
    try {
      await storefrontApi.updateAnnouncement(item.id, { is_active: !item.is_active });
      setItems((list) => list.map((a) => (a.id === item.id ? { ...a, is_active: !a.is_active } : a)));
      onNotify(item.is_active ? "Đã tắt thông báo" : "Đã bật thông báo");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (item: Announcement) => {
    if (!window.confirm(`Xóa thông báo "${item.message}"?`)) return;
    try {
      await storefrontApi.deleteAnnouncement(item.id);
      setItems((list) => list.filter((a) => a.id !== item.id));
      onNotify("Đã xóa thông báo");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-muted max-w-xl">
          Thanh chữ nhỏ ở trên cùng mọi trang của khách. Các thông báo chạy lần lượt từ phải sang trái, chạy hết một vòng
          thì nghỉ 1 phút rồi chạy lại. Thông báo của chi nhánh chạy trước thông báo toàn chuỗi.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading} className="rounded-xl text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button size="sm" onClick={openCreate} className="rounded-xl text-xs font-semibold gap-1.5" data-testid="announcement-create">
            <Plus className="w-4 h-4" />
            Thêm thông báo
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark border border-danger/20 text-xs font-medium">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
      <div className="lg:col-span-3 bg-surface rounded-3xl border border-border shadow-card divide-y divide-border/60">
        {loading && items.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary mb-2" />
            Đang tải thông báo...
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary mx-auto mb-2">
              <Megaphone className="w-6 h-6" />
            </div>
            <p className="font-semibold text-foreground text-sm">Chưa có thông báo nào</p>
            <p className="text-xs text-muted mt-0.5">Ví dụ: "Freeship cho đơn từ 100.000₫ trong tuần này".</p>
          </div>
        ) : (
          items.map((item) => {
            const status = LIVE_STATUS_STYLE[getLiveStatus(item)];
            const tone = ANNOUNCEMENT_TONE_META[item.tone] || ANNOUNCEMENT_TONE_META.primary;
            return (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                <span className={`w-3 h-10 rounded-full shrink-0 hidden sm:block ${tone.className}`} aria-hidden />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${status.className}`}>{status.label}</span>
                  <p className="font-semibold text-sm text-foreground">{item.message}</p>
                  <div className="flex flex-wrap gap-x-4 text-[11px] text-muted">
                    {item.link_url && <span>Link: {item.link_url}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.start_at || item.end_at
                        ? `${formatDateTime(item.start_at) || "Ngay bây giờ"} → ${formatDateTime(item.end_at) || "Không giới hạn"}`
                        : "Không giới hạn thời gian"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleToggle(item)} className="rounded-xl text-xs gap-1">
                    {item.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {item.is_active ? "Tắt" : "Bật"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="rounded-xl text-xs gap-1">
                    <Pencil className="w-3.5 h-3.5" />
                    Sửa
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(item)} className="rounded-xl text-xs text-danger-dark" aria-label="Xóa thông báo">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="lg:col-span-2 lg:sticky lg:top-4 rounded-3xl border border-border bg-surface shadow-card p-4 space-y-2">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <MonitorSmartphone className="w-4 h-4 text-primary" />
          Khách đang thấy
        </p>
        <AnnouncementLivePreview
          items={liveItems}
          caption={liveItems.length > 0 ? `${liveItems.length} thông báo đang chạy, đúng thứ tự trên web` : undefined}
          emptyText="Chưa có thông báo nào đang hiển thị"
        />
      </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form onSubmit={handleSubmit} className="bg-surface rounded-3xl border border-border p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">{editing ? "Sửa thông báo" : "Thêm thông báo"}</h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-muted hover:text-foreground" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark border border-danger/20 text-xs font-medium">{formError}</div>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Xem trước trên web</p>
              <AnnouncementLivePreview compact items={[form]} caption="Chữ chạy đúng tốc độ và màu như khách sẽ thấy" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Nội dung *</label>
              <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={255} placeholder="Freeship cho đơn từ 100.000₫" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Link (tuỳ chọn)</label>
                <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} maxLength={500} placeholder="/products?q=sale" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Chữ của link</label>
                <Input value={form.link_text} onChange={(e) => setForm({ ...form, link_text: e.target.value })} maxLength={60} placeholder="Xem ngay" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Màu thanh</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, tone: t })}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold ${ANNOUNCEMENT_TONE_META[t].className} ${
                      form.tone === t ? "ring-2 ring-offset-2 ring-primary" : "opacity-80"
                    }`}
                    aria-pressed={form.tone === t}
                  >
                    {ANNOUNCEMENT_TONE_META[t].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Bắt đầu</label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Kết thúc</label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-primary" />
              Bật hiển thị
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="rounded-xl text-xs">
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="rounded-xl text-xs font-semibold">
                {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm thông báo"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
