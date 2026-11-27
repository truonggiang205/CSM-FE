import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, PackagePlus, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Branch } from "../../../types/branch";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | undefined;
  products: Product[];
  currentStockMap?: Record<string, number>;
  initialProductId?: string;
  onRestock: (payload: { branchId: string; productId: string; quantity: number }) => Promise<any>;
}

export function RestockModal({
  isOpen,
  onClose,
  branch,
  products,
  currentStockMap = {},
  initialProductId,
  onRestock,
}: RestockModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || ""
  );
  const [quantity, setQuantity] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tính tồn hiện tại và tồn dự kiến sau khi nhập
  const currentQty = useMemo(() => {
    return currentStockMap[selectedProductId] ?? 0;
  }, [currentStockMap, selectedProductId]);

  const projectedQty = useMemo(() => {
    const q = Number(quantity) || 0;
    return currentQty + q;
  }, [currentQty, quantity]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!branch) {
      setErrorMsg("Vui lòng chọn chi nhánh cần nhập kho.");
      return;
    }

    if (!selectedProductId) {
      setErrorMsg("Vui lòng chọn sản phẩm cần nhập thêm.");
      return;
    }

    if (quantity <= 0 || !Number.isInteger(Number(quantity))) {
      setErrorMsg("Số lượng nhập kho phải là số nguyên dương (> 0).");
      return;
    }

    try {
      setIsSubmitting(true);
      await onRestock({
        branchId: branch.id,
        productId: selectedProductId,
        quantity: Number(quantity),
      });

      const prodName = products.find((p) => p.id === selectedProductId)?.name || "sản phẩm";
      setSuccessMsg(
        `Nhập thành công +${quantity} ${prodName}! Tồn kho chi nhánh ${branch.name} tăng từ ${currentQty} lên ${projectedQty} món.`
      );

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.response?.data?.message || err.message || "Không thể nhập kho. Vui lòng thử lại.");
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-md bg-surface rounded-3xl border border-border shadow-2xl p-6 sm:p-7 z-10 overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Nhập hàng vào kho</h2>
                <p className="text-xs text-muted">Bổ sung số lượng tồn thực tế cho chi nhánh</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-muted hover:text-foreground rounded-xl p-1.5 transition-colors"
              aria-label="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {errorMsg && (
              <div className="p-3 bg-danger-pastel border border-danger/30 rounded-xl flex items-center gap-2.5 text-xs text-danger-dark animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-pastel-mint border border-success/30 rounded-xl flex items-center gap-2.5 text-xs text-success-dark font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Chi nhánh */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted">Chi nhánh áp dụng</Label>
              <div className="px-3.5 py-2.5 rounded-xl bg-surface-soft border border-border text-xs font-bold text-foreground">
                {branch?.name || "Chưa xác định"} ({branch?.id})
              </div>
            </div>

            {/* Sản phẩm */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted">Chọn sản phẩm nhập kho</Label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={isSubmitting}
                className="w-full text-xs font-bold rounded-xl border border-border bg-surface px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer shadow-2xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku || p.id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            {/* Số lượng nhập */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted">Số lượng bổ sung (+)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                disabled={isSubmitting}
                className="text-xs font-bold h-10 rounded-xl"
                placeholder="Nhập số lượng (> 0)..."
              />
            </div>

            {/* Khối hiển thị Tồn trước / sau khi nhập */}
            <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/80 text-xs space-y-1.5">
              <div className="flex justify-between text-muted">
                <span>Tồn thực tế hiện tại:</span>
                <strong className="text-foreground">{currentQty} món</strong>
              </div>
              <div className="flex justify-between text-muted">
                <span>Số lượng nhập thêm:</span>
                <strong className="text-primary-dark">+{Number(quantity) || 0} món</strong>
              </div>
              <div className="pt-1.5 border-t border-border/60 flex justify-between font-bold text-foreground items-center">
                <span>Dự kiến tồn sau nhập:</span>
                <span className="text-sm font-black text-primary-dark flex items-center gap-1">
                  <span>{currentQty}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted" />
                  <span className="text-primary">{projectedQty} món</span>
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold min-w-[120px] bg-primary hover:bg-primary-dark text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Đang lưu kho...
                  </>
                ) : (
                  "Xác nhận nhập kho"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
