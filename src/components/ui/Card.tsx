import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: boolean;
  glow?: boolean;
}

export function Card({ children, padding = true, glow = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-[var(--radius-mesh)] shadow-[var(--shadow-mesh-card)] transition-all duration-300 card-shine ${
        padding ? 'p-6' : ''
      } ${
        glow ? 'shadow-[var(--shadow-mesh-glow-gold)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
