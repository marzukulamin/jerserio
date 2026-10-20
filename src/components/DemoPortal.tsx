import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { JERSEYS } from '../data/jerseys';
import { type CartItem } from '../lib/demo';
import JerseyIllustration from './JerseyIllustration';

export type Portal = 'history' | 'collections' | 'search' | 'profile' | 'cart';

interface Props {
  portal: Portal;
  onClose: () => void;
  onSelect: (index: number) => void;
  items: CartItem[];
  update: (index: number, quantity: number) => void;
  clear: () => void;
  storageWarning: boolean;
}

const titles: Record<Portal, string> = {
  history: 'The Jerserio story', collections: 'The 2026 collection',
  search: 'Find your jersey', profile: 'Your demo profile', cart: 'Your demo cart',
};

export default function DemoPortal({ portal, onClose, onSelect, items, update, clear, storageWarning }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [name, setName] = useState(() => {
    try { return localStorage.getItem('jerserio-demo-name') ?? ''; } catch { return ''; }
  });
  const [message, setMessage] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const total = items.reduce((sum, item) => sum + JERSEYS.find((jersey) => jersey.id === item.jerseyId)!.price * item.quantity, 0);
  const filtered = JERSEYS.map((jersey, index) => ({ jersey, index })).filter(({ jersey }) =>
    `${jersey.name} ${jersey.subtitle} ${jersey.description}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <dialog ref={dialog} className="demo-dialog" aria-labelledby="portal-title" onCancel={onClose} onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="portal-content">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div><p className="text-xs text-[#00d4aa] uppercase tracking-widest mb-2">Interactive portfolio demo</p><h2 id="portal-title" className="text-3xl font-bold">{titles[portal]}</h2></div>
          <button autoFocus aria-label="Close dialog" className="demo-icon" onClick={onClose}><X size={20} /></button>
        </header>

        {portal === 'history' && <div className="space-y-5 leading-relaxed text-white/80">
          <p>Football heritage meets a digital showroom. Jerserio is a concept store celebrating four national teams through original jersey designs and interactive 3D models.</p>
          <p>Explore Argentina’s Golden Albiceleste, Brazil’s Black Canarinho, France’s Le Phantom, and Portugal’s Lusitano Prime. Rotate each design, select your fit, and try the shopping flow.</p>
          <p>This is a portfolio experience. Products and checkout are demonstrations; no payments or deliveries take place.</p>
          <button className="demo-action" onClick={() => onSelect(0)}>Explore the collection</button>
        </div>}

        {(portal === 'search' || portal === 'collections') && <>
          <label className="block mb-6">Search by name or team
            <input className="demo-input mt-2" type="search" placeholder="Try France or Argentina" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(({ jersey, index }) => <button key={jersey.id} className="collection-card" onClick={() => onSelect(index)}>
              <JerseyIllustration color={jersey.colors[0]} size={100} />
              <span className="font-bold">{jersey.name}</span>
              <span className="text-sm text-white/60">{jersey.subtitle} · ${jersey.price}</span>
              <span className="text-xs text-[#00d4aa]">Explore in 3D →</span>
            </button>)}
          </div>
          {!filtered.length && <p role="status">No jerseys found. Try another name or team.</p>}
        </>}

        {portal === 'profile' && <form className="space-y-5" onSubmit={(event) => {
          event.preventDefault();
          try { localStorage.setItem('jerserio-demo-name', name.trim()); setMessage('Profile saved on this browser.'); }
          catch { setMessage('Browser storage is unavailable. You can still explore the demo.'); }
        }}>
          <p>No sign-up needed. Add a display name to try the profile flow. It stays on this browser.</p>
          <label className="block">Display name<input className="demo-input mt-2" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required autoComplete="nickname" /></label>
          <button className="demo-action" type="submit">Save demo profile</button>
          <p role="status">{message}</p>
          <p className="text-sm text-white/60">This demo does not create an account, collect a password, or send profile details to a server.</p>
        </form>}

        {portal === 'cart' && <div className="space-y-5">
          <p className="text-sm text-white/60">Try the full cart flow. No payment or shipping details are collected.</p>
          {storageWarning && <p role="status">Your browser blocked storage. The cart will last until this page is refreshed.</p>}
          {complete ? <div role="status" className="rounded-xl border border-[#00d4aa]/40 p-6"><h3 className="text-xl text-[#00d4aa]">Demo order complete!</h3><p className="mt-2">Thanks for exploring Jerserio. No payment was taken and no real order was placed.</p><button className="demo-action mt-4" onClick={() => onSelect(0)}>Continue exploring</button></div> : <>
            {!items.length && <><p>Your cart is empty.</p><button className="demo-action" onClick={() => onSelect(0)}>Browse jerseys</button></>}
            {items.map((item, index) => {
              const jersey = JERSEYS.find((entry) => entry.id === item.jerseyId)!;
              return <article key={`${item.jerseyId}-${item.size}-${item.country}`} className="rounded-xl border border-white/15 p-4 space-y-3">
                <h3 className="font-bold">{jersey.name}</h3><p className="text-sm text-white/60">Size {item.size} · {item.country} · ${jersey.price} each</p>
                <div className="flex flex-wrap items-center gap-3">
                  <label>Quantity <input aria-label={`Quantity for ${jersey.name}, size ${item.size}, ${item.country}`} className="demo-input !w-20" type="number" min="1" max="99" value={item.quantity} onChange={(event) => { const value = event.target.valueAsNumber; if (Number.isInteger(value) && value > 0) update(index, value); }} /></label>
                  <button className="underline text-sm" aria-label={`Remove ${jersey.name}, size ${item.size}, ${item.country}`} onClick={() => update(index, 0)}>Remove</button><span className="ml-auto">${jersey.price * item.quantity}</span>
                </div>
              </article>;
            })}
            {!!items.length && <><div className="flex justify-between text-xl font-bold"><span>Demo total</span><span>${total}</span></div><div className="flex flex-wrap gap-4"><button className="demo-action" onClick={() => { clear(); setComplete(true); }}>Complete demo checkout</button><button className="underline" onClick={clear}>Clear cart</button></div></>}
          </>}
        </div>}
      </div>
    </dialog>
  );
}
