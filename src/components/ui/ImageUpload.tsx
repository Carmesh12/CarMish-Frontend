import { useRef, type ChangeEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageUploadProps {
  images: File[];
  onChange: (files: File[]) => void;
  max?: number;
  existingUrls?: string[];
  onRemoveExisting?: (index: number) => void;
}

export function ImageUpload({
  images,
  onChange,
  max = 10,
  existingUrls = [],
  onRemoveExisting,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = max - images.length - existingUrls.length;
    onChange([...images, ...files.slice(0, remaining)]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeNew = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const totalCount = existingUrls.length + images.length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {existingUrls.map((url, i) => (
          <div key={`existing-${i}`} className="relative aspect-[4/3] rounded-[var(--radius-mesh-sm)] overflow-hidden border border-white/[0.08] group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            {onRemoveExisting && (
              <button
                type="button"
                onClick={() => onRemoveExisting(i)}
                className="absolute top-1.5 end-1.5 p-1 bg-black/60 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {images.map((file, i) => (
          <div key={`new-${i}`} className="relative aspect-[4/3] rounded-[var(--radius-mesh-sm)] overflow-hidden border border-mesh-gold/30 group shadow-[0_0_12px_rgba(212,168,83,0.1)]">
            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeNew(i)}
              className="absolute top-1.5 end-1.5 p-1 bg-black/60 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {totalCount < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-[4/3] rounded-[var(--radius-mesh-sm)] border-2 border-dashed border-white/[0.1] hover:border-mesh-gold/50 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-mesh-muted hover:text-mesh-gold transition-all duration-250 cursor-pointer"
          >
            <Upload size={24} />
            <span className="text-xs">{t('vendor.uploadImages')}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-xs text-mesh-muted">
        {totalCount}/{max}
      </p>
    </div>
  );
}
