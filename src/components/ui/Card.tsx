import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { y: -6 } : undefined}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'rounded-2xl bg-white border border-neutral-100 p-4 shadow-sm relative overflow-hidden',
          hoverable && 'hover:shadow-xl hover:border-brand-primary/20 cursor-pointer transition-all duration-300',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
