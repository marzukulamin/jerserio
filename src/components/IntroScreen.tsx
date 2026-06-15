interface IntroScreenProps {
  exiting: boolean;
}

export default function IntroScreen({ exiting }: IntroScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center
        bg-[#040407] ${exiting ? 'intro-exit' : ''}`}
      style={{ pointerEvents: exiting ? 'none' : 'all' }}
    >
      <div className="intro-logo flex flex-col items-center gap-5">
        <img
          src="/1781254746556.png"
          alt="JERSERIO"
          style={{
            width: 140,
            height: 140,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 30px rgba(180,140,60,0.5)) drop-shadow(0 0 60px rgba(180,140,60,0.2))',
          }}
        />
        <div
          className="text-white tracking-[0.4em] text-sm"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
        >
          JERSERIO
        </div>
        {/* Loading bar */}
        <div className="w-24 h-px bg-white/10 relative overflow-hidden mt-2">
          <div
            className="absolute left-0 top-0 h-full bg-[#00d4aa]"
            style={{
              animation: 'loading-bar 2s cubic-bezier(0.4,0,0.2,1) forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0%   { width: 0%; }
          80%  { width: 85%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
