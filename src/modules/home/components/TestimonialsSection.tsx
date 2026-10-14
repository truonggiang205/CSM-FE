import { Star, MessageSquareQuote } from "lucide-react";
import { mockTestimonials } from "../../../mocks/homeMock";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

export function TestimonialsSection() {
  return (
    <section className="py-14 sm:py-18 bg-background border-b border-border/80">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-dark uppercase tracking-wider bg-accent-tint px-3 py-1 rounded-full border border-accent/20 shadow-xs">
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>Trải nghiệm khách hàng</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Khách Hàng Nói Gì Về CSM Store?
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Hơn 10.000+ khách hàng tại TP.HCM đã trải nghiệm và hài lòng với chất lượng dịch vụ của chuỗi cửa hàng tiện lợi CSM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockTestimonials.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-surface border border-border/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              {/* Stars & Quote */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted">{item.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">
                  &ldquo;{item.comment}&rdquo;
                </p>
              </div>

              {/* User profile & Item */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_AVATAR;
                    }}
                    className="w-10 h-10 rounded-full object-cover border border-primary/20 shadow-xs"
                    loading="lazy"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{item.name}</h4>
                    <p className="text-[10px] text-muted">{item.role}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-primary-dark bg-primary-tint/60 px-2 py-0.5 rounded-full border border-primary/15 max-w-[110px] truncate">
                  {item.purchasedItem}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
