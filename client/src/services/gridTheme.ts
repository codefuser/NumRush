export type GridModelId = 'cyber' | 'glass' | 'minimal' | 'arcade' | 'matrix' | 'sunset';

export interface GridModel {
  id: GridModelId;
  name: string;
  description: string;
  previewBg: string;
  previewBorder: string;
  boardBg: string;
  boardBorder: string;
  tileDefault: string;
  tileHover: string;
  tileText: string;
  tileShadow: string;
  badgeColor: string;
}

export const GRID_MODELS: Record<GridModelId, GridModel> = {
  cyber: {
    id: 'cyber',
    name: 'Cyber Neon',
    description: 'Electric cyan & purple neon glow on deep obsidian matrix',
    previewBg: 'from-cyan-500/30 to-purple-600/30',
    previewBorder: 'border-cyan-400',
    boardBg: 'bg-slate-950/60 backdrop-blur-md',
    boardBorder: 'border-cyan-500/30 shadow-[0_0_40px_rgba(0,240,255,0.15)]',
    tileDefault: 'bg-gradient-to-b from-[#1C263B] to-[#0E1726] border-slate-700/80',
    tileHover: 'hover:border-cyan-400 hover:from-[#24314C] hover:to-[#131F33] hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]',
    tileText: 'text-slate-100',
    tileShadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.4)]',
    badgeColor: 'text-cyan-400',
  },
  glass: {
    id: 'glass',
    name: 'Glassmorphism Luxe',
    description: 'Frosted translucent acrylic cards with icy backlight',
    previewBg: 'from-sky-400/30 to-indigo-500/30',
    previewBorder: 'border-sky-300',
    boardBg: 'bg-white/[0.04] backdrop-blur-xl',
    boardBorder: 'border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
    tileDefault: 'bg-white/[0.08] backdrop-blur-md border-white/20',
    tileHover: 'hover:bg-white/[0.18] hover:border-white/50 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]',
    tileText: 'text-white font-black',
    tileShadow: 'shadow-[0_4px_16px_rgba(0,0,0,0.25)]',
    badgeColor: 'text-sky-300',
  },
  minimal: {
    id: 'minimal',
    name: 'High Contrast Clean',
    description: 'Pure matte black with crisp high-contrast speedrunner tiles',
    previewBg: 'from-zinc-700 to-zinc-900',
    previewBorder: 'border-white',
    boardBg: 'bg-black/90 backdrop-blur-none',
    boardBorder: 'border-zinc-700 shadow-2xl',
    tileDefault: 'bg-zinc-900 border-zinc-700',
    tileHover: 'hover:bg-zinc-800 hover:border-amber-400 hover:text-amber-300',
    tileText: 'text-zinc-100 font-extrabold',
    tileShadow: 'shadow-md',
    badgeColor: 'text-amber-400',
  },
  arcade: {
    id: 'arcade',
    name: 'Retro 80s Arcade',
    description: 'Synthwave hot magenta and radiant golden arcade vibes',
    previewBg: 'from-fuchsia-500/40 to-yellow-500/30',
    previewBorder: 'border-fuchsia-400',
    boardBg: 'bg-[#180728]/80 backdrop-blur-md',
    boardBorder: 'border-fuchsia-500/40 shadow-[0_0_35px_rgba(217,70,239,0.2)]',
    tileDefault: 'bg-gradient-to-b from-[#2B104A] to-[#160626] border-fuchsia-500/50',
    tileHover: 'hover:from-[#3D146A] hover:to-[#23093D] hover:border-amber-400 hover:shadow-[0_0_18px_rgba(245,158,11,0.4)]',
    tileText: 'text-fuchsia-100',
    tileShadow: 'shadow-[0_2px_10px_rgba(168,85,247,0.3)]',
    badgeColor: 'text-fuchsia-400',
  },
  matrix: {
    id: 'matrix',
    name: 'Emerald Matrix',
    description: 'Hacker terminal dark slate with phosphor green phosphorescence',
    previewBg: 'from-emerald-500/30 to-green-600/30',
    previewBorder: 'border-emerald-400',
    boardBg: 'bg-[#04110A]/80 backdrop-blur-md',
    boardBorder: 'border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.2)]',
    tileDefault: 'bg-gradient-to-b from-[#082315] to-[#04130B] border-emerald-600/40',
    tileHover: 'hover:border-emerald-400 hover:from-[#0E3520] hover:to-[#071F12] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    tileText: 'text-emerald-100 font-mono font-black',
    tileShadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.5)]',
    badgeColor: 'text-emerald-400',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Ember',
    description: 'Volcanic obsidian with radiant warm flame and orange gradients',
    previewBg: 'from-orange-500/30 to-rose-600/30',
    previewBorder: 'border-orange-400',
    boardBg: 'bg-[#180909]/80 backdrop-blur-md',
    boardBorder: 'border-orange-500/30 shadow-[0_0_35px_rgba(249,115,22,0.2)]',
    tileDefault: 'bg-gradient-to-b from-[#2E1210] to-[#170807] border-orange-700/50',
    tileHover: 'hover:border-orange-400 hover:from-[#3D1815] hover:to-[#220B0A] hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]',
    tileText: 'text-orange-100',
    tileShadow: 'shadow-[0_2px_8px_rgba(0,0,0,0.5)]',
    badgeColor: 'text-orange-400',
  },
};

export const gridThemeService = {
  getCurrentModelId(): GridModelId {
    const saved = localStorage.getItem('numrush_grid_model') as GridModelId;
    if (saved && GRID_MODELS[saved]) {
      return saved;
    }
    return 'cyber';
  },

  getCurrentModel(): GridModel {
    return GRID_MODELS[this.getCurrentModelId()];
  },

  setModelId(id: GridModelId) {
    if (GRID_MODELS[id]) {
      localStorage.setItem('numrush_grid_model', id);
      window.dispatchEvent(new CustomEvent('numrush:gridThemeChanged', { detail: id }));
    }
  },
};
