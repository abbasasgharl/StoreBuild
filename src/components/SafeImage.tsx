import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] text-[#6B7280] p-6 text-center ${className}`}
      >
        <Package className="w-8 h-8 stroke-[1.5] text-[#6B7280] mb-2" />
        <span className="text-xs font-medium text-[#111827] line-clamp-2">
          {fallbackLabel || alt || 'Product Preview'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Storefront Visual'}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      {...props}
    />
  );
}
