import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-mesh-gold to-mesh-gold-hover text-mesh-bg font-semibold shadow-[0_0_20px_rgba(212,168,83,0.15)] hover:shadow-[0_0_28px_rgba(212,168,83,0.3)] hover:brightness-110',
  secondary:
    'bg-white/[0.05] backdrop-blur-md text-mesh-text border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]',
  outline:
    'bg-transparent backdrop-blur-sm text-mesh-text border border-white/[0.1] hover:border-mesh-gold/50 hover:text-mesh-gold hover:shadow-[0_0_16px_rgba(212,168,83,0.1)]',
  ghost:
    'bg-transparent text-mesh-muted hover:text-mesh-text hover:bg-white/[0.05]',
  danger:
    'bg-red-500/[0.1] backdrop-blur-md text-red-400 border border-red-500/20 hover:bg-red-500/[0.18] hover:border-red-500/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-[var(--radius-mesh-sm)] transition-all duration-250 ease-out disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97] ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
