interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 36, className = '', label }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="animate-spin"
          viewBox="0 0 50 50"
          width={size}
          height={size}
          fill="none"
        >
          <defs>
            <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4a853" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="url(#spinner-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 50"
          />
        </svg>
      </div>
      {label && <p className="text-sm text-mesh-muted">{label}</p>}
    </div>
  );
}
