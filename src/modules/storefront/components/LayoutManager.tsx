import { useCallback, useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Save, RotateCcw, RefreshCw, GripVertical, Lock } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { storefrontApi, HomeLayoutBlock, HOME_BLOCK_META, DEFAULT_HOME_LAYOUT } from "../../../api/storefrontApi";
import { getErrorMessage } from "../utils";

interface LayoutManagerProps {
  scope: string;
  isGlobalScope: boolean;
  onNotify: (msg: string) => void;
}

export function LayoutManager({ scope, isGlobalScope, onNotify }: LayoutManagerProps) {
  const [blocks, setBlocks] = useState<HomeLayoutBlock[]>(DEFAULT_HOME_LAYOUT);
  const [hasCustom, setHasCustom] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fetchLayout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const saved = await storefrontApi.getLayout(scope);
      setBlocks(saved || DEFAULT_HOME_LAYOUT);
      setHasCustom(!!saved);
      setDirty(false);
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được bố cục"));
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || from === to) return;
    setBlocks((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDirty(true);
  };

  const toggle = (index: number) => {
    setBlocks((list) => list.map((b, i) => (i === index ? { ...b, visible: !b.visible } : b)));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      setBlocks(await storefrontApi.saveLayout(scope, blocks));
      setHasCustom(true);
      setDirty(false);
      onNotify("Đã lưu bố cục trang chủ");
    } catch (err) {
      setError(getErrorMessage(err, "Lưu bố cục thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const target = isGlobalScope ? "bố cục mặc định" : "bố cục toàn chuỗi";
    if (!window.confirm(`Xóa bố cục riêng và quay về ${target}?`)) return;
    try {
      if (hasCustom) await storefrontApi.deleteLayout(scope);
      setBlocks(DEFAULT_HOME_LAYOUT);
      setHasCustom(false);
      setDirty(false);
      onNotify("Đã khôi phục bố cục");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const visibleCount = blocks.filter((b) => b.visible).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-muted max-w-xl">
          Kéo thả hoặc dùng mũi tên để đổi thứ tự các khối trên trang chủ, bấm con mắt để ẩn/hiện. Lời chào và slider
          banner luôn ở đầu trang.{" "}
          {hasCustom
            ? "Phạm vi này đang dùng bố cục riêng."
            : isGlobalScope
            ? "Đang dùng bố cục mặc định."
            : "Chi nhánh đang dùng bố cục toàn chuỗi (hoặc mặc định)."}
        </p>
        <Button variant="outline" size="sm" onClick={fetchLayout} disabled={loading} className="rounded-xl text-xs gap-1.5 shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark border border-danger/20 text-xs font-medium">{error}</div>
      )}

      <div className="bg-surface rounded-3xl border border-border shadow-card p-4 sm:p-5 space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-soft border border-dashed border-border text-xs text-muted">
          <Lock className="w-4 h-4" />
          Lời chào theo giờ và slider banner (cố định ở đầu trang)
        </div>

        <ol className="space-y-2" data-testid="layout-list">
          {blocks.map((block, index) => {
            const meta = HOME_BLOCK_META[block.key];
            return (
              <li
                key={block.key}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) move(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  dragIndex === index ? "border-primary bg-primary-tint/40" : "border-border bg-surface"
                }`}
              >
                <GripVertical className="w-4 h-4 text-muted cursor-grab shrink-0" aria-hidden />
                <span className="text-[11px] font-mono text-muted w-5 text-right">{index + 1}</span>
                <div className={`flex-1 min-w-0 ${block.visible ? "" : "opacity-50"}`}>
                  <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                  <p className="text-[11px] text-muted truncate">{meta.description}</p>
                </div>
                <span
                  className={`hidden sm:inline text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    block.visible ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/25" : "bg-surface-soft text-muted border-border"
                  }`}
                >
                  {block.visible ? "Đang hiện" : "Đang ẩn"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => toggle(index)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground" aria-label={block.visible ? `Ẩn ${meta.label}` : `Hiện ${meta.label}`}>
                    {block.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground disabled:opacity-30" aria-label="Đưa lên">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => move(index, index + 1)} disabled={index === blocks.length - 1} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground disabled:opacity-30" aria-label="Đưa xuống">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasCustom && !dirty} className="rounded-xl text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục mặc định
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted">
              {visibleCount}/{blocks.length} khối đang hiện{dirty ? " · có thay đổi chưa lưu" : ""}
            </span>
            <Button size="sm" onClick={handleSave} disabled={saving || !dirty} className="rounded-xl text-xs font-semibold gap-1.5" data-testid="layout-save">
              <Save className="w-3.5 h-3.5" />
              {saving ? "Đang lưu..." : "Lưu bố cục"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
