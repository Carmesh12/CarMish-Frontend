type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/[0.06] text-mesh-muted border-white/[0.08] backdrop-blur-sm',
  success: 'bg-emerald-500/[0.1] text-emerald-400 border-emerald-500/20 backdrop-blur-sm',
  warning: 'bg-amber-500/[0.1] text-amber-400 border-amber-500/20 backdrop-blur-sm',
  danger: 'bg-red-500/[0.1] text-red-400 border-red-500/20 backdrop-blur-sm',
  info: 'bg-sky-500/[0.1] text-sky-400 border-sky-500/20 backdrop-blur-sm',
  gold: 'bg-mesh-gold/[0.1] text-mesh-gold border-mesh-gold/20 backdrop-blur-sm shadow-[0_0_10px_rgba(212,168,83,0.1)]',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
