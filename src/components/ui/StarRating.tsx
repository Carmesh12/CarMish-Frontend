import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

export function StarRating({ value, onChange, readonly = false, size = 20 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-all duration-200 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'}`}
        >
          <Star
            size={size}
            className={
              star <= value
                ? 'fill-mesh-gold text-mesh-gold drop-shadow-[0_0_6px_rgba(212,168,83,0.4)]'
                : 'fill-none text-white/[0.12]'
            }
          />
        </button>
      ))}
    </div>
  );
}
