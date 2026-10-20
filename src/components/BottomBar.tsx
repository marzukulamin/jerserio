import { ChevronLeft, ChevronRight, ShoppingCart, ExternalLink } from 'lucide-react';
import { Jersey } from '../data/jerseys';
import { assetUrl } from '../lib/demo';

interface BottomBarProps {
  visible: boolean;
  phase: 'hero' | 'zoom' | 'detail';
  jerseys: Jersey[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  selectedColorIndex: number;
  priceKey: number;
  onOpenCart: () => void;
}

export default function BottomBar({ visible, phase, jerseys, currentIndex, onPrev, onNext, selectedColorIndex, priceKey, onOpenCart }: BottomBarProps) {
  const jersey = jerseys[currentIndex];
  const color = jersey.colors[selectedColorIndex] || jersey.colors[0];
  return <footer className="site-footer absolute bottom-0 inset-x-0 z-40 flex items-center justify-between px-6 py-4" style={{ visibility: visible ? 'visible' : 'hidden' }}>
    <button className="demo-icon" aria-label="Open demo cart" onClick={onOpenCart}><ShoppingCart size={18} /></button>
    <div className="flex items-center gap-3">
      <button className="demo-icon" aria-label="Previous jersey" disabled={phase !== 'detail'} onClick={onPrev}><ChevronLeft size={18} /></button>
      <div className="text-center" key={priceKey}><p className="text-xs text-white/60">{currentIndex + 1} / {jerseys.length} · {color.label}</p><p className="text-lg font-bold">$ {jersey.price}</p></div>
      <button className="demo-icon" aria-label="Next jersey" disabled={phase !== 'detail'} onClick={onNext}><ChevronRight size={18} /></button>
    </div>
    <div className="footer-links flex gap-4 text-xs"><a href={assetUrl('?view=preview')} className="flex items-center gap-1">3D gallery <ExternalLink size={12} /></a><a href="https://github.com/marzukulamin/jerserio" target="_blank" rel="noopener noreferrer">Source code</a></div>
  </footer>;
}
