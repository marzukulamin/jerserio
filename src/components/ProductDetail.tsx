import { useEffect, useRef, useState, type ReactNode, Suspense } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import InteractiveJersey3D from './InteractiveJersey3D';
import { Jersey, SIZES, COUNTRIES } from '../data/jerseys';
import { type CartItem } from '../lib/demo';

interface ProductDetailProps {
  jersey: Jersey;
  onAddSuccess: () => void;
  onAddItem: (item: Omit<CartItem, 'quantity'>) => void;
}


export default function ProductDetail({ jersey, onAddSuccess, onAddItem }: ProductDetailProps) {
  const [selectedSize, setSelectedSize]         = useState('M');
  const [selectedCountry, setSelectedCountry]   = useState('United States');
  const [adding, setAdding]                     = useState(false);
  const [added, setAdded]                       = useState(false);
  const [error, setError]                       = useState('');
  const addedTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const color = jersey.colors[0];
  const accentRgb = hexToRgb(color.accent);
  const secondaryRgb = hexToRgb(color.secondary);
  const primaryRgb = hexToRgb(color.primary);
  const accentSoft = rgba(accentRgb, 0.18);
  const accentMedium = rgba(accentRgb, 0.34);
  const accentStrong = rgba(accentRgb, 0.62);
  const secondarySoft = rgba(secondaryRgb, 0.4);
  const primarySoft = rgba(primaryRgb, 0.84);

  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);
    setError('');

    try {
      onAddItem({ jerseyId: jersey.id, size: selectedSize, country: selectedCountry });
      setAdded(true);
      onAddSuccess();
      clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 2500);
    } catch {
      setError('Could not add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center detail-enter overflow-hidden product-layout">
      {/* Premium jersey-aware atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `
            radial-gradient(ellipse 34% 78% at 50% 47%, ${accentMedium} 0%, ${accentSoft} 26%, transparent 61%),
            radial-gradient(ellipse 28% 58% at 41% 53%, ${secondarySoft} 0%, transparent 62%),
            radial-gradient(ellipse 34% 68% at 61% 49%, ${rgba(accentRgb, 0.12)} 0%, transparent 64%),
            linear-gradient(115deg, ${primarySoft} 0%, #040407 38%, ${rgba(secondaryRgb, 0.3)} 72%, #040407 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(90deg, rgba(4,4,7,0.88) 0%, rgba(4,4,7,0.2) 30%, rgba(4,4,7,0.08) 50%, rgba(4,4,7,0.2) 70%, rgba(4,4,7,0.88) 100%),
            radial-gradient(ellipse 90% 88% at 50% 52%, transparent 0%, transparent 48%, rgba(0,0,0,0.72) 100%)
          `,
        }}
      />
      <div
        className="absolute pointer-events-none top-[12%] bottom-[13%] left-[43%] w-[11%] opacity-40 blur-sm"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${rgba(accentRgb, 0.08)} 18%, ${rgba(accentRgb, 0.28)} 50%, ${rgba(accentRgb, 0.08)} 82%, transparent 100%)`,
          transform: 'skewX(-3deg)',
        }}
      />

      {/* LEFT: Special Edition text */}
      <div
        className="product-story absolute left-0 bottom-0 top-0 flex flex-col justify-center z-30"
        style={{ left: '5%', width: '26%' }}
      >
        <div className="flex flex-col gap-0" style={{ lineHeight: 0.85 }}>
          <span
            className="special-line-1 text-white font-display block"
            style={{
              fontSize: 'clamp(38px, 5.5vw, 76px)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            }}
          >
            SPECIAL
          </span>
          <span
            className="special-line-2 text-white font-display block"
            style={{
              fontSize: 'clamp(38px, 5.5vw, 76px)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            }}
          >
            EDITION
          </span>
          <span
            className="special-line-3 block"
            style={{
              fontSize: 'clamp(38px, 5.5vw, 76px)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              color: color.accent,
              textShadow: `0 0 28px ${rgba(accentRgb, 0.28)}`,
            }}
          >
            2026
          </span>
        </div>

        <div
          className="fade-up mt-4 text-[#8a8a9a] text-xs leading-relaxed"
          style={{
            fontFamily: 'Barlow, sans-serif',
            fontWeight: 400,
            animationDelay: '0.7s',
            opacity: 0,
          }}
        >
          {jersey.description}
        </div>
      </div>

      {/* CENTER: 3D Interactive Jersey */}
      <div
        className="product-model absolute z-20 flex items-center justify-center"
        style={{
          left: '22.5%',
          right: '23.5%',
          top: '0%',
          bottom: '6%',
        }}
      >
        {/* Glowing backdrop layer (CSS-filter safe) */}
        <div 
          className="absolute h-[58vh] w-[58vh] max-h-[620px] max-w-[620px] rounded-full pointer-events-none filter blur-[72px] opacity-60 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${accentStrong} 0%, ${accentSoft} 38%, transparent 72%)`,
            zIndex: 10
          }}
        />
        
        {/* WebGL Canvas container (No CSS filters applied directly) */}
        <div className="w-full h-full relative z-20">
          <Suspense fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-xs font-bold tracking-widest uppercase" style={{ color: color.accent }}>
              <Loader2 className="animate-spin" size={24} />
              <span>Loading 3D Jersey...</span>
            </div>
          }>
            <InteractiveJersey3D
              key={jersey.id}
              jerseyId={jersey.id}
            />
          </Suspense>
        </div>
      </div>

      {/* RIGHT: Product form */}
      <div
        className="product-form absolute top-0 bottom-0 z-30 flex flex-col justify-center form-enter"
        style={{ right: '3%', width: '30%' }}
      >
        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: 'rgba(14,14,22,0.85)',
            border: `1px solid ${rgba(accentRgb, 0.22)}`,
            boxShadow: `0 24px 80px rgba(0,0,0,0.45), 0 0 42px ${rgba(accentRgb, 0.09)}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Jersey name + price */}
          <div className="flex items-start justify-between">
            <div>
              <div
                className="text-white text-lg"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}
              >
                {jersey.name}
              </div>
              <div
                className="text-[#8a8a9a] text-xs tracking-widest uppercase"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
              >
                {jersey.subtitle}
              </div>
            </div>
            <div
              className="text-2xl"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: color.accent }}
            >
              {jersey.price}$
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* SIZE */}
          <div>
            <FormLabel>SIZE</FormLabel>
            <div className="flex items-center gap-2 mt-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  aria-pressed={s === selectedSize}
                  onClick={() => setSelectedSize(s)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs
                    transition-all duration-200 font-bold"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    background: s === selectedSize
                      ? 'transparent'
                      : 'transparent',
                    border: s === selectedSize
                      ? `2px solid ${color.accent}`
                      : '1.5px solid rgba(255,255,255,0.15)',
                    color: s === selectedSize ? color.accent : 'rgba(255,255,255,0.5)',
                    boxShadow: s === selectedSize ? `0 0 14px ${rgba(accentRgb, 0.24)}` : 'none',
                    transform: s === selectedSize ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* COUNTRY */}
          <div>
            <FormLabel>SHIP TO</FormLabel>
            <div className="relative mt-2">
              <select
                aria-label="Shipping country"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-white text-xs appearance-none cursor-pointer
                  transition-all duration-200 outline-none"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  color: 'white',
                }}
                onFocus={(e) => { e.target.style.borderColor = rgba(accentRgb, 0.5); }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#0e0e16', color: 'white' }}>
                    {c}
                  </option>
                ))}
              </select>
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a8a9a]"
              >
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                  <path d="M0 0l5 6 5-6z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="text-red-400 text-xs" style={{ fontFamily: 'Barlow, sans-serif' }}>
              {error}
            </p>
          )}

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="relative w-full py-3 rounded-xl flex items-center justify-center gap-2
              font-label text-xs tracking-widest transition-all duration-300 overflow-hidden shine-border"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: added
                ? rgba(accentRgb, 0.16)
                : rgba(accentRgb, 0.08),
              border: `1.5px solid ${added ? color.accent : rgba(accentRgb, 0.4)}`,
              color: color.accent,
              boxShadow: added ? `0 0 22px ${rgba(accentRgb, 0.22)}` : 'none',
            }}
          >
            {added ? (
              <>
                <Check size={14} />
                ADDED TO CART
              </>
            ) : adding ? (
              <>
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent"
                  style={{ animation: 'spin 0.7s linear infinite' }}
                />
                ADDING...
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                ADD TO CART
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = parseInt(
    normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized,
    16,
  );

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgba({ r, g, b }: { r: number; g: number; b: number }, alpha: number) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function FormLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="text-[#8a8a9a] text-[9px] tracking-[0.2em] uppercase"
      style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
    >
      {children}
    </div>
  );
}
