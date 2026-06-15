import type { CSSProperties } from 'react';
import JerseyIllustration from './JerseyIllustration';
import { Jersey } from '../data/jerseys';

interface HeroSectionProps {
  jersey: Jersey;
  phase: 'hero' | 'zoom';
}

const TEXT_STYLE: CSSProperties = {
  fontSize: 'clamp(88px, 15vw, 220px)',
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  letterSpacing: '-0.02em',
  textTransform: 'uppercase',
  lineHeight: 0.88,
  color: 'white',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

export default function HeroSection({ jersey, phase }: HeroSectionProps) {
  const color = jersey.colors[0];
  const isZooming = phase === 'zoom';
  const jerseySize = Math.min(window.innerWidth * 0.38, 440);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background radial gradient */}
      <div
        className="absolute inset-0 hero-glow"
        style={{
          zIndex: 1,
          background: `radial-gradient(ellipse 60% 70% at 50% 55%, ${color.accent}12 0%, transparent 70%)`,
        }}
      />

      {/* ── LAYER 1: "STYLED" — BEHIND the jersey ── */}
      <div
        className={`absolute inset-x-0 flex justify-center items-center pointer-events-none
          ${isZooming ? 'text-zoom-exit' : ''}`}
        style={{
          zIndex: 10,
          top: '36%',
          transform: 'translateY(-50%)',
        }}
      >
        <span
          className={isZooming ? '' : 'hero-text-left'}
          style={TEXT_STYLE}
        >
          STYLED
        </span>
      </div>

      {/* ── LAYER 2: Jersey illustration — BETWEEN the two texts ── */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 20 }}
      >
        <div
          className={isZooming ? 'jersey-zoom' : 'hero-jersey'}
          style={{
            filter: `drop-shadow(0 0 60px ${color.accent}40) drop-shadow(0 0 120px ${color.accent}20)`,
          }}
        >
          <JerseyIllustration
            color={color}
            size={jerseySize}
            glowIntensity="high"
          />
        </div>
      </div>

      {/* ── LAYER 3: "JERSEYS" — IN FRONT of the jersey ── */}
      <div
        className={`absolute inset-x-0 flex justify-center items-center pointer-events-none
          ${isZooming ? 'text-zoom-exit' : ''}`}
        style={{
          zIndex: 30,
          top: '66%',
          transform: 'translateY(-50%)',
        }}
      >
        <span
          className={isZooming ? '' : 'hero-text-right'}
          style={TEXT_STYLE}
        >
          JERSEYS
        </span>
      </div>
    </div>
  );
}
