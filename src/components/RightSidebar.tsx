import { ChevronRight } from 'lucide-react';

interface RightSidebarProps {
  visible: boolean;
  currentJerseyIndex: number;
  totalJerseys: number;
}

export default function RightSidebar({
  visible,
  currentJerseyIndex,
  totalJerseys,
}: RightSidebarProps) {
  return (
    <div
      className={`absolute right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3
        ${visible ? 'sb-right-enter' : 'opacity-0'}`}
      style={{ width: 52 }}
    >
      {/* Thumbnail circle: Custom France Tricolor Jersey (Le Phantom Theme) */}
      <div
        className="w-10 h-10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center
          bg-[#0e0e16] shadow-[0_0_12px_rgba(79,195,247,0.25)]"
        title="Le Phantom (France Edition)"
      >
        <svg viewBox="0 0 40 40" width="28" height="28" fill="none">
          {/* Main France Blue body */}
          <path
            d="M 14,12 L 11,15 L 7,16 L 6,20 L 9,21 L 13,19 L 14,20 L 14,32 Q 20,34 26,32 L 26,20 L 27,19 L 31,21 L 34,20 L 33,16 L 29,15 L 26,12 L 23,8 Q 20,6 17,8 Z"
            fill="#0e122b"
            stroke="#4fc3f7"
            strokeWidth="0.8"
          />
          {/* Left sleeve cuff - French Blue */}
          <path d="M 6,20 L 9,21 L 8,18 Z" fill="#002395" />
          {/* Center chest line - White & Red accents representing French flag */}
          <rect x="19" y="12" width="1" height="12" fill="#ffffff" opacity="0.7" />
          <rect x="20" y="12" width="1" height="12" fill="#ed2939" opacity="0.7" />
          
          {/* Glowing neon detail */}
          <path
            d="M14,20 L14,32 Q20,34 26,32 L26,20"
            stroke="#4fc3f7"
            strokeWidth="0.6"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Progress dots */}
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: totalJerseys }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === currentJerseyIndex ? 3 : 2,
              height: i === currentJerseyIndex ? 18 : 10,
              background: i === currentJerseyIndex ? '#00d4aa' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Rotated label */}
      <div
        className="text-[#8a8a9a] text-[8px] tracking-widest uppercase"
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          letterSpacing: '0.18em',
          lineHeight: 1,
          paddingBottom: 4,
        }}
      >
        NEW LIMITED COLLECTION 2026
      </div>

      {/* Arrow button */}
      <button
        className="w-8 h-8 rounded-full border border-[#00d4aa]/40 flex items-center justify-center
          bg-[#00d4aa]/10 hover:bg-[#00d4aa]/20 hover:border-[#00d4aa]/70 transition-all duration-200
          text-[#00d4aa] mt-1"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
