import { useState, useEffect, useRef, useCallback } from 'react';
import IntroScreen   from './components/IntroScreen';
import Navbar        from './components/Navbar';
import LeftSidebar   from './components/LeftSidebar';
import RightSidebar  from './components/RightSidebar';
import HeroSection   from './components/HeroSection';
import ProductDetail from './components/ProductDetail';
import BottomBar     from './components/BottomBar';
import { JERSEYS }   from './data/jerseys';

type Phase = 'intro' | 'hero' | 'zoom' | 'detail';

type CarouselDir = 'next' | 'prev' | null;

export default function App() {
  const [phase,           setPhase]           = useState<Phase>('intro');
  const [introExiting,    setIntroExiting]     = useState(false);
  const [jerseyIndex,     setJerseyIndex]      = useState(0);
  const [carouselDir,     setCarouselDir]      = useState<CarouselDir>(null);
  const [priceKey,        setPriceKey]         = useState(0);
  const [toast,           setToast]            = useState(false);
  const [toastHiding,     setToastHiding]      = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const toastHideTimer = useRef<ReturnType<typeof setTimeout>>();
  const carouselTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(toastHideTimer.current);
    clearTimeout(carouselTimer.current);
  }, []);

  const uiVisible = phase !== 'intro';
  const jersey    = JERSEYS[jerseyIndex];

  /* ── INTRO → HERO ── */
  useEffect(() => {
    // Start intro exit at 2.2s, switch to hero at 2.8s
    const t1 = setTimeout(() => setIntroExiting(true), 2200);
    const t2 = setTimeout(() => setPhase('hero'),       2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* ── HERO → ZOOM → DETAIL ── */
  useEffect(() => {
    if (phase !== 'hero') return;
    // 1s after hero appears → start zoom
    const t1 = setTimeout(() => setPhase('zoom'), 2600);
    return () => clearTimeout(t1);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'zoom') return;
    // zoom lasts ~1.1s, then switch to detail
    const t1 = setTimeout(() => setPhase('detail'), 1100);
    return () => clearTimeout(t1);
  }, [phase]);

  /* ── CAROUSEL ── */
  const navigate = useCallback((dir: 'next' | 'prev') => {
    if (carouselDir) return; // debounce mid-animation
    setCarouselDir(dir);

    setJerseyIndex((prev) => {
      if (dir === 'next') return (prev + 1) % JERSEYS.length;
      return (prev - 1 + JERSEYS.length) % JERSEYS.length;
    });
    setPriceKey((k) => k + 1);

    carouselTimer.current = setTimeout(() => setCarouselDir(null), 480);
  }, [carouselDir]);

  /* ── CART TOAST ── */
  const handleAddSuccess = useCallback(() => {
    clearTimeout(toastTimer.current);
    clearTimeout(toastHideTimer.current);
    setToastHiding(false);
    setToast(true);
    toastTimer.current = setTimeout(() => {
      setToastHiding(true);
      toastHideTimer.current = setTimeout(() => setToast(false), 350);
    }, 2500);
  }, []);

  /* ── CAROUSEL CLASS ── */
  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: '#040407' }}
    >
      {/* ── INTRO OVERLAY ── */}
      {(phase === 'intro' || introExiting) && (
        <IntroScreen exiting={introExiting} />
      )}

      {/* ── NAVBAR ── */}
      <Navbar visible={uiVisible} />

      {/* ── LEFT SIDEBAR ── */}
      <LeftSidebar visible={uiVisible} />

      {/* ── RIGHT SIDEBAR ── */}
      <RightSidebar
        visible={uiVisible}
        currentJerseyIndex={jerseyIndex}
        totalJerseys={JERSEYS.length}
      />

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0" style={{ top: 64, bottom: 56 }}>
        {(phase === 'hero' || phase === 'zoom') && (
          <HeroSection jersey={jersey} phase={phase === 'zoom' ? 'zoom' : 'hero'} />
        )}

        {phase === 'detail' && (
          <ProductDetail
            key={jersey.id}
            jersey={jersey}
            onAddSuccess={handleAddSuccess}
          />
        )}
      </div>

      {/* ── BOTTOM BAR ── */}
      <BottomBar
        visible={uiVisible}
        phase={phase as 'hero' | 'zoom' | 'detail'}
        jerseys={JERSEYS}
        currentIndex={jerseyIndex}
        onPrev={() => navigate('prev')}
        onNext={() => navigate('next')}
        selectedColorIndex={0}
        priceKey={priceKey}
      />

      {/* ── CART TOAST ── */}
      {toast && (
        <div
          className={`absolute top-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl
            flex items-center gap-2 text-xs ${toastHiding ? 'toast-hide' : 'toast-show'}`}
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: 'rgba(0,212,170,0.12)',
            border: '1px solid rgba(0,212,170,0.4)',
            color: '#00d4aa',
            backdropFilter: 'blur(10px)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Added to cart
        </div>
      )}

      {/* ── SCAN LINE OVERLAY (subtle scanlines for atmosphere) ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[150]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}
