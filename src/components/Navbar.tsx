import { Search, User } from 'lucide-react';

interface NavbarProps {
  visible: boolean;
}

export default function Navbar({ visible }: NavbarProps) {
  const links = ['HOME', 'HISTORY', 'COLLECTIONS', 'SHOP'];

  return (
    <nav
      className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 ${
        visible ? 'nav-enter' : 'opacity-0'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer">
        <img
          src="/1781254746556.png"
          alt="JERSERIO"
          style={{
            width: 42,
            height: 42,
            objectFit: 'contain',
            borderRadius: 6,
            filter: 'drop-shadow(0 0 8px rgba(180,140,60,0.4))',
          }}
        />
        <span
          className="font-display text-white text-sm tracking-[0.25em]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.25em' }}
        >
          JERSERIO
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-8">
        {links.map((link, i) => (
          <button
            key={link}
            className={`font-label text-xs tracking-widest transition-colors duration-200 ${
              i === 0 ? 'text-white' : 'text-[#8a8a9a] hover:text-white'
            }`}
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.15em' }}
          >
            {link}
            {i === 0 && (
              <div className="mt-0.5 h-px bg-[#00d4aa] w-full" />
            )}
          </button>
        ))}
      </div>

      {/* Icons */}
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center
          hover:border-[#00d4aa]/60 hover:bg-[#00d4aa]/10 transition-all duration-200">
          <Search size={14} color="white" />
        </button>
        <button className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center
          hover:border-[#00d4aa]/60 hover:bg-[#00d4aa]/10 transition-all duration-200">
          <User size={14} color="white" />
        </button>
      </div>
    </nav>
  );
}
