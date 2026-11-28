import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, X, Search, Plus, Save, RotateCcw, RefreshCw, Package, Zap, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ProductImage } from "../../../components/ui/ProductImage";
import { productApi } from "../../../api/productApi";
import { Product } from "../../../types/product";
import {
  storefrontApi,
  HomeSection,
  HomeSectionType,
  HOME_SECTION_META,
  HOME_SECTION_TYPES,
} from "../../../api/storefrontApi";
import { resolveAssetUrl } from "../../../lib/assetUrl";
import { flashSaleApi, formatFlashSaleDiscount } from "../../../api/flashSaleApi";
import { useAuthStore } from "../../../store/useAuthStore";
import { SectionLivePreview } from "./StorefrontPreviews";
import { getErrorMessage, toLocalInput, fromLocalInput, getLiveStatus, LIVE_STATUS_STYLE } from "../utils";
import { formatDateTimeVN } from "../../../lib/datetime";

interface SectionManagerProps {
  scope: string;
  isGlobalScope: boolean;
  onNotify: (msg: string) => void;
}

interface DraftItem {
  product: Product;
  note: string;
}

interface SectionDraft {
  title: string;
  subtitle: string;
  is_active: boolean;
  start_at: string;
  end_at: string;
  items: DraftItem[];
}

