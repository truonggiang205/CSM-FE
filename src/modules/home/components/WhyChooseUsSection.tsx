import { Truck, ShieldCheck, Store, Clock, Sparkles } from "lucide-react";
import { mockWhyChooseUs } from "../../../mocks/homeMock";

export function WhyChooseUsSection() {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Truck":
        return <Truck className="w-6 h-6 text-primary" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-6 h-6 text-accent-dark" />;
      case "Store":
        return <Store className="w-6 h-6 text-primary" />;
      case "Clock":
        return <Clock className="w-6 h-6 text-info-dark" />;
      default:
        return <Sparkles className="w-6 h-6 text-primary" />;
    }
  };

  const getBgStyle = (idx: number) => {
    switch (idx % 4) {
      case 0:
        return "bg-primary-tint/70 border-primary/20";
      case 1:
        return "bg-accent-tint/70 border-accent/20";
      case 2:
        return "bg-pastel-mint/70 border-primary/20";
      case 3:
        return "bg-pastel-sky/70 border-info/20";
      default:
        return "bg-surface-soft border-border";
    }
  };

  return (
    <section className="py-14 sm:py-18 bg-surface-soft/60 border-b border-border/80">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark uppercase tracking-wider bg-surface px-3 py-1 rounded-full border border-primary/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Tiêu chuẩn tiện lợi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Vì Sao Bạn Nên Chọn CSM Store?
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Không chỉ là cửa hàng mua sắm, CSM mang đến phong cách sống tiện nghi, nhanh gọn và tràn đầy năng lượng mỗi ngày.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {mockWhyChooseUs.map((item, idx) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-surface border border-border/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs mb-4 transition-transform duration-200 group-hover:scale-105 ${getBgStyle(idx)}`}>
                  {getIcon(item.iconName)}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-soft text-muted border border-border/60">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-base tracking-tight mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
