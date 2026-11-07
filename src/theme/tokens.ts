import { ViewStyle } from 'react-native';

/** Tokens de la guía de estilos "Moviment Conscient by Jess". Cambiar primero la guía. */
export interface Palette {
  surface100: string; surface200: string; surface300: string; line: string; ink: string; inkMuted: string;
  violeta: string; onVioleta: string; turquesa: string; onTurquesa: string; turquesaLogo: string;
  onAct: string; ok: string; warning: string; error: string; isDark: boolean;
}

export const lightPalette: Palette = {
  surface100: '#FBF7EF', surface200: '#FFFFFF', surface300: '#F1E9DA', line: '#D9CDB8',
  ink: '#231B2B', inkMuted: '#5E5468', violeta: '#6A3593', onVioleta: '#FFFFFF',
  turquesa: '#0E7685', onTurquesa: '#FFFFFF', turquesaLogo: '#2BA3B5', onAct: '#FFFFFF',
  ok: '#0B6E99', warning: '#8A5A00', error: '#B3261E', isDark: false,
};

export const darkPalette: Palette = {
  surface100: '#17141C', surface200: '#211D28', surface300: '#2C2735', line: '#3A3444',
  ink: '#F4EEF7', inkMuted: '#BDB3C6', violeta: '#C9A3EA', onVioleta: '#1B1022',
  turquesa: '#6CCBD8', onTurquesa: '#08262B', turquesaLogo: '#2BA3B5', onAct: '#17141C',
  ok: '#7CC8EE', warning: '#F0C060', error: '#FF8E85', isDark: true,
};

/** Espaciado (4, 8, 12, 16, 24, 32, 48). */
export const Space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s8: 48 } as const;
/** Radios (8, 16, 24, pill). */
export const Radii = { sm: 8, md: 16, lg: 24, pill: 999 } as const;

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayExtra: 'BricolageGrotesque_800ExtraBold',
  displayMedium: 'BricolageGrotesque_600SemiBold',
  sans: 'Figtree_400Regular',
  sansMedium: 'Figtree_500Medium',
  sansSemi: 'Figtree_600SemiBold',
  sansBold: 'Figtree_700Bold',
  script: 'Caveat_500Medium',
} as const;

export function cardShadow(p: Palette): ViewStyle {
  return {
    shadowColor: p.isDark ? '#000000' : '#231B2B',
    shadowOpacity: p.isDark ? 0.35 : 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  };
}

// --- utilidades de color -------------------------------------------------

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

/** Color con opacidad como rgba() (RN no admite #RRGGBBAA de forma fiable en todas las plataformas). */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function alphaBlend(fg: string, alpha: number, bg: string): string {
  const [fr, fgc, fb] = hexToRgb(fg);
  const [br, bgc, bb] = hexToRgb(bg);
  return rgbToHex(fr * alpha + br * (1 - alpha), fgc * alpha + bgc * (1 - alpha), fb * alpha + bb * (1 - alpha));
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

export interface ActivityTone { base: string; onBase: string; soft: string }

/**
 * Color por actividad. El color lo define el backend; aquí se derivan el tono
 * suave (16 % sobre la superficie) y la variante aclarada para modo oscuro.
 */
export function activityTone(p: Palette, apiColor: string, apiOnColor?: string): ActivityTone {
  if (!p.isDark) {
    return { base: apiColor, onBase: apiOnColor ?? p.onAct, soft: alphaBlend(apiColor, 0.16, p.surface100) };
  }
  const [h, s, l] = rgbToHsl(...hexToRgb(apiColor));
  const lifted = hslToHex(h, s, l < 0.68 ? 0.68 : l);
  return { base: lifted, onBase: p.onAct, soft: alphaBlend(lifted, 0.16, p.surface100) };
}

/** Mezcla lineal de dos colores (t=0 → a, t=1 → b). */
export function mixColors(a: string, b: string, t: number): string {
  const x = hexToRgb(a), y = hexToRgb(b);
  return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}

/** Color legible para texto sobre el tono suave de una actividad. */
export function legibleOnSoft(p: Palette, base: string): string {
  return p.isDark ? base : mixColors(base, p.ink, 0.25);
}
