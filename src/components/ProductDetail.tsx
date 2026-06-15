import { useState, type ReactNode, Suspense } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import InteractiveJersey3D from './InteractiveJersey3D';
import { Jersey, SIZES, COUNTRIES } from '../data/jerseys';
import { supabase } from '../lib/supabase';

interface ProductDetailProps {
  jersey: Jersey;
  carouselClass: string;
  onAddSuccess: () => void;
}

function getSessionId(): string {
  let id = sessionStorage.getItem('jerserio_session');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('jerserio_session', id);
  }
  return id;
}

export default function ProductDetail({ jersey, carouselClass, onAddSuccess }: ProductDetailProps) {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize]         = useState('M');
  const [selectedCountry, setSelectedCountry]   = useState('United States');
  const [adding, setAdding]                     = useState(false);
  const [added, setAdded]                       = useState(false);
  const [error, setError]                       = useState('');

  const color = jersey.colors[selectedColorIdx];

  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);
    setError('');

    const { error: dbError } = await supabase.from('cart_items').insert({
      session_id:  getSessionId(),
      jersey_id:   jersey.id,
      jersey_name: jersey.name,
      color:       color.label,
      size:        selectedSize,
      country:     selectedCountry,
      price:       jersey.price,
      quantity:    1,
    });

    setAdding(false);

    if (dbError) {
      setError('Could not add to cart. Please try again.');
    } else {
      setAdded(true);
      onAddSuccess();
      setTimeout(() => setAdded(false), 2500);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center detail-enter overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 70% at 45% 55%, ${color.accent}0d 0%, transparent 65%)`,
        }}
      />

      {/* LEFT: Special Edition text */}
      <div
        className="absolute left-0 bottom-0 top-0 flex flex-col justify-center z-30"
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
              color: '#00d4aa',
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
        className={`absolute z-20 flex items-center justify-center ${carouselClass}`}
        style={{
          left: '24%',
          right: '33%',
          top: '2%',
          bottom: '2%',
        }}
      >
        {/* Glowing backdrop layer (CSS-filter safe) */}
        <div 
          className="absolute w-64 h-64 rounded-full pointer-events-none filter blur-[60px] opacity-40 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${color.accent} 0%, transparent 70%)`,
            zIndex: 10
          }}
        />
        
        {/* WebGL Canvas container (No CSS filters applied directly) */}
        <div className="w-full h-full jersey-detail-enter relative z-20">
          <Suspense fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#00d4aa] text-xs font-bold tracking-widest uppercase">
              <Loader2 className="animate-spin" size={24} />
              <span>Loading 3D Jersey...</span>
            </div>
          }>
            <InteractiveJersey3D
              jerseyId={jersey.id}
            />
          </Suspense>
        </div>
      </div>

      {/* RIGHT: Product form */}
      <div
        className="absolute top-0 bottom-0 z-30 flex flex-col justify-center form-enter"
        style={{ right: '3%', width: '30%' }}
      >
        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: 'rgba(14,14,22,0.85)',
            border: '1px solid rgba(255,255,255,0.06)',
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
              className="text-[#00d4aa] text-2xl"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}
            >
              {jersey.price}$
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* COLOR */}
          <div>
            <FormLabel>COLOR</FormLabel>
            <div className="flex items-center gap-2 mt-2">
              {jersey.colors.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColorIdx(i)}
                  className="flex flex-col items-center gap-1.5 group"
                  title={c.label}
                >
                  <div
                    className="w-7 h-7 rounded-full border-2 transition-all duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${c.secondary}, ${c.accent})`,
                      borderColor: i === selectedColorIdx ? '#00d4aa' : 'rgba(255,255,255,0.15)',
                      boxShadow: i === selectedColorIdx ? `0 0 10px ${c.accent}60` : 'none',
                      transform: i === selectedColorIdx ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                  <div
                    className="h-0.5 rounded-full transition-all duration-200"
                    style={{
                      width: i === selectedColorIdx ? 24 : 0,
                      background: '#00d4aa',
                    }}
                  />
                </button>
              ))}
            </div>
            <div
              className="mt-1 text-[10px] text-[#8a8a9a] tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {color.label}
            </div>
          </div>

          {/* SIZE */}
          <div>
            <FormLabel>SIZE</FormLabel>
            <div className="flex items-center gap-2 mt-2">
              {SIZES.map((s) => (
                <button
                  key={s}
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
                      ? `2px solid #00d4aa`
                      : '1.5px solid rgba(255,255,255,0.15)',
                    color: s === selectedSize ? '#00d4aa' : 'rgba(255,255,255,0.5)',
                    boxShadow: s === selectedSize ? '0 0 12px rgba(0,212,170,0.25)' : 'none',
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
                onFocus={(e) => { e.target.style.borderColor = 'rgba(0,212,170,0.5)'; }}
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
            <p className="text-red-400 text-xs" style={{ fontFamily: 'Barlow, sans-serif' }}>
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
                ? 'rgba(0,212,170,0.15)'
                : 'rgba(0,212,170,0.08)',
              border: `1.5px solid ${added ? '#00d4aa' : 'rgba(0,212,170,0.4)'}`,
              color: '#00d4aa',
              boxShadow: added ? '0 0 20px rgba(0,212,170,0.2)' : 'none',
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
