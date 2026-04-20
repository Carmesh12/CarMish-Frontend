import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm text-mesh-muted font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-2.5 bg-white/[0.03] backdrop-blur-sm border rounded-[var(--radius-mesh-sm)] text-mesh-text placeholder-mesh-muted/40 outline-none transition-all duration-250 resize-y min-h-[80px] focus:bg-white/[0.05] focus:border-mesh-gold/50 focus:shadow-[0_0_16px_rgba(212,168,83,0.12)] ${
            error ? 'border-red-500/60' : 'border-white/[0.08]'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
