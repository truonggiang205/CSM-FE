import { cn } from "../../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-surface-soft border border-border/50", className)}
      role="status"
      aria-label="Đang tải dữ liệu"
      {...props}
    />
  );
}

export { Skeleton };
