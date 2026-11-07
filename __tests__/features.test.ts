import { embedUri, hostOf, isAllowedEmbedHost } from '../src/features/videos/embed';
import { breathingState } from '../src/features/mes/BreathingScreen';
import { clock, wellnessRoute, wellnessIcon } from '../src/features/mes/wellnessCommon';
import { countdown } from '../src/features/mes/SunriseScreen';
import { readableOn } from '../src/features/resum/ResumScreen';
import { createStrings } from '../src/i18n';
import { activityTone, darkPalette, lightPalette, mixColors } from '../src/theme/tokens';

describe('vídeos', () => {
  test('embed según proveedor', () => {
    expect(embedUri({ provider: 'vimeo', ref: '12345' })).toBe('https://player.vimeo.com/video/12345?dnt=1');
    expect(embedUri({ provider: 'YouTube', ref: 'dQw4w9WgXcQ' })).toContain('youtube.com/embed/dQw4w9WgXcQ');
    expect(embedUri({ provider: 'otro', ref: 'https://cdn.test/v.mp4' })).toBe('https://cdn.test/v.mp4');
    expect(embedUri({ provider: 'otro', ref: 'javascript:alert(1)' })).toBeNull();
  });

  test('referencias vacías o de relleno (ceros) no se reproducen', () => {
    expect(embedUri({ provider: 'vimeo', ref: '' })).toBeNull();
    expect(embedSource({ provider: 'vimeo', ref: '000000000' })).toBeNull();
  });

  test('el reproductor solo navega a hosts permitidos', () => {
    const host = hostOf('https://player.vimeo.com/video/1?dnt=1');
    expect(host).toBe('player.vimeo.com');
    expect(isAllowedEmbedHost('f.vimeocdn.com', host)).toBe(true);
    expect(isAllowedEmbedHost('evil.example', host)).toBe(false);
  });
});

describe('Més', () => {
  test('rutas e iconos por tipo', () => {
    const item = (type: string, id = 1) => ({ id, type, title: '', description: null, content: null, mediaUrl: null, durationMinutes: null, icon: null, config: {} });
    expect(wellnessRoute(item('mindfulness'))).toBe('/mes/mindfulness');
    expect(wellnessRoute(item('sunrise'))).toBe('/mes/sortida-del-sol');
    expect(wellnessRoute(item('breathing'))).toBe('/mes/respiracio');
    expect(wellnessRoute(item('meditation_timer'))).toBe('/mes/meditacio');
    expect(wellnessRoute(item('gratitude'))).toBe('/mes/gratitud');
    expect(wellnessRoute(item('custom', 42))).toBe('/mes/proposta/42');
    expect(wellnessIcon('heart', 'custom')).toBe('heart-outline');
    expect(wellnessIcon(null, 'sunrise')).toBe('sunny-outline');
  });

  test('reloj mm:ss', () => {
    expect(clock(0)).toBe('00:00');
    expect(clock(605)).toBe('10:05');
  });

  test('respiración 4-4-6: fases, escala y cuenta atrás', () => {
    expect(breathingState(0, 4, 4, 6)).toMatchObject({ phase: 'inhale', left: 4 });
    expect(breathingState(3.5, 4, 4, 6).phase).toBe('inhale');
    expect(breathingState(4, 4, 4, 6)).toMatchObject({ phase: 'hold', scale: 1 });
    expect(breathingState(8, 4, 4, 6).phase).toBe('exhale');
    const end = breathingState(13.99, 4, 4, 6);
    expect(end.scale).toBeCloseTo(0.55, 1);
    expect(breathingState(0, 4, 4, 6).scale).toBeCloseTo(0.55, 5);
  });

  test('cuenta atrás de la salida del sol', () => {
    const s = createStrings('ca');
    const now = new Date(2026, 10, 7, 5, 0);
    expect(countdown(s, new Date(2026, 10, 7, 7, 41), now)).toBe('d\'aquí 2 h 41 min');
    expect(countdown(s, new Date(2026, 10, 7, 5, 30), now)).toBe('d\'aquí 30 min');
  });
});

describe('tema', () => {
  test('color por actividad: en claro respeta el del backend; en oscuro lo aclara', () => {
    const light = activityTone(lightPalette, '#6A3593');
    expect(light.base).toBe('#6A3593');
    expect(light.onBase).toBe('#FFFFFF');
    const dark = activityTone(darkPalette, '#6A3593');
    expect(dark.base).not.toBe('#6A3593');
    expect(dark.onBase).toBe(darkPalette.onAct);
  });

  test('mezcla de colores y texto legible', () => {
    expect(mixColors('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(readableOn('#FFFFFF')).toBe('#17141C');
    expect(readableOn('#6A3593')).toBe('#FFFFFF');
  });
});

import { embedSource, youtubeId, vimeoParts } from '@/features/videos/embed';
describe('vídeos', () => {
  test('ids de YouTube y Vimeo desde enlaces', () => {
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ?t=3')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(vimeoParts('https://vimeo.com/123456789/abcdef1234')).toEqual({ id: '123456789', hash: 'abcdef1234' });
  });
  test('YouTube se incrusta con baseUrl y los ceros no', () => {
    const src: any = embedSource({ provider: 'youtube', ref: 'https://youtu.be/dQw4w9WgXcQ' });
    expect(src.baseUrl).toMatch(/^https:\/\//);
    expect(src.html).toContain('youtube.com/embed/dQw4w9WgXcQ');
    expect(embedSource({ provider: 'vimeo', ref: '000000000' })).toBeNull();
  });
});

test('enlace de YouTube con proveedor «url» se incrusta igualmente', () => {
  const src: any = embedSource({ provider: 'url', ref: 'https://youtu.be/EGO5m_DBzF8?si=fUExb3tSEdxQ2z1P' });
  expect(src.html).toContain('youtube.com/embed/EGO5m_DBzF8');
});
