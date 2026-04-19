import { useState } from 'react';
import circlesLogo from '@/assets/circles-logo.svg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const [src, setSrc] = useState(circlesLogo);
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  };
  const isSvgSource = src === circlesLogo;

  return (
    <img
      src={src}
      alt="לוגו"
      className={`${sizeClasses[size]} w-auto ${isSvgSource ? 'dark:invert dark:brightness-110' : ''} ${className}`}
      onError={() => {
        if (src !== '/circles-logo-120.png') {
          setSrc('/circles-logo-120.png');
        }
      }}
    />
  );
}
