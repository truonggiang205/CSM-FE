import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Search, LocateFixed, Check, X, Store } from "lucide-react";
import { branchApi } from "../../api/branchApi";
import { useBranchStore } from "../../store/useBranchStore";
import { Branch } from "../../types/branch";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function BranchSelector() {
  const { selectedBranch, isModalOpen, setBranch, openModal, closeModal } = useBranchStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: branchApi.getBranches,
  });

  // Lần đầu vào web nếu chưa có chi nhánh được chọn thì tự động mở modal
  useEffect(() => {
    if (!selectedBranch && branches.length > 0) {
      openModal();
    }
  }, [selectedBranch, branches, openModal]);

  // Lọc chi nhánh theo từ khóa tìm kiếm
  const filteredBranches = branches.filter((b) => {
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q);
  });

  // Xử lý nút "Chọn chi nhánh gần nhất" bằng Geolocation
  const handleSelectNearest = () => {
    if (!navigator.geolocation) {
      setLocationNote("Trình duyệt không hỗ trợ Geolocation. Đã chọn chi nhánh mặc định.");
      if (branches.length > 0) setBranch(branches[0]);
      return;
    }

    setIsLocating(true);
    setLocationNote(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        // TODO: Tính khoảng cách theo toạ độ (Haversine formula) khi Backend bổ sung latitude/longitude vào Branch Entity.
        setLocationNote(`Đã định vị (${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}). Tạm chọn chi nhánh đầu tiên do DB chưa có toạ độ cửa hàng.`);
        if (branches.length > 0) {
          setBranch(branches[0]);
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationNote(`Không thể lấy vị trí (${error.message}). Chọn chi nhánh mặc định.`);
        if (branches.length > 0 && !selectedBranch) {
          setBranch(branches[0]);
        }
      },
      { timeout: 6000 }
    );
  };

  const modalContent = (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-surface rounded-3xl border border-border shadow-2xl p-6 sm:p-7 z-10 overflow-hidden flex flex-col max-h-[85vh] my-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Chọn chi nhánh mua hàng</h2>
                  <p className="text-xs text-muted mt-0.5">Kiểm tra tồn kho chính xác theo từng cửa hàng CSM</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Bar & Search */}
            <div className="space-y-3 py-4">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2 border-primary/30 bg-primary-tint/30 hover:bg-primary-tint text-primary-dark font-semibold h-10 rounded-2xl"
                onClick={handleSelectNearest}
                disabled={isLocating}
              >
                <LocateFixed className={`w-4 h-4 ${isLocating ? "animate-spin text-primary" : ""}`} />
                {isLocating ? "Đang xác định vị trí..." : "Chọn chi nhánh gần nhất với tôi"}
              </Button>

              {locationNote && (
                <p className="text-[11px] text-muted-dark bg-pastel-butter/60 border border-warning/25 px-3 py-2 rounded-xl leading-relaxed">
                  💡 {locationNote}
                </p>
              )}

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  placeholder="Tìm theo tên quận hoặc địa chỉ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9.5 rounded-2xl bg-surface-soft"
                />
              </div>
            </div>

            {/* Branch List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[340px]">
              {isLoading ? (
                <div className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-muted">Đang tải danh sách chi nhánh...</p>
                </div>
              ) : filteredBranches.length === 0 ? (
                <div className="py-10 text-center text-muted text-xs">
                  Không tìm thấy chi nhánh phù hợp với từ khóa.
                </div>
              ) : (
                filteredBranches.map((branch: Branch) => {
                  const isSelected = selectedBranch?.id === branch.id;
                  return (
                    <div
                      key={branch.id}
                      onClick={() => setBranch(branch)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-primary-tint/80 border-primary shadow-sm"
                          : "bg-surface hover:bg-surface-soft border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {branch.name}
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted line-clamp-1">{branch.address}</p>
                      </div>

                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-xs font-semibold text-primary">
                            Chọn
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Note */}
            <div className="pt-4 mt-2 border-t border-border flex items-center justify-between text-[11px] text-muted">
              <span>Tất cả cửa hàng đều phục vụ 24/7</span>
              {selectedBranch && (
                <Button size="sm" className="h-8 rounded-xl px-4" onClick={closeModal}>
                  Xác nhận
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Header Selector Trigger Button */}
      <button
        onClick={openModal}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-soft hover:bg-primary-tint/60 border border-border hover:border-primary/30 transition-all text-left max-w-[200px] sm:max-w-[260px] shadow-sm"
        title="Nhấn để đổi chi nhánh mua hàng"
      >
        <div className="w-7 h-7 rounded-xl bg-primary-tint text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <MapPin className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-muted font-medium flex items-center gap-1">
            <span>Chi nhánh mua hàng</span>
          </div>
          <p className="text-xs font-bold text-foreground truncate">
            {selectedBranch ? selectedBranch.name : "Chọn chi nhánh..."}
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors flex-shrink-0" />
      </button>

      {/* Render modal directly in document.body to prevent containing block trap */}
      {typeof document !== "undefined" ? createPortal(modalContent, document.body) : null}
    </>
  );
}
