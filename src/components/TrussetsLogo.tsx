import React, { useState, useEffect } from 'react';
import { brandService, BrandSettings } from '../services/brandService';

interface TrussetsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'header' | 'responsive';
  variant?: 'color' | 'white' | 'dark';
  alt?: string;
}

export const TrussetsLogo: React.FC<TrussetsLogoProps> = ({
  className = '',
  size = 'header',
  variant = 'color',
  alt = 'TRUSSETS - Zero Brokerage Real Estate Network',
}) => {
  const [imgError, setImgError] = useState(false);
  const [brand, setBrand] = useState<BrandSettings>(() => brandService.getSettings());

  useEffect(() => {
    brandService.syncWithServer().then((latest) => {
      if (latest) {
        setBrand(latest);
        setImgError(false);
      }
    });

    const unsubscribe = brandService.subscribe((updated) => {
      setBrand(updated);
      setImgError(false); // reset on update
    });
    return unsubscribe;
  }, []);

  // Dynamic dimension mappings based on screen dimensions and responsive breakpoints
  const dimensionMap: Record<string, string> = {
    sm: 'h-6 sm:h-7 md:h-8 max-w-[110px] sm:max-w-[140px]',
    md: 'h-7.5 min-[380px]:h-8 sm:h-9 md:h-10 lg:h-11.5 xl:h-12 max-w-[130px] min-[380px]:max-w-[150px] sm:max-w-[185px] md:max-w-[215px] lg:max-w-[245px] xl:max-w-[265px]',
    header: 'h-7 min-[360px]:h-7.5 min-[420px]:h-8.5 sm:h-9.5 md:h-10.5 lg:h-11.5 xl:h-12 max-w-[120px] min-[360px]:max-w-[140px] min-[420px]:max-w-[165px] sm:max-w-[190px] md:max-w-[220px] lg:max-w-[245px] xl:max-w-[270px]',
    responsive: 'h-7 min-[360px]:h-7.5 min-[420px]:h-8.5 sm:h-9.5 md:h-10.5 lg:h-11.5 xl:h-12 max-w-[120px] min-[360px]:max-w-[140px] min-[420px]:max-w-[165px] sm:max-w-[190px] md:max-w-[220px] lg:max-w-[245px] xl:max-w-[270px]',
    lg: 'h-10 sm:h-12 md:h-14 max-w-[200px] sm:max-w-[260px]',
    xl: 'h-13 sm:h-16 md:h-20 max-w-[260px] sm:max-w-[340px]',
  };

  const isWhite = variant === 'white';
  
  const defaultLogo = isWhite ? '/trussets-logo-white.svg' : '/trussets-logo.svg';

  // Custom logo from platform database settings, or guaranteed default assets
  const hasCustomWhite = !!(brand.logoWhiteUrl && brand.logoWhiteUrl.trim() !== '' && brand.logoWhiteUrl !== '/trussets-logo-white.svg');
  const hasCustomColor = !!(brand.logoUrl && brand.logoUrl.trim() !== '' && brand.logoUrl !== '/trussets-logo.svg');

  const logoSrc = isWhite
    ? hasCustomWhite
      ? brand.logoWhiteUrl!
      : hasCustomColor
      ? brand.logoUrl!
      : defaultLogo
    : hasCustomColor
    ? brand.logoUrl!
    : defaultLogo;

  const logoClasses = `${dimensionMap[size] || dimensionMap.header} w-auto object-contain object-left block shrink-0 transition-all duration-200`;

  return (
    <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
      {!imgError ? (
        <img
          src={logoSrc}
          alt={alt}
          className={logoClasses}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          viewBox="0 0 740 144"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={logoClasses}
          aria-label={alt}
        >
          <defs>
            <linearGradient id="fallbackGoldGrad" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#E2B448" />
              <stop offset="30%" stopColor="#D49E2D" />
              <stop offset="70%" stopColor="#BE851C" />
              <stop offset="100%" stopColor="#9C650F" />
            </linearGradient>
            <linearGradient id="fallbackGoldWing" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#FCE18D" />
              <stop offset="45%" stopColor="#E4B44B" />
              <stop offset="100%" stopColor="#B27B17" />
            </linearGradient>
            <linearGradient id="fallbackMaroonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7B0E1E" />
              <stop offset="50%" stopColor="#6F0D1C" />
              <stop offset="100%" stopColor="#550713" />
            </linearGradient>
          </defs>

          {/* EMBLEM MARK: Dual Interlocking Swooshes */}
          <g transform="translate(14, 12)">
            <path
              d="M 12 40 C 26 22, 54 8, 92 8 C 108 8, 120 15, 125 27 C 127 34, 124 46, 114 59 C 101 74, 82 88, 58 96 C 69 82, 82 66, 80 50 C 78 33, 60 26, 44 33 C 32 38, 22 45, 12 40 Z"
              fill={isWhite ? '#FFFFFF' : 'url(#fallbackMaroonGrad)'}
            />
            <path
              d="M 46 48 C 36 60, 31 75, 36 88 C 43 103, 63 111, 88 111 C 103 111, 116 104, 124 94 C 109 97, 91 94, 76 84 C 63 74, 53 62, 53 50 C 53 43, 56 35, 61 28 C 53 35, 46 42, 46 48 Z"
              fill={isWhite ? '#E2E8F0' : 'url(#fallbackGoldWing)'}
            />
          </g>

          {/* TYPOGRAPHY: TRUS in Gold, SETS in Maroon */}
          <g transform="translate(156, 96)">
            <text
              x="0"
              y="0"
              fontFamily="'Plus Jakarta Sans', 'Outfit', 'Montserrat', sans-serif"
              fontSize="84"
              fontWeight="900"
              letterSpacing="0.5"
              fill={isWhite ? '#FFFFFF' : 'url(#fallbackGoldGrad)'}
            >
              TRUS<tspan fill={isWhite ? '#FFFFFF' : '#77101F'}>SETS</tspan>
            </text>
          </g>

          {/* REGISTERED TRADEMARK SYMBOL ® */}
          <g transform="translate(696, 32)">
            <circle
              cx="12"
              cy="12"
              r="11"
              stroke={isWhite ? '#FFFFFF' : '#77101F'}
              strokeWidth="2.2"
              fill="none"
            />
            <text
              x="12"
              y="17"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontSize="14"
              fontWeight="800"
              textAnchor="middle"
              fill={isWhite ? '#FFFFFF' : '#77101F'}
            >
              R
            </text>
          </g>
        </svg>
      )}
    </div>
  );
};
