import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-primary text-white',
      accent: 'bg-brand-accent text-white',
      success: 'bg-success text-white',
      warning: 'bg-warning text-white',
      danger: 'bg-danger text-white',
      neutral: 'bg-neutral-100 text-neutral-600 border border-neutral-300',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
