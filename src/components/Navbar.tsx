import { Search, ShoppingCart, User } from 'lucide-react';
import { type Portal } from './DemoPortal';
import { assetUrl } from '../lib/demo';

interface Props {
  visible: boolean;
  onOpen: (portal: Portal) => void;
  onHome: () => void;
  cartCount: number;
}

export default function Navbar({ visible, onOpen, onHome, cartCount }: Props) {
  return <nav aria-label="Main navigation" style={{ visibility: visible ? 'visible' : 'hidden' }} className={`site-nav absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 ${visible ? 'nav-enter' : 'opacity-0'}`}>
    <button onClick={onHome} className="flex items-center gap-2" aria-label="Jerserio home">
      <img src={assetUrl('1781254746556.png')} alt="" width="42" height="42" className="rounded-md object-contain" />
      <span className="brand-label font-bold tracking-[0.25em]">JERSERIO</span>
    </button>
    <div className="nav-links flex items-center gap-6">
      <button onClick={onHome}>Home</button>
      <button onClick={() => onOpen('history')}>History</button>
      <button onClick={() => onOpen('collections')}>Collections</button>
      <button onClick={() => onOpen('collections')}>Shop</button>
    </div>
    <div className="flex gap-2">
      <button className="demo-icon" aria-label="Search jerseys" onClick={() => onOpen('search')}><Search size={17} /></button>
      <button className="demo-icon" aria-label="Open demo profile" onClick={() => onOpen('profile')}><User size={17} /></button>
      <button className="demo-icon !w-auto px-3 gap-2" aria-label={`Open cart, ${cartCount} items`} onClick={() => onOpen('cart')}><ShoppingCart size={17} /><span>{cartCount}</span></button>
    </div>
  </nav>;
}
