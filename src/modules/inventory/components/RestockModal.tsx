import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, PackagePlus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
  onRestock: (payload: { branchId: string; productId: string; quantity: number }) => Promise<any>;
}

export function RestockModal({ isOpen, onClose, branch, products, onRestock }: RestockModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [quantity, setQuantity] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      setSuccessMsg(`Nhập thành công +${quantity} ${prodName} vào kho chi nhánh ${branch.name}!`);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
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
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {/* Chi nhánh đang chọn */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted">Chi nhánh áp dụng</Label>
                <div className="p-3 bg-surface-soft border border-border rounded-2xl text-xs font-bold text-foreground flex items-center justify-between">
                  <span>{branch?.name || "Chi nhánh chưa xác định"}</span>
                  <span className="text-[10px] font-mono text-muted bg-surface px-2 py-0.5 rounded-lg border border-border">
                    {branch?.id}
                  </span>
                </div>
              </div>

              {/* Chọn Sản phẩm */}
              <div className="space-y-1.5">
                <Label htmlFor="product-select" className="text-xs font-semibold text-muted">
                  Chọn sản phẩm
                </Label>
                <select
                  id="product-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nhập số lượng */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity-input" className="text-xs font-semibold text-muted">
                  Số lượng nhập thêm (kiện / cái)
                </Label>
                <Input
                  id="quantity-input"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="Ví dụ: 50"
                  className="rounded-2xl"
                  required
                />
              </div>

              {/* Error & Success Messages */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-2xl bg-success-pastel border border-success/25 text-success-dark text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl gap-2 font-bold shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Xác nhận nhập"
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
