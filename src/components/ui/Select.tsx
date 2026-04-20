import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm text-mesh-muted font-medium">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-4 py-2.5 bg-white/[0.03] backdrop-blur-sm border rounded-[var(--radius-mesh-sm)] text-mesh-text outline-none transition-all duration-250 focus:bg-white/[0.05] focus:border-mesh-gold/50 focus:shadow-[0_0_16px_rgba(212,168,83,0.12)] ${
            error ? 'border-red-500/60' : 'border-white/[0.08]'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-mesh-muted bg-mesh-card">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-mesh-card">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