function toDraft(section: HomeSection | null): SectionDraft {
  return {
    title: section?.title || "",
    subtitle: section?.subtitle || "",
    is_active: section?.is_active ?? true,
    start_at: toLocalInput(section?.start_at),
    end_at: toLocalInput(section?.end_at),
    items: (section?.products || []).map((p) => ({ product: p, note: p.note || "" })),
  };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export function SectionManager({ scope, isGlobalScope, onNotify }: SectionManagerProps) {
  const [activeType, setActiveType] = useState<HomeSectionType>("FLASH_SALE");
  const [sections, setSections] = useState<Record<HomeSectionType, HomeSection | null> | null>(null);
  const [draft, setDraft] = useState<SectionDraft>(toDraft(null));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products", "storefront-admin"],
    queryFn: () => productApi.getProducts(),
    staleTime: 60_000,
  });

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSections(await storefrontApi.listSections(scope));
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được cấu hình khối sản phẩm"));
      setSections(null);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const current = sections?.[activeType] ?? null;

  useEffect(() => {
    setDraft(toDraft(current));
    setSearch("");
  }, [current, activeType]);

  const meta = HOME_SECTION_META[activeType];
  const isFlashSale = activeType === "FLASH_SALE";
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  // Khối Giờ vàng: sản phẩm, giá và kiểu giảm (% / tiền mặt) lấy từ chiến dịch Flash Sale đang chạy/sắp chạy
  const { data: flashSaleData } = useQuery({
    queryKey: ["active-flash-sale"],
    queryFn: flashSaleApi.getActiveOrUpcoming,
    enabled: isFlashSale,
    staleTime: 30_000,
  });
  const flashCampaign = flashSaleData?.status !== "NONE" ? flashSaleData?.campaign ?? null : null;
  const flashPreviewItems = useMemo<DraftItem[]>(
    () =>
      (flashCampaign?.items || []).map((item) => ({
        note: formatFlashSaleDiscount(item),
        product: {
          id: item.product_id,
          name: item.product_name || item.product_id,
          slug: item.product_id,
          price: Number(item.original_price) || 0,
          discountPrice: Number(item.sale_price) || undefined,
          description: "",
          images: item.product_image ? [item.product_image] : [],
          category: { id: "flash-sale", name: "Giờ vàng" },
          stock: Number(item.quantity_limit) || 0,
        } as Product,
      })),
    [flashCampaign]
  );
  const selectedIds = useMemo(() => new Set(draft.items.map((i) => i.product.id)), [draft.items]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allProducts
      .filter((p) => !selectedIds.has(p.id))
      .filter((p) => p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, allProducts, selectedIds]);

  const addProduct = (product: Product) => {
    if (draft.items.length >= 20) {
      setError("Mỗi khối tối đa 20 sản phẩm");
      return;
    }
    setDraft((d) => ({ ...d, items: [...d.items, { product, note: "" }] }));
    setSearch("");
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.items.length) return;
    setDraft((d) => {
      const items = [...d.items];
      [items[index], items[target]] = [items[target], items[index]];
      return { ...d, items };
    });
  };

  const removeItem = (index: number) => {
    setDraft((d) => ({ ...d, items: d.items.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    const start_at = fromLocalInput(draft.start_at);
    const end_at = fromLocalInput(draft.end_at);
    if (start_at && end_at && new Date(start_at) > new Date(end_at)) {
      setError("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await storefrontApi.upsertSection(activeType, {
        // Giờ vàng: tiêu đề / lịch lấy theo chiến dịch Flash Sale, không lưu riêng để tránh mâu thuẫn
        title: isFlashSale ? null : draft.title.trim() || null,
        subtitle: isFlashSale ? null : draft.subtitle.trim() || null,
        is_active: draft.is_active,
        start_at: isFlashSale ? null : start_at,
        end_at: isFlashSale ? null : end_at,
        branch_id: scope,
        // Giờ vàng không lưu sản phẩm ở đây: danh sách món do chiến dịch Flash Sale quyết định
        items: isFlashSale ? [] : draft.items.map((i) => ({ product_id: i.product.id, note: i.note.trim() || null })),
      });
      setSections((s) => (s ? { ...s, [activeType]: saved } : s));
      onNotify(`Đã lưu khối "${meta.label}"`);
    } catch (err) {
      setError(getErrorMessage(err, "Lưu khối thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!current) return;
    const fallback = isGlobalScope ? "nội dung mặc định" : "cấu hình toàn chuỗi";
    if (!window.confirm(`Xóa cấu hình khối "${meta.label}"? Trang chủ sẽ quay về ${fallback}.`)) return;
    try {
      await storefrontApi.deleteSection(activeType, scope);
      setSections((s) => (s ? { ...s, [activeType]: null } : s));
      onNotify(`Đã xóa cấu hình khối "${meta.label}"`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {HOME_SECTION_TYPES.map((type) => {
          const s = sections?.[type];
          const status = s ? LIVE_STATUS_STYLE[getLiveStatus(s)] : null;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                activeType === type
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface text-foreground border-border hover:bg-primary-tint/50"
              }`}
            >
              {HOME_SECTION_META[type].label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${activeType === type ? "border-white/40 text-white" : status ? status.className : "border-border text-muted"}`}>
                {s ? `${s.products.length} món` : "Tự động"}
              </span>
            </button>
          );
        })}
        <Button variant="outline" size="sm" onClick={fetchSections} disabled={loading} className="rounded-xl text-xs gap-1.5 ml-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      <div className="bg-surface rounded-3xl border border-border shadow-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-foreground">{meta.label}</h3>
            <p className="text-xs text-muted mt-0.5">{meta.description}</p>
            <p className="text-[11px] text-muted mt-1">
              {current
                ? "Phạm vi này đã có cấu hình riêng."
                : isFlashSale
                ? "Tiêu đề khối luôn là tên chiến dịch Giờ Vàng đang chạy / sắp chạy."
                : isGlobalScope
                ? "Chưa cấu hình: trang chủ đang tự chọn sản phẩm theo mặc định."
                : "Chưa cấu hình: chi nhánh đang dùng cấu hình toàn chuỗi (hoặc mặc định)."}
            </p>
          </div>
          {current && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border self-start ${LIVE_STATUS_STYLE[getLiveStatus(current)].className}`}>
              {LIVE_STATUS_STYLE[getLiveStatus(current)].label}
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark border border-danger/20 text-xs font-medium">{error}</div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">
        <div className="xl:col-span-3 space-y-5 min-w-0">
        {!isFlashSale && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Tiêu đề khối (để trống dùng tiêu đề mặc định)</label>
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={150} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Mô tả ngắn</label>
            <Input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} maxLength={255} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Bắt đầu</label>
            <Input type="datetime-local" value={draft.start_at} onChange={(e) => setDraft({ ...draft, start_at: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Kết thúc</label>
            <Input type="datetime-local" value={draft.end_at} onChange={(e) => setDraft({ ...draft, end_at: e.target.value })} />
          </div>
        </div>
        )}

        <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
          <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="w-4 h-4 accent-primary" />
          {isFlashSale ? "Hiển thị khối Giờ vàng trên trang chủ" : "Bật khối này"}
        </label>

        {isFlashSale ? (
          <div className="rounded-2xl border border-accent/30 bg-accent-tint/40 p-4 space-y-3" data-testid="section-flash-sale-source">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-tint border border-accent/30 text-accent-dark flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-bold text-foreground">Sản phẩm và mức giảm lấy từ chiến dịch Flash Sale</p>
                <p className="text-[11px] text-muted leading-relaxed">
                  Tiêu đề khối chính là <strong>Tên chiến dịch</strong>, còn khung giờ, danh sách món, giá sale và kiểu
                  giảm (% / tiền mặt) đều lấy từ trang Quản lý Giờ Vàng, nên không bị lệch giữa hai nơi. Ở đây chỉ bật / tắt
                  việc hiển thị khối trên trang chủ.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-foreground">
              {flashCampaign ? (
                <span>
                  {flashSaleData?.status === "UPCOMING" ? "Sắp diễn ra" : "Đang diễn ra"}:{" "}
                  <strong>{flashCampaign.name}</strong> · {flashCampaign.items?.length || 0} món ·{" "}
                  {flashSaleData?.startDateTime ? formatDateTimeVN(flashSaleData.startDateTime) : flashCampaign.start_time?.slice(0, 5)} →{" "}
                  {flashSaleData?.endDateTime ? formatDateTimeVN(flashSaleData.endDateTime) : flashCampaign.end_time?.slice(0, 5)}
                </span>
              ) : (
                <span className="text-muted">Hiện chưa có chiến dịch nào đang chạy, khối sẽ tự ẩn trên trang chủ.</span>
              )}
            </div>
            {isAdmin ? (
              <Button variant="outline" size="sm" asChild className="rounded-xl text-xs gap-1.5">
                <Link to="/admin/flash-sales">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở Quản lý Giờ Vàng
                </Link>
              </Button>
            ) : (
              <p className="text-[11px] text-muted">Liên hệ Admin để thay đổi món hoặc mức giảm của Giờ vàng.</p>
            )}
          </div>
        ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              Sản phẩm đã chọn ({draft.items.length}){" "}
              <span className="text-muted font-normal">· trang chủ hiển thị tối đa {meta.max} món đầu</span>
            </label>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Tìm sản phẩm theo tên hoặc SKU để thêm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
              data-testid="section-product-search"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-2xl shadow-xl max-h-72 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-primary-tint/40"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-border shrink-0">
                      <ProductImage src={resolveAssetUrl(p.images[0])} alt={p.name} productName={p.name} width={36} height={36} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] text-muted">{p.sku} · {formatCurrency(p.discountPrice || p.price)}</p>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border divide-y divide-border/60">
            {draft.items.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted">
                <Package className="w-5 h-5 mx-auto mb-1.5 text-muted" />
                Chưa chọn sản phẩm nào. Lưu khi danh sách trống thì trang chủ dùng cách chọn mặc định.
              </div>
            ) : (
              draft.items.map((item, index) => (
                <div key={item.product.id} className={`p-3 flex flex-col sm:flex-row gap-3 sm:items-center ${index >= meta.max ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-[11px] font-mono text-muted w-5 text-right">{index + 1}</span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                      <ProductImage src={resolveAssetUrl(item.product.images[0])} alt={item.product.name} productName={item.product.name} width={40} height={40} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.product.name}</p>
                      <p className="text-[11px] text-muted">
                        {formatCurrency(item.product.discountPrice || item.product.price)}
                        {index >= meta.max && " · không hiển thị (vượt số món tối đa)"}
                      </p>
                    </div>
                  </div>
                  {activeType === "CSM_PICKS" && (
                    <Input
                      placeholder="Lời giới thiệu (tuỳ chọn)"
                      value={item.note}
                      maxLength={255}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          items: d.items.map((it, i) => (i === index ? { ...it, note: e.target.value } : it)),
                        }))
                      }
                      className="text-xs sm:w-72"
                    />
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground disabled:opacity-30" aria-label="Đưa lên">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => moveItem(index, 1)} disabled={index === draft.items.length - 1} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground disabled:opacity-30" aria-label="Đưa xuống">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => removeItem(index)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-danger-dark hover:bg-danger-pastel" aria-label="Bỏ sản phẩm">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}

        </div>

        <div className="xl:col-span-2 xl:sticky xl:top-4 space-y-1.5">
          <p className="text-xs font-semibold text-foreground">Xem trước trên trang chủ</p>
          <SectionLivePreview
            type={activeType}
            title={isFlashSale ? flashCampaign?.name || "" : draft.title}
            subtitle={isFlashSale ? "" : draft.subtitle}
            items={isFlashSale ? flashPreviewItems : draft.items}
            enabled={draft.is_active}
          />
        </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!current} className="rounded-xl text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Xóa cấu hình, dùng mặc định
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-xl text-xs font-semibold gap-1.5" data-testid="section-save">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Đang lưu..." : "Lưu khối"}
          </Button>
        </div>
      </div>
    </div>
  );
}
