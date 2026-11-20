import {useState} from 'react';
import {ImageOff} from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
  containerClassName?: string;
}

export function ResilientImage({
  src,
  alt,
  fallbackTitle,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative overflow-hidden bg-[#11161E]',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`${containerClassName} flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#064E3B]/40 p-6 text-center`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="w-7 h-7 text-emerald-400/80" aria-hidden="true" />
        <span className="font-display text-sm font-medium text-slate-200">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={className}
      />
    </div>
  );
}
