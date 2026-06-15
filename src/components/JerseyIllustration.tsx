import { JerseyColor } from '../data/jerseys';

interface JerseyIllustrationProps {
  color: JerseyColor;
  size?: number;
  className?: string;
  glowIntensity?: 'low' | 'medium' | 'high';
}

export default function JerseyIllustration({
  color,
  size = 300,
  className = '',
  glowIntensity = 'medium',
}: JerseyIllustrationProps) {
  const glowSize = glowIntensity === 'high' ? 60 : glowIntensity === 'medium' ? 40 : 20;
  const glowOpacity = glowIntensity === 'high' ? 0.7 : glowIntensity === 'medium' ? 0.5 : 0.3;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size * 1.15 }}
    >
      {/* Radial glow behind jersey */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.9,
          height: size * 0.9,
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse at center, ${color.accent}33 0%, transparent 70%)`,
          filter: `blur(${glowSize}px)`,
          opacity: glowOpacity,
        }}
      />

      {/* Jersey SVG */}
      <svg
        viewBox="0 0 280 320"
        width={size}
        height={size * 1.15}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))' }}
      >
        <defs>
          <linearGradient id={`body-grad-${color.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={color.secondary} />
            <stop offset="50%"  stopColor={color.primary} />
            <stop offset="100%" stopColor={color.secondary} />
          </linearGradient>
          <linearGradient id={`sleeve-l-${color.id}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"  stopColor={color.secondary} />
            <stop offset="100%" stopColor={color.primary} />
          </linearGradient>
          <linearGradient id={`sleeve-r-${color.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"  stopColor={color.secondary} />
            <stop offset="100%" stopColor={color.primary} />
          </linearGradient>
          <linearGradient id={`accent-strip-${color.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={color.accent} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color.accent} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`shine-${color.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.12" />
            <stop offset="50%"  stopColor="white" stopOpacity="0.04" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id={`jersey-shadow-${color.id}`}>
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="black" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* LEFT SLEEVE */}
        <path
          d="M 98,30 L 42,62 L 8,80 L 4,110 L 18,118 L 62,104 L 76,110 L 80,68 Z"
          fill={`url(#sleeve-l-${color.id})`}
          stroke={color.accent}
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />
        {/* left sleeve accent strip */}
        <path
          d="M 42,62 L 28,90 L 32,92 L 46,64 Z"
          fill={`url(#accent-strip-${color.id})`}
          opacity="0.6"
        />
        {/* left sleeve cuff */}
        <path
          d="M 4,110 L 8,80 L 18,88 L 18,118 Z"
          fill={color.accent}
          opacity="0.25"
        />
        <path
          d="M 4,110 L 18,118 L 62,104 L 58,96 L 16,108 Z"
          fill={color.accent}
          opacity="0.35"
        />

        {/* RIGHT SLEEVE */}
        <path
          d="M 182,30 L 238,62 L 272,80 L 276,110 L 262,118 L 218,104 L 204,110 L 200,68 Z"
          fill={`url(#sleeve-r-${color.id})`}
          stroke={color.accent}
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />
        {/* right sleeve accent strip */}
        <path
          d="M 238,62 L 252,90 L 248,92 L 234,64 Z"
          fill={`url(#accent-strip-${color.id})`}
          opacity="0.6"
        />
        {/* right sleeve cuff */}
        <path
          d="M 276,110 L 272,80 L 262,88 L 262,118 Z"
          fill={color.accent}
          opacity="0.25"
        />
        <path
          d="M 276,110 L 262,118 L 218,104 L 222,96 L 264,108 Z"
          fill={color.accent}
          opacity="0.35"
        />

        {/* MAIN BODY */}
        <path
          d="M 80,68 L 76,110 L 68,310 Q 140,322 212,310 L 204,110 L 200,68 L 182,30
             Q 165,18 158,14 L 140,22 L 122,14 Q 115,18 98,30 Z"
          fill={`url(#body-grad-${color.id})`}
          filter={`url(#jersey-shadow-${color.id})`}
          stroke={color.accent}
          strokeWidth="0.6"
          strokeOpacity="0.3"
        />
        {/* Body shine overlay */}
        <path
          d="M 80,68 L 76,110 L 68,310 Q 140,322 212,310 L 204,110 L 200,68 L 182,30
             Q 165,18 158,14 L 140,22 L 122,14 Q 115,18 98,30 Z"
          fill={`url(#shine-${color.id})`}
        />

        {/* COLLAR */}
        <path
          d="M 122,14 Q 115,18 108,26 Q 118,42 140,48 Q 162,42 172,26 Q 165,18 158,14 L 140,22 Z"
          fill={color.secondary}
          stroke={color.accent}
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        {/* collar inner highlight */}
        <path
          d="M 130,20 Q 140,24 150,20 Q 154,26 140,34 Q 126,26 130,20 Z"
          fill={color.primary}
          opacity="0.8"
        />

        {/* CENTER VERTICAL STRIPE (chest) */}
        <rect
          x="136"
          y="50"
          width="8"
          height="110"
          rx="4"
          fill={color.accent}
          opacity="0.18"
        />

        {/* LEFT CHEST STRIPE */}
        <path
          d="M 100,70 L 108,70 L 112,180 L 104,180 Z"
          fill={color.accent}
          opacity="0.12"
        />

        {/* RIGHT CHEST STRIPE */}
        <path
          d="M 180,70 L 172,70 L 168,180 L 176,180 Z"
          fill={color.accent}
          opacity="0.12"
        />

        {/* HORIZONTAL CHEST BAND */}
        <path
          d="M 76,130 Q 140,124 204,130 L 204,148 Q 140,142 76,148 Z"
          fill={color.accent}
          opacity="0.14"
        />

        {/* NUMBER PLACEHOLDER (just a subtle rectangle shape) */}
        <rect
          x="116"
          y="160"
          width="48"
          height="56"
          rx="4"
          fill={color.accent}
          opacity="0.06"
        />

        {/* JERSERIO TEXT on jersey */}
        <text
          x="140"
          y="200"
          textAnchor="middle"
          fontSize="10"
          fontFamily="'Barlow Condensed', sans-serif"
          fontWeight="700"
          letterSpacing="2"
          fill={color.accent}
          opacity="0.4"
        >
          JERSERIO
        </text>

        {/* BOTTOM HEM STRIPE */}
        <path
          d="M 68,295 Q 140,307 212,295 L 212,310 Q 140,322 68,310 Z"
          fill={color.accent}
          opacity="0.2"
        />

        {/* ARMHOLE SEAM LINES */}
        <path
          d="M 76,110 Q 72,112 68,120"
          stroke={color.accent}
          strokeWidth="1"
          strokeOpacity="0.3"
          fill="none"
        />
        <path
          d="M 204,110 Q 208,112 212,120"
          stroke={color.accent}
          strokeWidth="1"
          strokeOpacity="0.3"
          fill="none"
        />

        {/* SUBTLE REFLECTION on body */}
        <path
          d="M 90,70 L 100,70 L 105,200 L 95,200 Z"
          fill="white"
          opacity="0.04"
        />
      </svg>
    </div>
  );
}
