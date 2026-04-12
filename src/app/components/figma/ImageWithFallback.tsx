import React, { useState } from 'react';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

export type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** 1차 src 로드 실패 시 대체 URL(예: 가상 강아지 풀) */
  fallbackSrc?: string;
};

export function ImageWithFallback({
  fallbackSrc,
  src,
  alt,
  style,
  className,
  onError,
  ...rest
}: ImageWithFallbackProps) {
  const [phase, setPhase] = useState<'primary' | 'fallback' | 'broken'>('primary');

  if (phase === 'broken') {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex h-full w-full items-center justify-center">
          <img
            src={ERROR_IMG_SRC}
            alt={alt ?? '이미지를 불러오지 못함'}
            {...rest}
            data-original-url={src}
            className="max-h-full max-w-full object-contain opacity-40"
          />
        </div>
      </div>
    );
  }

  const activeSrc = phase === 'primary' ? src : fallbackSrc;

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={(e) => {
        onError?.(e);
        setPhase((p) => {
          if (p === 'primary') return fallbackSrc ? 'fallback' : 'broken';
          return 'broken';
        });
      }}
    />
  );
}
