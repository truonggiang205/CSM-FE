import { motion } from "framer-motion";
import { Button } from "../../../components/ui/Button";

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary/5 py-20 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-display font-bold tracking-tighter text-foreground sm:text-5xl xl:text-6xl/none">
                  Mua nhanh. <br />
                  <span className="text-primary">Nhận tiện.</span> <br />
                  Sống tiện hơn.
                </h1>
                <p className="max-w-[600px] text-muted md:text-xl">
                  Chuỗi cửa hàng tiện lợi CSM mang đến trải nghiệm mua sắm hiện đại, nhanh chóng và luôn sẵn sàng phục vụ bạn 24/7.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <Button size="lg" className="w-full sm:w-auto">
                  Khám phá ngay
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Tìm cửa hàng gần bạn
                </Button>
              </div>
            </motion.div>

            {/* Decorative Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mx-auto aspect-square w-full max-w-[500px] bg-primary/10 rounded-full relative"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted">
                  {/* TODO: Add 3D visual or product image later */}
                  <span className="text-lg">[3D Product Visual Placeholder]</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Categories/Products Placeholder */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-h1 font-bold text-foreground">Sản phẩm nổi bật</h2>
            <p className="mt-4 text-muted">Những mặt hàng được yêu thích nhất trong tuần</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
             {/* Product Cards will go here */}
             {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                   <div className="aspect-square bg-neutral-100 rounded-md mb-4 flex items-center justify-center text-muted">
                     Image {i}
                   </div>
                   <h3 className="font-medium text-foreground">Sản phẩm {i}</h3>
                   <p className="text-primary font-semibold mt-2">15,000đ</p>
                </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
}
