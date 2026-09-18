import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary-tint text-primary-dark",
        primary:
          "border-primary/25 bg-primary-tint text-primary-dark",
        secondary:
          "border-accent/25 bg-accent-tint text-accent-dark",
        destructive:
          "border-danger/25 bg-danger-pastel text-danger-dark",
        success:
          "border-success/25 bg-success-pastel text-success-dark",
        warning:
          "border-warning/25 bg-warning-pastel text-warning-dark",
        info:
          "border-info/25 bg-info-pastel text-info-dark",
        outline:
          "border-border bg-surface text-foreground",
        solid:
          "border-transparent bg-primary text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
