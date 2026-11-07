import { VideoPlayback } from '@/api/models';

/**
 * URL para incrustar el vídeo según el proveedor que guarda el backend.
 * Devuelve null si el proveedor no se puede incrustar (se ofrecerá abrirlo fuera).
 */
/** Id de YouTube a partir de un id suelto o de cualquier enlace habitual (watch, youtu.be, embed, shorts). */
export function youtubeId(ref: string): string | null {
  const m = /(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/.exec(ref);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(ref) ? ref : null;
}

/** Id (y hash si es no listado) de Vimeo a partir de un id suelto o de un enlace. */
export function vimeoParts(ref: string): { id: string; hash: string | null } | null {
  const m = /(?:vimeo\.com\/(?:video\/)?)?(\d{3,})(?:\/([0-9a-f]{6,}))?/i.exec(ref);
  return m ? { id: m[1], hash: m[2] ?? null } : null;
}

/** URL para incrustar (Vimeo, enlace directo) o null si no se puede o aún no hay vídeo. */
/** Proveedor real: si el enlace es de YouTube o Vimeo se usa ese aunque el panel diga «enllaç directe». */
export function effectiveProvider(playback: VideoPlayback): string {
  const ref = playback.ref;
  if (/(?:youtu\.be\/|youtube\.com\/|youtube-nocookie\.com\/)/i.test(ref)) return 'youtube';
  if (/vimeo\.com\//i.test(ref)) return 'vimeo';
  return playback.provider.toLowerCase();
}

export function embedUri(playback: VideoPlayback): string | null {
  const ref = playback.ref.trim();
  // Referencia vacía o de relleno (todo ceros): el vídeo aún no está subido.
  if (ref === '' || /^0+$/.test(ref)) return null;
  switch (effectiveProvider(playback)) {
    case 'vimeo': {
      const v = vimeoParts(ref);
      if (!v) return null;
      return `https://player.vimeo.com/video/${v.id}?dnt=1${v.hash ? `&h=${v.hash}` : ''}`;
    }
    case 'youtube': {
      const id = youtubeId(ref);
      return id ? `https://www.youtube.com/embed/${id}?playsinline=1&rel=0` : null;
    }
    default:
      return /^https?:\/\//i.test(ref) ? ref : null;
  }
}

/**
 * Fuente del WebView. YouTube rechaza (error 153) los reproductores cargados sin un origen
 * HTTPS válido, así que se incrusta dentro de una página con baseUrl y referrer.
 */
export function embedSource(playback: VideoPlayback): { uri: string } | { html: string; baseUrl: string } | null {
  const uri = embedUri(playback);
  if (!uri) return null;
  if (effectiveProvider(playback) !== 'youtube') return { uri };
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${uri}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></body></html>`;
  return { html, baseUrl: 'https://movimentconscient.cat' };
}

export function hostOf(url: string): string {
  const m = /^https?:\/\/([^/?#:]+)/i.exec(url);
  return m ? m[1].toLowerCase() : '';
}

/** Hosts a los que puede navegar el reproductor incrustado. */
export function isAllowedEmbedHost(host: string, embedHost: string): boolean {
  return (
    host === embedHost || host === '' || host.endsWith('vimeo.com') || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com') || host.endsWith('vimeocdn.com')
  );
}
