import React from 'react';

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
  category: 'Cyber' | 'Geometric' | 'Space' | 'Retro' | 'Minimal';
  patternType: string;
  description: string;
  previewBg: string;
  previewBorder: string;
  canvasBg: string;
  canvasStyle: React.CSSProperties;
  ambientGlowColor: string;
}

const svgPattern = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

// 1. Nanotech Hexagons (Seamless SVG Polygon Honeycomb)
const hexSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="48.5" viewBox="0 0 28 48.5"><path d="M14 0.5 L27.5 8.25 L27.5 23.75 L14 31.5 L0.5 23.75 L0.5 8.25 Z M14 48 L27.5 40.25 L27.5 24.75 L14 17 L0.5 24.75 L0.5 40.25 Z" fill="none" stroke="rgba(0, 240, 255, 0.28)" stroke-width="1.2"/></svg>`;

// 2. Cybernetic Circuit Traces (PCB Tracks & Solder Nodes)
const circuitSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><path d="M10 0 v25 h20 v20 h30 v35 M70 0 v35 h-20 v20 h-10 M0 60 h25 v-15 h15" fill="none" stroke="rgba(192, 132, 252, 0.32)" stroke-width="1.5"/><circle cx="10" cy="25" r="3.5" fill="rgba(236, 72, 153, 0.8)"/><circle cx="30" cy="45" r="3" fill="rgba(192, 132, 252, 0.8)"/><circle cx="60" cy="45" r="3" fill="rgba(168, 85, 247, 0.8)"/><circle cx="70" cy="35" r="3.5" fill="rgba(236, 72, 153, 0.9)"/></svg>`;

// 3. Isometric 3D Diamond Cubes
const isometricSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="104" viewBox="0 0 60 104"><path d="M30 0 L60 17.3 L60 52 L30 34.6 Z" fill="rgba(249, 115, 22, 0.08)" stroke="rgba(249, 115, 22, 0.3)" stroke-width="1.2"/><path d="M30 0 L0 17.3 L0 52 L30 34.6 Z" fill="rgba(0, 0, 0, 0.3)" stroke="rgba(249, 115, 22, 0.25)" stroke-width="1.2"/><path d="M30 69.3 L60 52 L60 86.6 L30 104 Z" fill="rgba(0, 0, 0, 0.5)" stroke="rgba(249, 115, 22, 0.25)" stroke-width="1.2"/><path d="M30 69.3 L0 52 L0 86.6 L30 104 Z" fill="rgba(249, 115, 22, 0.12)" stroke="rgba(249, 115, 22, 0.3)" stroke-width="1.2"/></svg>`;

// 4. Celestial Constellation Star Mesh
const constellationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><line x1="15" y1="20" x2="85" y2="30" stroke="rgba(168, 85, 247, 0.26)" stroke-width="1.2"/><line x1="85" y1="30" x2="50" y2="80" stroke="rgba(168, 85, 247, 0.26)" stroke-width="1.2"/><line x1="50" y1="80" x2="15" y2="20" stroke="rgba(168, 85, 247, 0.26)" stroke-width="1.2"/><circle cx="15" cy="20" r="3" fill="rgba(192, 132, 252, 0.9)"/><circle cx="85" cy="30" r="4" fill="rgba(236, 72, 153, 0.95)"/><circle cx="50" cy="80" r="3" fill="rgba(168, 85, 247, 0.9)"/><path d="M48 10 h4 v-4 h-4 v4 M46 8 h8 v-2 h-8" fill="rgba(0, 240, 255, 0.5)"/></svg>`;

