import { useEffect, useRef } from "react";
import { EyeOff } from "lucide-react";
import { HomeBlockKey, HomeLayoutBlock, HOME_BLOCK_META } from "../../../api/storefrontApi";

/** Màu nhận diện từng khối: dùng chung cho số thứ tự ở danh sách và sơ đồ để dễ đối chiếu */
export const BLOCK_COLORS: Record<HomeBlockKey, { dot: string; soft: string; ring: string }> = {
  QUICK_MEAL: { dot: "bg-amber-500", soft: "bg-amber-50", ring: "ring-amber-400" },
  FLASH_SALE: { dot: "bg-rose-500", soft: "bg-rose-50", ring: "ring-rose-400" },
  CSM_PICKS: { dot: "bg-emerald-600", soft: "bg-emerald-50", ring: "ring-emerald-500" },
  NEW_ARRIVALS: { dot: "bg-teal-500", soft: "bg-teal-50", ring: "ring-teal-400" },
  COMBO: { dot: "bg-orange-500", soft: "bg-orange-50", ring: "ring-orange-400" },
  SPIN_WHEEL: { dot: "bg-violet-500", soft: "bg-violet-50", ring: "ring-violet-400" },
  CATEGORIES: { dot: "bg-sky-500", soft: "bg-sky-50", ring: "ring-sky-400" },
  FEATURED_PRODUCTS: { dot: "bg-lime-600", soft: "bg-lime-50", ring: "ring-lime-500" },
  WHY_CHOOSE_US: { dot: "bg-cyan-600", soft: "bg-cyan-50", ring: "ring-cyan-500" },
  TESTIMONIALS: { dot: "bg-fuchsia-500", soft: "bg-fuchsia-50", ring: "ring-fuchsia-400" },
};

