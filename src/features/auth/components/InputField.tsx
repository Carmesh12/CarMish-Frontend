import React, { type InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, id, className, ...props }) => {
  return (
    <div className="flex flex-col mb-4">
      <label
        htmlFor={id}
        className="mb-2 text-xs font-medium uppercase tracking-wider text-mesh-muted"
      >
        {label}
      </label>
      <input
        id={id}
        className={[
          'w-full px-4 py-3 rounded-[var(--radius-mesh-sm)] border border-mesh-border bg-mesh-surface',
          'text-mesh-text placeholder:text-mesh-muted/60',
          'transition-[border-color,box-shadow] duration-200',
          'focus:outline-none focus:border-mesh-gold/70 focus:ring-1 focus:ring-mesh-gold/35',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
    </div>
  );
};
