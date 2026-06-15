interface LeftSidebarProps {
  visible: boolean;
}

export default function LeftSidebar({ visible }: LeftSidebarProps) {
  return (
    <div
      className={`absolute left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-[5px]
        ${visible ? 'sb-left-enter' : 'opacity-0'}`}
    >
      {/* Decorative stacked lines, top one longer */}
      <div className="flex flex-col gap-[5px]">
        <div className="h-px w-10 bg-white/60" />
        <div className="h-px w-7 bg-white/30" />
        <div className="h-px w-5 bg-white/20" />
        <div className="h-px w-7 bg-white/30" />
        <div className="h-px w-10 bg-white/15" />
      </div>
    </div>
  );
}
