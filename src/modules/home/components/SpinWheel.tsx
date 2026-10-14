import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, animate } from "framer-motion";
import { Sparkles, Trophy, X, Gift, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { SPIN_PRIZES, SpinPrize } from "../../../mocks/brandMock";

const TODAY_STORAGE_KEY = "csm_spin_wheel_date";
const TODAY_PRIZE_KEY = "csm_spin_wheel_prize";

const getTodayString = () => new Date().toISOString().slice(0, 10);

/**
 * Tự vẽ Confetti bằng HTML5 Canvas siêu nhẹ (không thêm thư viện bên ngoài)
 */
function CanvasConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const colors = ["#4E9F76", "#F9A03F", "#68D391", "#FBD38D", "#63B3ED", "#F43F5E", "#A855F7"];
    const particleCount = 70;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 - 50,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));

    const startTime = performance.now();
    const duration = 3500; // chạy 3.5 giây rồi dừng

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.rotationSpeed;
        if (elapsed > 2000) {
          p.opacity = Math.max(0, 1 - (elapsed - 2000) / 1500);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[300]"
      aria-hidden="true"
    />
  );
}

export function SpinWheel() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [wonPrize, setWonPrize] = useState<SpinPrize | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const rotationValue = useMotionValue(0);
  const currentRotationRef = useRef(0);

  // Kiểm tra lượt quay trong ngày từ localStorage
  useEffect(() => {
    const today = getTodayString();
    const savedDate = localStorage.getItem(TODAY_STORAGE_KEY);
    if (savedDate === today) {
      setHasSpunToday(true);
      const savedPrizeId = localStorage.getItem(TODAY_PRIZE_KEY);
      const prevWon = SPIN_PRIZES.find((p) => p.id === savedPrizeId);
      if (prevWon) setWonPrize(prevWon);
    }
  }, []);

  // Chọn trước kết quả bằng random có trọng số
  const pickWeightedPrize = (): { prize: SpinPrize; index: number } => {
    const totalWeight = SPIN_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < SPIN_PRIZES.length; i++) {
      if (rand < SPIN_PRIZES[i].weight) {
        return { prize: SPIN_PRIZES[i], index: i };
      }
      rand -= SPIN_PRIZES[i].weight;
    }
    return { prize: SPIN_PRIZES[0], index: 0 };
  };

  const handleSpin = () => {
    if (isSpinning || hasSpunToday) return;

    const { prize, index } = pickWeightedPrize();
    setWonPrize(prize);
    setIsSpinning(true);

    // Tính góc dừng:
    // 6 ô, mỗi ô 60°. Tâm của ô index i nằm ở: i * 60° + 30°
    // Để tâm ô i dừng đúng tại kim chỉ đỉnh (12 giờ), bánh xe cần xoay thêm:
    const targetAngle = (360 - (index * 60 + 30)) % 360;

    // Thêm các vòng quay đầy đủ (6 vòng = 2160°)
    const fullSpins = 6 * 360;
    const currentRot = currentRotationRef.current;
    const currentMod = ((currentRot % 360) + 360) % 360;
    const delta = (targetAngle - currentMod + 360) % 360;
    const finalRotation = currentRot + fullSpins + delta;

    currentRotationRef.current = finalRotation;

    // Giới hạn quay mỗi ngày: ghi nhận vào localStorage
    const today = getTodayString();
    localStorage.setItem(TODAY_STORAGE_KEY, today);
    localStorage.setItem(TODAY_PRIZE_KEY, prize.id);
    setHasSpunToday(true);

    if (shouldReduceMotion) {
      // Reduced motion: bỏ quay dài, hiện kết quả ngay lập tức
      rotationValue.set(finalRotation);
      setIsSpinning(false);
      setIsModalOpen(true);
      return;
    }

    // Hiệu ứng tăng tốc rồi giảm tốc có chủ đích bằng animate (4.5 giây)
    animate(rotationValue, finalRotation, {
      duration: 4.5,
      ease: [0.15, 0.85, 0.2, 1],
      onComplete: () => {
        setIsSpinning(false);
        setIsModalOpen(true);
      },
    });
  };

  // Tính toán tọa độ 6 cánh bánh xe SVG (Center: 160, 160, Radius: 145)
  const sectors = useMemo(() => {
    const cx = 160;
    const cy = 160;
    const r = 145;
    const sliceAngle = 60; // 360 / 6

    return SPIN_PRIZES.map((prize, i) => {
      const startDeg = -90 + i * sliceAngle;
      const endDeg = -90 + (i + 1) * sliceAngle;
      const midDeg = -90 + i * sliceAngle + sliceAngle / 2;

      const rad1 = (startDeg * Math.PI) / 180;
      const rad2 = (endDeg * Math.PI) / 180;
      const radMid = (midDeg * Math.PI) / 180;

      const x1 = cx + r * Math.cos(rad1);
      const y1 = cy + r * Math.sin(rad1);
      const x2 = cx + r * Math.cos(rad2);
      const y2 = cy + r * Math.sin(rad2);

      // Điểm đặt chữ và icon
      const textRadius = 92;
      const tx = cx + textRadius * Math.cos(radMid);
      const ty = cy + textRadius * Math.sin(radMid);

      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

      return {
        prize,
        pathData,
        tx,
        ty,
        midDeg: midDeg + 90, // Góc xoay chữ để hướng vào tâm
      };
    });
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-primary-tint/30 via-surface to-background border-b border-border/70 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="max-w-4xl mx-auto bg-surface rounded-3xl border border-border/90 shadow-card p-6 sm:p-10 flex flex-col lg:flex-row items-center gap-10">
          {/* Wheel Graphic Container */}
          <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] shrink-0 flex items-center justify-center">
            {/* Outer Decorative Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 shadow-2xl bg-surface-soft/40" />

            {/* Glowing Backdrop */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-primary-tint/60 to-pastel-peach/40 blur-sm pointer-events-none" />

            {/* Pointer / Needle at 12 o'clock */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
              <div className="w-6 h-7 bg-danger shadow-md clip-polygon [clip-path:polygon(50%_100%,0%_0%,100%_0%)]" />
              <div className="w-3 h-3 rounded-full bg-white shadow-xs -mt-6 border-2 border-danger" />
            </div>

            {/* Animated SVG Wheel */}
            <motion.div
              style={{ rotate: rotationValue }}
              className="w-full h-full relative z-10"
            >
              <svg
                viewBox="0 0 320 320"
                className="w-full h-full drop-shadow-md select-none"
              >
                {/* 6 Sectors */}
                {sectors.map((sec, idx) => (
                  <g key={sec.prize.id}>
                    <path
                      d={sec.pathData}
                      fill={sec.prize.color}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    {/* Prize Text & Icon */}
                    <g
                      transform={`translate(${sec.tx}, ${sec.ty}) rotate(${sec.midDeg})`}
                    >
                      <text
                        x="0"
                        y="-6"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-base font-bold select-none"
                      >
                        {sec.prize.icon}
                      </text>
                      <text
                        x="0"
                        y="12"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={sec.prize.textColor}
                        className="text-[10px] font-black tracking-tight select-none uppercase font-mono"
                      >
                        {sec.prize.label}
                      </text>
                    </g>
                  </g>
                ))}

                {/* Central Cap */}
                <circle cx="160" cy="160" r="28" fill="#ffffff" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="160" cy="160" r="22" fill="#4E9F76" />
                <text
                  x="160"
                  y="163"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  className="text-[9px] font-black uppercase tracking-widest"
                >
                  CSM
                </text>
              </svg>
            </motion.div>
          </div>

          {/* Right Info & Action */}
          <div className="flex-1 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent-dark border border-accent/25 shadow-2xs text-xs font-bold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5" />
              <span>Minigame Mỗi Ngày</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Vòng Quay May Mắn CSM
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Quay thưởng mỗi ngày để nhận các mã ưu đãi độc quyền như Voucher 10K, Free Topping, Freeship đơn hàng hoặc Giảm 15% đồ uống!
              </p>
            </div>

            {/* Status note */}
            <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/80 text-xs text-muted flex items-center justify-center lg:justify-start gap-2">
              <AlertCircle className="w-4 h-4 text-primary shrink-0" />
              <span>
                {hasSpunToday
                  ? "Bạn đã dùng hết lượt quay hôm nay. Hãy quay lại vào ngày mai nhé!"
                  : "Mỗi khách hàng có 1 lượt quay miễn phí mỗi ngày (lưu tại trình duyệt)."}
              </span>
            </div>

            {/* Spin CTA Button */}
            <div className="pt-2">
              <Button
                size="lg"
                disabled={isSpinning || hasSpunToday}
                onClick={handleSpin}
                className="w-full sm:w-auto rounded-2xl h-12 px-8 text-sm sm:text-base font-extrabold shadow-md gap-2 cursor-pointer"
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Đang quay bánh xe...</span>
                  </>
                ) : hasSpunToday ? (
                  <span>Đã quay hôm nay (Hẹn gặp lại ngày mai)</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Quay thưởng ngay (Miễn phí)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Modal & Self-contained Canvas Confetti */}
      <AnimatePresence>
        {isModalOpen && wonPrize && (
          <>
            {/* Self-contained Canvas Confetti (Không cần thư viện ngoài) */}
            <CanvasConfetti />

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[250]"
              aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div className="fixed inset-0 z-[251] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full max-w-md bg-surface rounded-3xl border border-border shadow-2xl p-6 sm:p-8 text-center space-y-5 relative"
                role="dialog"
                aria-modal="true"
                aria-labelledby="spin-reward-title"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-soft text-muted hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Đóng cửa sổ"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Reward Icon */}
                <div className="w-20 h-20 rounded-3xl bg-primary-tint/80 border border-primary/30 flex items-center justify-center text-4xl mx-auto shadow-inner">
                  {wonPrize.icon}
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-primary-dark uppercase tracking-wider block">
                    Kết quả vòng quay
                  </span>
                  <h3
                    id="spin-reward-title"
                    className="text-xl sm:text-2xl font-black text-foreground"
                  >
                    {wonPrize.isWinning
                      ? `🎉 Chúc mừng! Bạn nhận được ${wonPrize.label}`
                      : "🍀 Chúc bạn may mắn lần sau!"}
                  </h3>
                  <p className="text-xs text-muted max-w-xs mx-auto">
                    {wonPrize.subLabel}
                  </p>
                </div>

                {wonPrize.code && (
                  <div className="p-3 rounded-2xl bg-surface-soft border border-dashed border-primary/40 font-mono text-sm font-extrabold text-primary-dark select-all">
                    Mã quà tặng: <span className="underline">{wonPrize.code}</span>
                  </div>
                )}

                {/* Dòng chữ bắt buộc: Phần thưởng minh hoạ */}
                <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Phần thưởng minh hoạ:</strong> Đây là minigame trải nghiệm giao diện khách hàng. Phần thưởng mang tính chất mô phỏng, KHÔNG tự động gắn vào giá tiền hay payload đơn hàng.
                  </span>
                </div>

                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full rounded-2xl h-11 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Tuyệt vời, cảm ơn!
                </Button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
