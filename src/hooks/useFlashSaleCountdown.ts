import { useEffect, useState } from "react";

/** Đổi chuỗi giờ kết thúc sang mốc thời gian (ms). Trả về null nếu không đọc được. */
function resolveTargetMs(endTimeStr: string, nowMs: number): number | null {
  if (endTimeStr.includes("T")) {
    const ms = new Date(endTimeStr).getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  const parts = endTimeStr.split(":").map(Number);
  if (parts.length < 2 || parts.some(Number.isNaN)) return null;
  const target = new Date(nowMs);
  target.setHours(parts[0], parts[1], parts[2] || 0, 0);
  return target.getTime();
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Đếm ngược tới lúc kết thúc Flash Sale.
 * Nhận cả dạng giờ trong ngày ("14:00" / "14:00:00") lẫn ISO đầy đủ ("2026-11-27T14:00:00+07:00").
 */
export function useFlashSaleCountdown(endTimeStr?: string) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!endTimeStr) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endTimeStr]);

  if (!endTimeStr) return { timeLeft: "", isExpired: false };

  const targetMs = resolveTargetMs(endTimeStr, nowMs);
  if (targetMs === null) return { timeLeft: "", isExpired: false };

  const diff = targetMs - nowMs;
  if (diff <= 0) return { timeLeft: "", isExpired: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { timeLeft: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`, isExpired: false };
}
