import ca from './ca';
import es from './es';

export type Locale = 'ca' | 'es';
export const SUPPORTED_LOCALES: Locale[] = ['ca', 'es'];
export const dictionaries: Record<Locale, Record<string, string>> = { ca, es };

const cap = (v: string) => (v ? v[0].toUpperCase() + v.slice(1) : v);
const fmt = (code: Locale, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(code, o);

/** Textos de la app: catalán por defecto, castellano como segunda lengua. */
export function createStrings(code: Locale) {
  const dict = dictionaries[code] ?? ca;
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = dict[key] ?? ca[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) text = text.split(`{${k}}`).join(String(v));
    return text;
  };

  const helpers = {
    code,
    time: (d: Date) => fmt(code, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
    timeRange: (a: Date, b: Date) => `${helpers.time(a)}–${helpers.time(b)}`,
    weekdayShort: (d: Date) => cap(fmt(code, { weekday: 'short' }).format(d).replace('.', '')),
    dayNumber: (d: Date) => String(d.getDate()),
    dateLong: (d: Date) => cap(fmt(code, { weekday: 'long', day: 'numeric', month: 'long' }).format(d)),
    dateShort: (d: Date) => fmt(code, { day: 'numeric', month: 'short' }).format(d).replace('.', ''),
    dateMedium: (d: Date) => fmt(code, { day: 'numeric', month: 'short', year: 'numeric' }).format(d),
    monthYear: (d: Date) => cap(fmt(code, { month: 'long', year: 'numeric' }).format(d)),
    money: (cents: number) => {
      const whole = cents % 100 === 0;
      return new Intl.NumberFormat(code, {
        style: 'currency', currency: 'EUR', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2,
      }).format(cents / 100);
    },
    /** "Avui", "Demà" o el día de la semana con fecha. */
    relativeDay: (d: Date, now: Date = new Date()) => {
      const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const diff = Math.round((b - a) / 86400000);
      if (diff === 0) return t('today');
      if (diff === 1) return t('tomorrow');
      return helpers.dateLong(d);
    },
    duration: (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h === 0) return t('minutes_short', { n: m });
      if (m === 0) return t('hours_short', { n: h });
      return t('hours_minutes_short', { h, m });
    },
  };
  return Object.assign(t, helpers);
}

export type Strings = ReturnType<typeof createStrings>;
