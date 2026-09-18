import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { ArrowRight, Sparkles, Clock, ShieldCheck, Truck } from "lucide-react";
import { HeroOrbitBanner } from "../components/HeroOrbitBanner";

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-tint/50 via-pastel-peach/25 to-background py-16 lg:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center space-y-6 text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-primary/25 shadow-sm w-fit">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-primary-dark">
                  Cửa hàng tiện lợi thế hệ mới 24/7
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-display font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl/tight">
                  Mua nhanh. <br />
                  <span className="text-primary underline decoration-pastel-peach decoration-wavy decoration-2">
                    Nhận tiện.
                  </span> <br />
                  Sống tiện hơn mỗi ngày.
                </h1>
                <p className="max-w-[560px] text-muted text-base sm:text-lg leading-relaxed">
                  Chuỗi cửa hàng tiện lợi <span className="font-semibold text-foreground">CSM</span> mang phong cách tươi mới, tinh tế, luôn sẵn sàng phục vụ đồ ăn nhanh, thức uống tươi ngon và nhu yếu phẩm chất lượng cao.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button size="lg" asChild className="w-full sm:w-auto shadow-sm">
                  <Link to="/products" className="flex items-center gap-2">
                    Khám phá sản phẩm
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link to="/products">
                    Danh mục ưu đãi
                  </Link>
                </Button>
              </div>

              {/* Service Highlights */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/80 text-xs font-medium text-muted">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Mở cửa 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-accent" />
                  <span>Giao siêu tốc</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>100% An toàn</span>
                </div>
              </div>
            </motion.div>

            {/* Dynamic Orbiting Combo Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full flex justify-center"
            >
              <HeroOrbitBanner />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Categories/Products */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center space-y-2">
            <h2 className="text-h1 font-bold text-foreground">Danh Mục Nổi Bật</h2>
            <p className="text-muted text-sm max-w-md mx-auto">
              Lựa chọn các nhóm mặt hàng thiết yếu hàng ngày với tiêu chuẩn chất lượng cao nhất.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { title: "Đồ Uống Mát Lạnh", emoji: "🧃", count: "48+ sản phẩm", color: "bg-pastel-sky/60", border: "border-info/20" },
              { title: "Thức Ăn Nhanh", emoji: "🍙", count: "32+ sản phẩm", color: "bg-pastel-peach/60", border: "border-accent/20" },
              { title: "Bánh Kẹo & Snack", emoji: "🍪", count: "65+ sản phẩm", color: "bg-pastel-butter/60", border: "border-warning/20" },
              { title: "Đồ Dùng Tiện Lợi", emoji: "🧴", count: "54+ sản phẩm", color: "bg-pastel-lavender/60", border: "border-primary/20" },
            ].map((cat, i) => (
              <Link
                key={i}
                to="/products"
                className={`p-6 rounded-2xl ${cat.color} border ${cat.border} flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-card`}
              >
                <div className="text-3xl mb-3">{cat.emoji}</div>
                <h3 className="font-semibold text-foreground text-sm">{cat.title}</h3>
                <span className="text-xs text-muted mt-1">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
