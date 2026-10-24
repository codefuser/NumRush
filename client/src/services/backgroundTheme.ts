export type BackgroundThemeId =
  | 'cosmic'
  | 'cyber_grid'
  | 'nebula'
  | 'aurora'
  | 'sunset'
  | 'carbon'
  | 'matrix'
  | 'magma'
  | 'amethyst'
  | 'minimal_dark';

export interface BackgroundTheme {
  id: BackgroundThemeId;
  name: string;
  category: 'Space' | 'Cyber' | 'Gradient' | 'Minimal';
  description: string;
  previewBg: string;
  previewBorder: string;
  canvasBg: string;
  canvasStyle?: React.CSSProperties;
  ambientGlowColor: string;
}

export const BACKGROUND_THEMES: Record<BackgroundThemeId, BackgroundTheme> = {
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Void',
    category: 'Space',
    description: 'Deep midnight space with subtle starry micro-dust',
    previewBg: 'bg-gradient-to-br from-[#060913] via-[#091122] to-[#04060c]',
    previewBorder: 'border-cyan-500/40',
    canvasBg: 'bg-[#070B14]',
    canvasStyle: {
      backgroundImage: `radial-gradient(circle at 50% 35%, rgba(0, 240, 255, 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)`,
    },
    ambientGlowColor: 'rgba(0, 240, 255, 0.12)',
  },
  cyber_grid: {
    id: 'cyber_grid',
    name: 'Cyberpunk Matrix Grid',
    category: 'Cyber',
    description: 'Holographic perspective digital wireframe grid',
    previewBg: 'bg-gradient-to-br from-[#0a1128] via-[#001f3f] to-[#040915]',
    previewBorder: 'border-cyan-400',
    canvasBg: 'bg-[#050B16]',
    canvasStyle: {
      backgroundImage: `linear-gradient(to right, rgba(0, 240, 255, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.06) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.07) 0%, transparent 70%)`,
      backgroundSize: '40px 40px, 40px 40px, 100% 100%',
    },
    ambientGlowColor: 'rgba(0, 240, 255, 0.15)',
  },
  nebula: {
    id: 'nebula',
    name: 'Deep Nebula',
    category: 'Space',
    description: 'Electric violet & starry cosmic nebula dust haze',
    previewBg: 'bg-gradient-to-br from-[#1A0B2E] via-[#110724] to-[#080214]',
    previewBorder: 'border-purple-500',
    canvasBg: 'bg-[#0E051C]',
    canvasStyle: {
      backgroundImage: `radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.14) 0%, transparent 50%), radial-gradient(circle at 75% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 60%)`,
    },
    ambientGlowColor: 'rgba(168, 85, 247, 0.18)',
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    category: 'Gradient',
    description: 'Shimmering arctic northern lights in teal & emerald wave',
    previewBg: 'bg-gradient-to-br from-[#061C1D] via-[#0A2E26] to-[#030E0E]',
    previewBorder: 'border-emerald-400',
    canvasBg: 'bg-[#041113]',
    canvasStyle: {
      backgroundImage: `radial-gradient(ellipse at 50% 20%, rgba(16, 185, 129, 0.14) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 50%)`,
    },
    ambientGlowColor: 'rgba(16, 185, 129, 0.15)',
  },
  sunset: {
    id: 'sunset',
    name: 'Vaporwave Sunset',
    category: 'Gradient',
    description: '80s arcade horizon with warm magenta and ember orange',
    previewBg: 'bg-gradient-to-br from-[#2D0C25] via-[#1F0824] to-[#120314]',
    previewBorder: 'border-pink-500',
    canvasBg: 'bg-[#150419]',
    canvasStyle: {
      backgroundImage: `radial-gradient(ellipse at 50% 80%, rgba(244, 63, 94, 0.15) 0%, transparent 60%), radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.08) 0%, transparent 50%)`,
    },
    ambientGlowColor: 'rgba(244, 63, 94, 0.16)',
  },
  carbon: {
    id: 'carbon',
    name: 'Stealth Carbon',
    category: 'Cyber',
    description: 'High-tech diagonal textured carbon fiber weave',
    previewBg: 'bg-gradient-to-br from-[#18181B] via-[#09090B] to-[#000000]',
    previewBorder: 'border-zinc-500',
    canvasBg: 'bg-[#09090B]',
    canvasStyle: {
      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 70%), linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)`,
      backgroundSize: '100% 100%, 16px 16px, 16px 16px, 16px 16px, 16px 16px',
    },
    ambientGlowColor: 'rgba(255, 255, 255, 0.06)',
  },
  matrix: {
    id: 'matrix',
    name: 'Emerald Terminal',
    category: 'Cyber',
    description: 'Hacker terminal dark slate with phosphor green tech glow',
    previewBg: 'bg-gradient-to-br from-[#02180C] via-[#010D07] to-[#000502]',
    previewBorder: 'border-emerald-500',
    canvasBg: 'bg-[#020A05]',
    canvasStyle: {
      backgroundImage: `radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.12) 0%, transparent 60%), linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px)`,
      backgroundSize: '100% 100%, 100% 20px',
    },
    ambientGlowColor: 'rgba(16, 185, 129, 0.18)',
  },
  magma: {
    id: 'magma',
    name: 'Volcanic Magma',
    category: 'Gradient',
    description: 'Molten volcanic charcoal with radiating fiery amber heat',
    previewBg: 'bg-gradient-to-br from-[#260B08] via-[#1A0605] to-[#0A0201]',
    previewBorder: 'border-orange-500',
    canvasBg: 'bg-[#120302]',
    canvasStyle: {
      backgroundImage: `radial-gradient(circle at 50% 60%, rgba(249, 115, 22, 0.14) 0%, transparent 60%), radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 50%)`,
    },
    ambientGlowColor: 'rgba(249, 115, 22, 0.18)',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Midnight Amethyst',
    category: 'Space',
    description: 'Royal crystalline purple void with radiant starlight',
    previewBg: 'bg-gradient-to-br from-[#1E0E38] via-[#120824] to-[#080312]',
    previewBorder: 'border-indigo-400',
    canvasBg: 'bg-[#0A0414]',
    canvasStyle: {
      backgroundImage: `radial-gradient(circle at 50% 30%, rgba(129, 140, 248, 0.12) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(192, 132, 252, 0.08) 0%, transparent 50%)`,
    },
    ambientGlowColor: 'rgba(129, 140, 248, 0.15)',
  },
  minimal_dark: {
    id: 'minimal_dark',
    name: 'Pure Matte Black',
    category: 'Minimal',
    description: 'Pure pitch black canvas with zero distraction for max speed',
    previewBg: 'bg-black',
    previewBorder: 'border-gray-700',
    canvasBg: 'bg-black',
    canvasStyle: {},
    ambientGlowColor: 'rgba(255, 255, 255, 0.02)',
  },
};

const STORAGE_KEY = 'numrush_bg_theme';

export const backgroundThemeService = {
  getCurrentThemeId(): BackgroundThemeId {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as BackgroundThemeId;
      if (saved && BACKGROUND_THEMES[saved]) {
        return saved;
      }
    } catch {}
    return 'cosmic';
  },

  getCurrentTheme(): BackgroundTheme {
    return BACKGROUND_THEMES[this.getCurrentThemeId()];
  },

  setThemeId(id: BackgroundThemeId) {
    if (BACKGROUND_THEMES[id]) {
      try {
        localStorage.setItem(STORAGE_KEY, id);
        window.dispatchEvent(new CustomEvent('numrush:bgThemeChanged', { detail: id }));
      } catch (e) {
        console.warn('Failed to save bg theme:', e);
      }
    }
  },
};
