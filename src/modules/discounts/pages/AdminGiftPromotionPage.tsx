import React, { useState, useEffect } from "react";
import { Gift, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, X, AlertCircle } from "lucide-react";
import {
  giftPromotionApi,
  GiftPromotion,
  GiftRuleType,
  CreateGiftPromotionPayload,
} from "../../../api/giftPromotionApi";
import { productApi } from "../../../api/productApi";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Card } from "../../../components/ui/Card";

export function AdminGiftPromotionPage() {
  const [promotions, setPromotions] = useState<GiftPromotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState<GiftRuleType>("BUY_X_GET_Y");
  const [buyProductId, setBuyProductId] = useState("");
  const [buyQuantity, setBuyQuantity] = useState(2);
  const [minOrderAmount, setMinOrderAmount] = useState(100000);
  const [giftProductId, setGiftProductId] = useState("");
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [maxGiftsPerOrder, setMaxGiftsPerOrder] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [promos, prods] = await Promise.all([
        giftPromotionApi.getAll(),
        productApi.getProducts(),
      ]);
      setPromotions(promos);
      setProducts(prods || []);
      if (prods && prods.length > 0) {
        if (!buyProductId) setBuyProductId(prods[0].id);
        if (!giftProductId) setGiftProductId(prods[0].id);
      }
    } catch {
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Vui lòng nhập tên chương trình.");
      return;
    }
    if (!giftProductId) {
      setFormError("Vui lòng chọn sản phẩm quà tặng.");
      return;
    }

    const buyProd = products.find((p) => p.id === buyProductId);
    const giftProd = products.find((p) => p.id === giftProductId);

    const payload: CreateGiftPromotionPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      rule_type: ruleType,
      buy_product_id: ruleType === "BUY_X_GET_Y" ? buyProductId : null,
      buy_product_name: ruleType === "BUY_X_GET_Y" ? buyProd?.name || null : null,
      buy_quantity: ruleType === "BUY_X_GET_Y" ? Math.max(1, buyQuantity) : 1,
      min_order_amount: ruleType === "MIN_ORDER_GIFT" ? Number(minOrderAmount) : null,
      gift_product_id: giftProductId,
      gift_product_name: giftProd?.name || null,
      gift_quantity: Math.max(1, giftQuantity),
      max_gifts_per_order: Math.max(1, maxGiftsPerOrder),
      is_active: true,
    };

    try {
      setSubmitting(true);
      await giftPromotionApi.create(payload);
      setIsModalOpen(false);
      setName("");
      setDescription("");
      await fetchAll();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Không thể tạo chương trình";
      setFormError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary">
              <Gift className="w-5 h-5" />
            </span>
            <span>Quản Lý Quà Tặng (Mua X Tặng Y)</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Thiết lập chương trình mua sản phẩm tặng thêm quà 0đ hoặc tặng quà theo giá trị đơn hàng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} className="rounded-xl gap-1.5">
            <RefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Tạo khuyến mãi tặng quà</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-surface-soft border border-border animate-pulse" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl space-y-2">
          <Gift className="w-10 h-10 text-muted mx-auto" />
          <p className="font-bold text-foreground">Chưa có chương trình tặng quà nào</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo) => (
            <Card key={promo.id} className="p-5 rounded-3xl space-y-3 border border-border/80">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    promo.rule_type === "BUY_X_GET_Y"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-sky-50 text-sky-800 border-sky-200"
                  }`}
                >
                  {promo.rule_type === "BUY_X_GET_Y" ? "MUA X TẶNG Y" : "QUÀ THEO ĐƠN"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    promo.is_active ? "bg-emerald-50 text-emerald-700" : "bg-surface-soft text-muted"
                  }`}
                >
                  {promo.is_active ? "Đang áp dụng" : "Tạm tắt"}
                </span>
              </div>

              <div>
                <h3 className="font-black text-base text-foreground">{promo.name}</h3>
                {promo.description && <p className="text-xs text-muted mt-0.5">{promo.description}</p>}
              </div>

              <div className="p-3 rounded-2xl bg-surface-soft border border-border/60 text-xs space-y-1">
                <div>
                  <span className="text-muted">Điều kiện: </span>
                  <strong className="text-foreground">
                    {promo.rule_type === "BUY_X_GET_Y"
                      ? `Mua ${promo.buy_quantity}x ${promo.buy_product_name || promo.buy_product_id}`
                      : `Đơn hàng từ ${formatVND(Number(promo.min_order_amount) || 0)}`}
                  </strong>
                </div>
                <div>
                  <span className="text-muted">Quà tặng 0đ: </span>
                  <strong className="text-emerald-700">
                    {promo.gift_quantity}x {promo.gift_product_name || promo.gift_product_id}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={async () => {
                    await giftPromotionApi.toggle(promo.id);
                    fetchAll();
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  {promo.is_active ? (
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-muted" />
                  )}
                  <span>{promo.is_active ? "Đang bật" : "Đang tắt"}</span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await giftPromotionApi.delete(promo.id);
                    fetchAll();
                  }}
                  className="text-danger hover:bg-danger-pastel/60 rounded-xl h-8 px-2.5"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-black text-foreground">Tạo chương trình Tặng Quà Mới</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl hover:bg-surface-soft">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold block mb-1">Tên chương trình *</label>
                <Input
                  required
                  placeholder="VD: Mua 2 Trà sữa tặng 1 Snack"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Loại điều kiện</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as GiftRuleType)}
                  className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-xs font-semibold"
                >
                  <option value="BUY_X_GET_Y">Mua X sản phẩm tặng Y</option>
                  <option value="MIN_ORDER_GIFT">Đơn đạt giá trị tối thiểu tặng quà</option>
                </select>
              </div>

              {ruleType === "BUY_X_GET_Y" ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-bold block mb-1">Sản phẩm cần mua</label>
                    <select
                      value={buyProductId}
                      onChange={(e) => setBuyProductId(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border bg-surface px-2.5 text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Số lượng mua</label>
                    <Input
                      type="number"
                      min={1}
                      value={buyQuantity}
                      onChange={(e) => setBuyQuantity(Number(e.target.value))}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold block mb-1">Giá trị đơn tối thiểu (VNĐ)</label>
                  <Input
                    type="number"
                    min={1000}
                    step={5000}
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-bold block mb-1">Sản phẩm tặng kèm (0đ)</label>
                  <select
                    value={giftProductId}
                    onChange={(e) => setGiftProductId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-border bg-surface px-2.5 text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">SL tặng</label>
                  <Input
                    type="number"
                    min={1}
                    value={giftQuantity}
                    onChange={(e) => setGiftQuantity(Number(e.target.value))}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Số lần tặng tối đa / đơn</label>
                <Input
                  type="number"
                  min={1}
                  value={maxGiftsPerOrder}
                  onChange={(e) => setMaxGiftsPerOrder(Number(e.target.value))}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                  Huỷ
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl">
                  {submitting ? "Đang lưu..." : "Lưu chương trình"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