export const BACKGROUND_THEMES: Record<BackgroundThemeId, BackgroundTheme> = {
  // 1. Nanotech Honeycomb (formerly cosmic)
  cosmic: {
    id: 'cosmic',
    name: 'Hexagon Honeycomb',
    category: 'Cyber',
    patternType: 'Hexagonal Nanotech Tessellation',
    description: 'High-tech interlocking hexagonal honeycomb pattern with electric cyan pulse',
    previewBg: 'bg-[#060D1A]',
    previewBorder: 'border-cyan-400',
    canvasBg: 'bg-[#050B16]',
    canvasStyle: {
      backgroundImage: `${svgPattern(hexSvg)}, radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.12) 0%, transparent 75%)`,
      backgroundSize: '28px 48.5px, 100% 100%',
    },
    ambientGlowColor: 'rgba(0, 240, 255, 0.18)',
  },

  // 2. Cyber Laser Wireframe
  cyber_grid: {
    id: 'cyber_grid',
    name: 'Cyber Laser Wireframe',
    category: 'Cyber',
    patternType: 'Major/Minor Perspective Grid',
    description: 'Precision dual-frequency digital wireframe grid with luminous intersection coordinates',
    previewBg: 'bg-[#050E1D]',
    previewBorder: 'border-cyan-400',
    canvasBg: 'bg-[#040A15]',
    canvasStyle: {
      backgroundImage: `linear-gradient(to right, rgba(0, 240, 255, 0.18) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(0, 240, 255, 0.18) 1.5px, transparent 1.5px), linear-gradient(to right, rgba(0, 240, 255, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.06) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.14) 0%, transparent 65%)`,
      backgroundSize: '120px 120px, 120px 120px, 30px 30px, 30px 30px, 100% 100%',
    },
    ambientGlowColor: 'rgba(0, 240, 255, 0.22)',
  },

  // 3. Cyber Circuit Board (formerly nebula)
  nebula: {
    id: 'nebula',
    name: 'Circuit Board Traces',
    category: 'Cyber',
    patternType: 'PCB Traces & IC Solder Nodes',
    description: 'Cybernetic printed circuit board with 45° copper traces and neon purple solder points',
    previewBg: 'bg-[#120624]',
    previewBorder: 'border-fuchsia-500',
    canvasBg: 'bg-[#0D041A]',
    canvasStyle: {
      backgroundImage: `${svgPattern(circuitSvg)}, radial-gradient(circle at 50% 40%, rgba(168, 85, 247, 0.16) 0%, transparent 70%)`,
      backgroundSize: '80px 80px, 100% 100%',
    },
    ambientGlowColor: 'rgba(168, 85, 247, 0.22)',
  },

  // 4. Blueprint CAD Architecture (formerly aurora)
  aurora: {
    id: 'aurora',
    name: 'Blueprint CAD Grid',
    category: 'Geometric',
    patternType: 'Architectural Blueprint Matrix',
    description: 'Deep navy engineering blueprint with 10mm millimeter lines and teal coordinate crosshairs',
    previewBg: 'bg-[#041624]',
    previewBorder: 'border-sky-400',
    canvasBg: 'bg-[#030F1A]',
    canvasStyle: {
      backgroundImage: `linear-gradient(to right, rgba(56, 189, 248, 0.25) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(56, 189, 248, 0.25) 1.5px, transparent 1.5px), linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.12) 0%, transparent 70%)`,
      backgroundSize: '60px 60px, 60px 60px, 12px 12px, 12px 12px, 100% 100%',
    },
    ambientGlowColor: 'rgba(56, 189, 248, 0.18)',
  },

  // 5. Synthwave Sunset Grid
  sunset: {
    id: 'sunset',
    name: 'Synthwave Laser Grid',
    category: 'Retro',
    patternType: '80s Arcade Perspective Grid',
    description: 'Retro 80s arcade horizon with neon magenta horizontal laser lines and warm ember floor',
    previewBg: 'bg-[#21061F]',
    previewBorder: 'border-pink-500',
    canvasBg: 'bg-[#150314]',
    canvasStyle: {
      backgroundImage: `linear-gradient(0deg, rgba(244, 63, 94, 0.22) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(236, 72, 153, 0.16) 1.5px, transparent 1.5px), radial-gradient(ellipse at 50% 80%, rgba(244, 63, 94, 0.2) 0%, transparent 65%)`,
      backgroundSize: '100% 32px, 48px 100%, 100% 100%',
    },
    ambientGlowColor: 'rgba(244, 63, 94, 0.22)',
  },

  // 6. Carbon Fiber 3D Weave
  carbon: {
    id: 'carbon',
    name: 'Carbon Fiber Twill',
    category: 'Geometric',
    patternType: 'Woven Carbon Twill Mesh',
    description: 'High-contrast tactile carbon fiber weave with 45-degree diagonal specular highlights',
    previewBg: 'bg-[#0E0E12]',
    previewBorder: 'border-zinc-400',
    canvasBg: 'bg-[#08080A]',
    canvasStyle: {
      backgroundImage: `linear-gradient(45deg, #18181D 25%, transparent 25%), linear-gradient(-45deg, #18181D 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181D 75%), linear-gradient(-45deg, transparent 75%, #18181D 75%), radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 70%)`,
      backgroundSize: '16px 16px, 16px 16px, 16px 16px, 16px 16px, 100% 100%',
    },
    ambientGlowColor: 'rgba(255, 255, 255, 0.08)',
  },

  // 7. Phosphor Terminal Scanlines (formerly matrix)
  matrix: {
    id: 'matrix',
    name: 'Terminal CRT Scanlines',
    category: 'Cyber',
    patternType: 'Hacker Phosphor Raster Scan',
    description: 'High-density hacker terminal green raster scanlines with digital frequency data tracks',
    previewBg: 'bg-[#02140A]',
    previewBorder: 'border-emerald-500',
    canvasBg: 'bg-[#010B05]',
    canvasStyle: {
      backgroundImage: `linear-gradient(to bottom, rgba(16, 185, 129, 0.16) 1.5px, transparent 1.5px), repeating-linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0px, rgba(16, 185, 129, 0.05) 1px, transparent 1px, transparent 24px), radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 65%)`,
      backgroundSize: '100% 8px, 100% 100%, 100% 100%',
    },
    ambientGlowColor: 'rgba(16, 185, 129, 0.22)',
  },

  // 8. Isometric Tech Cubes (formerly magma)
  magma: {
    id: 'magma',
    name: 'Isometric 3D Cubes',
    category: 'Geometric',
    patternType: 'Isometric Diamond Polygons',
    description: '3D geometric diamond polygon cubes with radiant molten amber and obsidian facets',
    previewBg: 'bg-[#1C0904]',
    previewBorder: 'border-orange-500',
    canvasBg: 'bg-[#120502]',
    canvasStyle: {
      backgroundImage: `${svgPattern(isometricSvg)}, radial-gradient(circle at 50% 60%, rgba(249, 115, 22, 0.16) 0%, transparent 70%)`,
      backgroundSize: '60px 104px, 100% 100%',
    },
    ambientGlowColor: 'rgba(249, 115, 22, 0.22)',
  },

  // 9. Celestial Constellations (formerly amethyst)
  amethyst: {
    id: 'amethyst',
    name: 'Star Map Constellations',
    category: 'Space',
    patternType: 'Geometric Star Coordinates',
    description: 'Celestial deep space star map with interconnected geometric constellation triangles',
    previewBg: 'bg-[#130826]',
    previewBorder: 'border-indigo-400',
    canvasBg: 'bg-[#0B0418]',
    canvasStyle: {
      backgroundImage: `${svgPattern(constellationSvg)}, radial-gradient(circle at 50% 50%, rgba(129, 140, 248, 0.16) 0%, transparent 70%)`,
      backgroundSize: '100px 100px, 100% 100%',
    },
    ambientGlowColor: 'rgba(129, 140, 248, 0.22)',
  },

  // 10. Audio Dot Matrix (formerly minimal_dark)
  minimal_dark: {
    id: 'minimal_dark',
    name: 'Audio Dot Matrix',
    category: 'Minimal',
    patternType: 'Perforated Hologram Dot Array',
    description: 'Futuristic perforated audio dot matrix array with glowing micro-points and zero distraction',
    previewBg: 'bg-[#06080F]',
    previewBorder: 'border-cyan-300/40',
    canvasBg: 'bg-[#030509]',
    canvasStyle: {
      backgroundImage: `radial-gradient(circle, rgba(0, 240, 255, 0.4) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.08) 0%, transparent 60%)`,
      backgroundSize: '22px 22px, 100% 100%',
    },
    ambientGlowColor: 'rgba(0, 240, 255, 0.15)',
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
