"use client";

interface CdnImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  onLoad?: () => void;
  priority?: boolean;
}

/**
 * 针对已优化的 CDN 图片（webp/avif）使用原生 img
 * 避免 Next.js Image 的二次优化和超时问题
 */
export function CdnImage({
  src,
  alt,
  fill,
  className,
  onLoad,
}: CdnImageProps) {
  const handleLoad = () => {
    onLoad?.();
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      loading="lazy"
      decoding="async"
      style={fill ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        inset: 0,
        objectFit: 'cover',
      } : undefined}
    />
  );
}
