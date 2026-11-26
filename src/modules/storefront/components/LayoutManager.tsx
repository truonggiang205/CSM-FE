import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Save, RotateCcw, RefreshCw, GripVertical, Info, Map as MapIcon } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import {
  storefrontApi,
  HomeBlockKey,
  HomeLayoutBlock,
  HOME_BLOCK_META,
  DEFAULT_HOME_LAYOUT,
} from "../../../api/storefrontApi";
import { getErrorMessage } from "../utils";
import { HomeWireframe, BLOCK_COLORS } from "./HomeWireframe";

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
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [hoverKey, setHoverKey] = useState<HomeBlockKey | null>(null);
  const [selectedKey, setSelectedKey] = useState<HomeBlockKey | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const rowRefs = useRef<Partial<Record<HomeBlockKey, HTMLLIElement | null>>>({});

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
    setSelectedKey(blocks[from].key);
    setDirty(true);
  };

  const toggle = (index: number) => {
    setBlocks((list) => list.map((b, i) => (i === index ? { ...b, visible: !b.visible } : b)));
    setSelectedKey(blocks[index].key);
    setDirty(true);
  };

  const selectFromMap = (key: HomeBlockKey) => {
    setSelectedKey(key);
    rowRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
  const activeKey = hoverKey || selectedKey;
  let visibleNo = 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-info-pastel border border-info/20 text-xs text-info-dark">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold">Sắp xếp các khối từ trên xuống dưới giống trang chủ thật.</p>
          <p>
            Kéo thả hoặc dùng mũi tên để đổi chỗ, bấm con mắt để ẩn/hiện. Rê chuột vào một khối để thấy nó nằm ở đâu
            trên sơ đồ bên phải (bấm vào sơ đồ cũng chọn được khối). Lời chào và slider banner luôn ở đầu trang.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark border border-danger/20 text-xs font-medium">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Danh sách khối */}
        <div className="lg:col-span-7 bg-surface rounded-3xl border border-border shadow-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-foreground">Thứ tự các khối</p>
              <p className="text-[11px] text-muted">
                {hasCustom
                  ? "Phạm vi này đang dùng bố cục riêng."
                  : isGlobalScope
                  ? "Đang dùng bố cục mặc định."
                  : "Chi nhánh đang dùng bố cục toàn chuỗi (hoặc mặc định)."}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setShowMapMobile((v) => !v)} className="rounded-xl text-xs gap-1.5 lg:hidden">
                <MapIcon className="w-3.5 h-3.5" />
                {showMapMobile ? "Ẩn sơ đồ" : "Xem sơ đồ"}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchLayout} disabled={loading} className="rounded-xl text-xs gap-1.5" aria-label="Làm mới">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {showMapMobile && (
            <div className="lg:hidden">
              <HomeWireframe blocks={blocks} activeKey={activeKey} onHover={setHoverKey} onSelect={selectFromMap} />
            </div>
          )}

          <ol className="space-y-2" data-testid="layout-list" onMouseLeave={() => setHoverKey(null)}>
            {blocks.map((block, index) => {
              const meta = HOME_BLOCK_META[block.key];
              const color = BLOCK_COLORS[block.key];
              const isActive = activeKey === block.key;
              if (block.visible) visibleNo += 1;
              const showDropLine = dragIndex !== null && overIndex === index && dragIndex !== index;
              return (
                <li
                  key={block.key}
                  ref={(el) => (rowRefs.current[block.key] = el)}
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(index);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverIndex(index);
                  }}
                  onDrop={() => {
                    if (dragIndex !== null) move(dragIndex, index);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onMouseEnter={() => setHoverKey(block.key)}
                  onClick={() => setSelectedKey(block.key)}
                  className={`relative flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border bg-surface transition-all cursor-grab active:cursor-grabbing ${
                    isActive ? `ring-2 ${color.ring} border-transparent` : "border-border hover:border-primary/30"
                  } ${dragIndex === index ? "opacity-40" : ""}`}
                  data-key={block.key}
                >
                  {showDropLine && <span className="absolute -top-1.5 left-3 right-3 h-0.5 rounded-full bg-primary" aria-hidden />}
                  <GripVertical className="w-4 h-4 text-muted shrink-0" aria-hidden />
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      block.visible ? `${color.dot} text-white` : "bg-surface-soft text-muted border border-dashed border-border"
                    }`}
                    title={block.visible ? `Vị trí số ${visibleNo} trên trang chủ` : "Đang ẩn"}
                  >
                    {block.visible ? visibleNo : "–"}
                  </span>
                  <div className={`flex-1 min-w-0 ${block.visible ? "" : "opacity-50"}`}>
                    <p className="text-sm font-semibold text-foreground truncate">{meta.label}</p>
                    <p className="text-[11px] text-muted truncate">{meta.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggle(index)}
                      className={`h-8 px-2 rounded-lg border flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                        block.visible
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                          : "border-border bg-surface-soft text-muted hover:text-foreground"
                      }`}
                      aria-label={block.visible ? `Ẩn ${meta.label}` : `Hiện ${meta.label}`}
                      aria-pressed={block.visible}
                    >
                      {block.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{block.visible ? "Hiện" : "Ẩn"}</span>
                    </button>
                    <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground disabled:opacity-30" aria-label={`Đưa ${meta.label} lên`}>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => move(index, index + 1)} disabled={index === blocks.length - 1} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-foreground disabled:opacity-30" aria-label={`Đưa ${meta.label} xuống`}>
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
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className={`text-[11px] ${dirty ? "text-amber-700 font-semibold" : "text-muted"}`}>
                {visibleCount}/{blocks.length} khối đang hiện{dirty ? " · chưa lưu" : ""}
              </span>
              <Button size="sm" onClick={handleSave} disabled={saving || !dirty} className="rounded-xl text-xs font-semibold gap-1.5" data-testid="layout-save">
                <Save className="w-3.5 h-3.5" />
                {saving ? "Đang lưu..." : "Lưu bố cục"}
              </Button>
            </div>
          </div>
        </div>

        {/* Sơ đồ trang chủ */}
        <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <MapIcon className="w-4 h-4 text-primary" />
              Sơ đồ trang chủ
            </p>
            <span className="text-[11px] text-muted">Cập nhật ngay khi bạn sắp xếp</span>
          </div>
          <HomeWireframe blocks={blocks} activeKey={activeKey} onHover={setHoverKey} onSelect={selectFromMap} />
        </div>
      </div>
    </div>
  );
}