const Bar = ({ w = "w-full", h = "h-1.5", c = "bg-slate-300" }: { w?: string; h?: string; c?: string }) => (
  <div className={`${w} ${h} ${c} rounded-full`} />
);
const Card = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-md bg-white border border-slate-200 flex flex-col gap-1 p-1 ${className}`}>
    <div className="aspect-square rounded bg-slate-200" />
    <Bar w="w-3/4" h="h-1" />
    <Bar w="w-1/2" h="h-1" c="bg-emerald-300" />
  </div>
);

/** Bản vẽ phác (wireframe) của từng khối, mô phỏng hình dạng thật trên trang chủ */
function BlockSketch({ blockKey }: { blockKey: HomeBlockKey }) {
  switch (blockKey) {
    case "QUICK_MEAL":
      return (
        <div className="grid grid-cols-5 gap-2 items-center">
          <div className="col-span-3 space-y-1">
            <Bar w="w-1/3" h="h-1" c="bg-amber-300" />
            <Bar w="w-4/5" h="h-2" c="bg-slate-400" />
            <Bar w="w-3/5" />
            <div className="flex gap-1 pt-0.5">
              <div className="h-2.5 w-10 rounded bg-emerald-400" />
              <div className="h-2.5 w-10 rounded border border-slate-300" />
            </div>
          </div>
          <div className="col-span-2 relative h-12">
            <div className="absolute inset-0 m-auto w-8 h-8 rounded-full border-2 border-dashed border-amber-300" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`absolute w-3.5 h-3.5 rounded-full bg-white border border-slate-300 ${["top-0 left-1", "top-0 right-1", "bottom-0 left-1", "bottom-0 right-1"][i]}`} />
            ))}
          </div>
        </div>
      );
    case "FLASH_SALE":
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between rounded-md bg-white border border-rose-200 px-1.5 py-1">
            <Bar w="w-1/3" h="h-1.5" c="bg-rose-400" />
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} />
            ))}
          </div>
        </div>
      );
    case "CSM_PICKS":
      return (
        <div className="space-y-1.5">
          <div className="flex flex-col items-center gap-0.5">
            <Bar w="w-1/4" h="h-1" c="bg-emerald-300" />
            <Bar w="w-1/2" h="h-2" c="bg-slate-400" />
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-md bg-white border border-emerald-200 p-1 space-y-0.5">
                <div className="aspect-[4/3] rounded bg-slate-200" />
                <Bar w="w-2/3" h="h-1" />
                <div className="h-2 rounded bg-emerald-50 border border-emerald-100" />
              </div>
            ))}
          </div>
        </div>
      );
    case "NEW_ARRIVALS":
      return (
        <div className="space-y-1.5">
          <div className="flex items-end justify-between">
            <div className="space-y-0.5 w-1/2">
              <Bar w="w-1/2" h="h-1" c="bg-teal-300" />
              <Bar h="h-2" c="bg-slate-400" />
            </div>
            <div className="h-2.5 w-10 rounded border border-slate-300" />
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} />
            ))}
          </div>
        </div>
      );
    case "COMBO":
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md bg-white border border-orange-200 p-1.5 flex flex-col items-center gap-1">
              <div className="relative w-10 h-8">
                <div className="absolute inset-0 m-auto w-4 h-4 rounded bg-orange-200" />
                <div className="absolute top-0 left-0 w-3 h-3 rounded-full bg-slate-200" />
                <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-slate-200" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-200" />
              </div>
              <Bar w="w-3/4" h="h-1" />
            </div>
          ))}
        </div>
      );
    case "SPIN_WHEEL":
      return (
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full border-2 border-violet-300 shrink-0"
            style={{ background: "conic-gradient(#ddd6fe 0 60deg,#fff 60deg 120deg,#ddd6fe 120deg 180deg,#fff 180deg 240deg,#ddd6fe 240deg 300deg,#fff 300deg)" }}
          />
          <div className="flex-1 space-y-1">
            <Bar w="w-2/3" h="h-2" c="bg-slate-400" />
            <Bar w="w-4/5" />
            <div className="h-2.5 w-12 rounded bg-violet-400" />
          </div>
        </div>
      );
    case "CATEGORIES":
      return (
        <div className="space-y-1.5">
          <Bar w="w-1/3 mx-auto" h="h-1.5" c="bg-slate-400" />
          <div className="grid grid-cols-6 gap-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-5 rounded-lg bg-sky-100 border border-sky-200" />
                <Bar w="w-4/5" h="h-1" />
              </div>
            ))}
          </div>
        </div>
      );
    case "FEATURED_PRODUCTS":
      return (
        <div className="space-y-1.5">
          <Bar w="w-1/3" h="h-1.5" c="bg-slate-400" />
          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Card key={i} />
            ))}
          </div>
        </div>
      );
    case "WHY_CHOOSE_US":
      return (
        <div className="grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-md bg-white border border-cyan-200 p-1 flex flex-col items-center gap-0.5">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-200" />
              <Bar w="w-4/5" h="h-1" />
              <Bar w="w-3/5" h="h-1" c="bg-slate-200" />
            </div>
          ))}
        </div>
      );
    case "TESTIMONIALS":
      return (
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md bg-white border border-fuchsia-200 p-1 space-y-0.5">
              <div className="text-[9px] leading-none text-fuchsia-300 font-serif">“</div>
              <Bar h="h-1" c="bg-slate-200" />
              <Bar w="w-3/4" h="h-1" c="bg-slate-200" />
              <div className="flex items-center gap-0.5 pt-0.5">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <Bar w="w-1/2" h="h-1" />
              </div>
            </div>
          ))}
        </div>
      );
  }
}

interface HomeWireframeProps {
  blocks: HomeLayoutBlock[];
  activeKey: HomeBlockKey | null;
  onHover: (key: HomeBlockKey | null) => void;
  onSelect: (key: HomeBlockKey) => void;
  showAnnouncement?: boolean;
}

/**
 * Sơ đồ thu nhỏ của trang chủ (như một trình duyệt mini) giúp người mới biết từng khối nằm ở đâu.
 * Thứ tự cập nhật ngay khi kéo thả bên danh sách; khối đang ẩn hiện thành dải gạch đứt.
 */
export function HomeWireframe({ blocks, activeKey, onHover, onSelect, showAnnouncement = true }: HomeWireframeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Partial<Record<HomeBlockKey, HTMLDivElement | null>>>({});

  // Khi chọn/rê một khối bên danh sách, cuộn sơ đồ tới đúng khối đó
  useEffect(() => {
    if (!activeKey) return;
    const el = itemRefs.current[activeKey];
    const box = scrollRef.current;
    if (!el || !box) return;
    const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
    box.scrollTo({ top, behavior: "smooth" });
  }, [activeKey]);

  // Số thứ tự hiển thị của từng khối đang bật (tính trước, không đổi biến trong lúc render JSX)
  const visibleNoByKey = new Map<string, number>();
  blocks.filter((b) => b.visible).forEach((b, i) => visibleNoByKey.set(b.key, i + 1));

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden" data-testid="home-wireframe">
      {/* Khung trình duyệt mini */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-soft border-b border-border">
        <span className="w-2 h-2 rounded-full bg-rose-300" />
        <span className="w-2 h-2 rounded-full bg-amber-300" />
        <span className="w-2 h-2 rounded-full bg-emerald-300" />
        <span className="ml-2 flex-1 h-4 rounded-md bg-white border border-border text-[9px] text-muted px-2 flex items-center">csm.vn / trang chủ</span>
      </div>

      <div ref={scrollRef} className="relative max-h-[640px] overflow-y-auto p-2.5 space-y-1.5 bg-slate-50 scroll-smooth">
        {/* Phần cố định ở đầu trang */}
        {showAnnouncement && <div className="h-2.5 rounded bg-primary-dark/80" title="Thanh thông báo" />}
        <div className="h-5 rounded-md bg-white border border-slate-200 flex items-center px-1.5 gap-1.5" title="Thanh menu">
          <div className="w-3 h-3 rounded bg-emerald-200" />
          <Bar w="w-10" h="h-1" />
          <div className="flex-1 h-2 rounded-full bg-slate-100 mx-2" />
          <div className="w-3 h-3 rounded bg-slate-200" />
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-2 space-y-1.5" title="Phần cố định">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-muted uppercase tracking-wide">Cố định ở đầu trang</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 items-center">
            <div className="col-span-3 space-y-1">
              <Bar w="w-1/3" h="h-1" c="bg-amber-200" />
              <Bar w="w-4/5" h="h-2" c="bg-slate-300" />
              <Bar w="w-2/3" c="bg-slate-200" />
            </div>
            <div className="col-span-2 h-8 rounded-md bg-slate-100" />
          </div>
          <div className="h-10 rounded-md bg-gradient-to-r from-emerald-100 to-orange-100 border border-slate-200 flex items-center px-2 gap-2">
            <div className="flex-1 space-y-1">
              <Bar w="w-1/2" h="h-1.5" c="bg-slate-400" />
              <div className="h-2 w-8 rounded bg-emerald-400" />
            </div>
            <div className="w-7 h-7 rounded bg-white/80" />
          </div>
          <p className="text-[9px] text-muted">Lời chào theo giờ · Slider banner</p>
        </div>

        {blocks.map((block) => {
          const meta = HOME_BLOCK_META[block.key];
          const color = BLOCK_COLORS[block.key];
          const isActive = activeKey === block.key;

          if (!block.visible) {
            return (
              <button
                key={block.key}
                type="button"
                ref={(el) => (itemRefs.current[block.key] = el as unknown as HTMLDivElement)}
                onMouseEnter={() => onHover(block.key)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect(block.key)}
                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed text-[10px] text-muted transition-all ${
                  isActive ? `border-slate-400 bg-white ring-2 ${color.ring}` : "border-slate-300 bg-transparent"
                }`}
                data-wire={block.key}
              >
                <EyeOff className="w-3 h-3" />
                <span className="line-through">{meta.label}</span>
                <span className="ml-auto">đang ẩn</span>
              </button>
            );
          }

          const visibleNo = visibleNoByKey.get(block.key) ?? 0;
          return (
            <div
              key={block.key}
              ref={(el) => (itemRefs.current[block.key] = el)}
              role="button"
              tabIndex={0}
              onMouseEnter={() => onHover(block.key)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(block.key)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(block.key)}
              className={`relative rounded-lg border p-2 pt-4 cursor-pointer transition-all duration-200 ${color.soft} ${
                isActive ? `ring-2 ${color.ring} border-transparent shadow-md scale-[1.01]` : "border-slate-200 hover:border-slate-300"
              }`}
              data-wire={block.key}
              aria-label={`Khối ${visibleNo}: ${meta.label}`}
            >
              <span className={`absolute top-0 left-2 -translate-y-1/2 inline-flex items-center gap-1 pl-0.5 pr-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm ${color.dot}`}>
                <span className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center">{visibleNo}</span>
                {meta.label}
              </span>
              <BlockSketch blockKey={block.key} />
            </div>
          );
        })}

        <div className="h-6 rounded-md bg-slate-200/80 flex items-center justify-center text-[9px] text-muted" title="Chân trang">
          Chân trang
        </div>
      </div>
    </div>
  );
}
