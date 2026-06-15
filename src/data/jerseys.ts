export interface Jersey {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  colors: JerseyColor[];
  description: string;
}

export interface JerseyColor {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const JERSEYS: Jersey[] = [
  {
    id: 'golden-albiceleste',
    name: 'GOLDEN ALBICELESTE',
    subtitle: 'Argentina Edition',
    price: 149,
    description: 'A golden tribute to champions. Engineered with absolute precision, honoring football history with luxurious golden details.',
    colors: [
      { id: 'gold',     label: 'Champion Gold', primary: '#101827', secondary: '#1e293b', accent: '#e0c068' },
      { id: 'sky',      label: 'Sky Blue',      primary: '#0b1625', secondary: '#142a44', accent: '#3fc3ec' },
      { id: 'platina',  label: 'Platinum',      primary: '#121212', secondary: '#242424', accent: '#e5e7eb' },
    ],
  },
  {
    id: 'black-canarinho',
    name: 'BLACK CANARINHO',
    subtitle: 'Brasil Edition',
    price: 145,
    description: 'Dark and electric. Merging the legendary samba spirit with sleek futuristic lines and intense neon detailing.',
    colors: [
      { id: 'neon-teal', label: 'Neon Teal',   primary: '#08080c', secondary: '#12121a', accent: '#00d4aa' },
      { id: 'aurora',    label: 'Solar Flare', primary: '#0c0e08', secondary: '#1b2210', accent: '#eab308' },
      { id: 'midnight',  label: 'Obsidian',    primary: '#050508', secondary: '#101018', accent: '#10b981' },
    ],
  },
  {
    id: 'le-phantom',
    name: 'LE PHANTOM',
    subtitle: 'France Edition',
    price: 139,
    description: 'Precision-crafted phantom thread. Highlighting raw elegance, dynamic flow, and unmatched speed on the pitch.',
    colors: [
      { id: 'electric', label: 'Tricolor',     primary: '#0a0d1a', secondary: '#121730', accent: '#4fc3f7' },
      { id: 'royal',    label: 'Royal Navy',   primary: '#050711', secondary: '#0e122b', accent: '#3b82f6' },
      { id: 'phantom',  label: 'Phantom Gray', primary: '#111116', secondary: '#23232c', accent: '#94a3b8' },
    ],
  },
  {
    id: 'lusitano-prime',
    name: 'LUSITANO PRIME',
    subtitle: 'Portugal Edition',
    price: 144,
    description: 'True speed of a legend. Tailored athletic fit built with aero-flow design, inspired by royal Portuguese crimson.',
    colors: [
      { id: 'crimson',  label: 'Imperial Red', primary: '#1a0508', secondary: '#3a0c12', accent: '#ef5350' },
      { id: 'monarch',  label: 'Monarch Gold', primary: '#130e05', secondary: '#2b1e0d', accent: '#f59e0b' },
      { id: 'verdant',  label: 'Verdant Green',primary: '#05180f', secondary: '#0d3822', accent: '#10b981' },
    ],
  },
];

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const COUNTRIES = [
  'United States', 'United Kingdom', 'France', 'Germany', 'Italy',
  'Spain', 'Netherlands', 'Belgium', 'Portugal', 'Canada',
  'Australia', 'Japan', 'Brazil', 'Argentina', 'Mexico',
];
