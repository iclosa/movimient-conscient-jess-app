/** Modelos de la API v1 del backend. Solo se leen datos que el backend devuelve. */

type J = Record<string, any>;

/** "2026-11-07T10:00:00+01:00" → Date */
export const parseDateTime = (v: unknown): Date => new Date(String(v));
const dtn = (v: unknown): Date | null => (v == null ? null : parseDateTime(v));

/** "2026-11-07" → medianoche local (new Date('YYYY-MM-DD') sería UTC). */
export function parseDate(v: unknown): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  if (!m) return new Date(String(v));
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
const dn = (v: unknown): Date | null => (v == null ? null : parseDate(v));

export function toApiDate(d: Date): string {
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${p(d.getFullYear(), 4)}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const int = (v: unknown): number | null => (v == null ? null : Math.trunc(Number(v)));
const num = (v: unknown, fallback = 0): number => (v == null || Number.isNaN(Number(v)) ? fallback : Number(v));
const str = (v: unknown): string | null => (v == null ? null : String(v));
const list = <T>(v: unknown, f: (j: J) => T): T[] => (Array.isArray(v) ? v.map((e) => f(e as J)) : []);
const isObj = (v: unknown): v is J => v != null && typeof v === 'object' && !Array.isArray(v);

export const BRAND_FALLBACK = '#6A3593';

export function parseHex(hex: string | null | undefined, fallback = BRAND_FALLBACK): string {
  if (!hex) return fallback;
  return /^#[0-9a-fA-F]{6}$/.test(hex.trim()) ? hex.trim() : fallback;
}

export interface Child { id: number; name: string; birthDate: Date | null }
export const parseChild = (j: J): Child => ({ id: j.id, name: j.name, birthDate: dn(j.birth_date) });

export interface UserProfile {
  id: number; name: string; email: string; phone: string | null; locale: string;
  birthDate: Date | null; marketingConsent: boolean; children: Child[];
}
export const parseUser = (j: J): UserProfile => ({
  id: j.id, name: j.name, email: j.email, phone: str(j.phone), locale: j.locale ?? 'ca',
  birthDate: dn(j.birth_date), marketingConsent: j.marketing_consent === true,
  children: list(j.children, parseChild),
});
export const firstName = (u: UserProfile) => u.name.trim().split(/\s+/)[0] ?? u.name;

export interface Activity {
  id: number; name: string; slug: string; tagline: string | null; description: string | null;
  level: string | null; color: string; colorText: string; priceCents: number | null;
  priceLabel: string | null; imageUrl: string | null; isFamily: boolean;
}
export const parseActivity = (j: J): Activity => ({
  id: j.id, name: j.name, slug: j.slug ?? '', tagline: str(j.tagline), description: str(j.description),
  level: str(j.level), color: parseHex(j.color), colorText: parseHex(j.color_text, '#FFFFFF'),
  priceCents: int(j.price_cents), priceLabel: str(j.price_label), imageUrl: str(j.image_url),
  isFamily: j.is_family === true,
});

export interface Instructor { id: number; name: string; photoUrl: string | null }
export const parseInstructor = (j: J): Instructor => ({ id: j.id, name: j.name, photoUrl: str(j.photo_url) });

export interface MyBookingRef { id: number; status: string; paymentMode: string; childId: number | null }
export const parseBookingRef = (j: J): MyBookingRef => ({ id: j.id, status: j.status, paymentMode: j.payment_mode ?? '', childId: int(j.child_id) });

/** state: available | full | booked | waitlist | cancelled */
export interface ClassSession {
  id: number; title: string; startsAt: Date; endsAt: Date; isPast: boolean; capacity: number;
  spotsLeft: number; state: string; priceCents: number | null; activity: Activity | null;
  instructor: Instructor | null; room: string | null; myBookings: MyBookingRef[];
}
export const parseSession = (j: J): ClassSession => ({
  id: j.id, title: j.title, startsAt: parseDateTime(j.starts_at), endsAt: parseDateTime(j.ends_at),
  isPast: j.is_past === true, capacity: num(j.capacity), spotsLeft: num(j.spots_left), state: j.state,
  priceCents: int(j.price_cents),
  activity: isObj(j.activity) ? parseActivity(j.activity) : null,
  instructor: isObj(j.instructor) ? parseInstructor(j.instructor) : null,
  room: str(j.room), myBookings: list(j.my_bookings, parseBookingRef),
});

export interface Attendee { type: string; childId: number | null; name: string }
export const parseAttendee = (j: J): Attendee => ({ type: j.type, childId: int(j.child_id), name: j.name ?? '' });
export const isChildAttendee = (a: Attendee) => a.type === 'child';

export interface Booking {
  id: number; status: string; statusLabel: string; paymentMode: string; attendee: Attendee; canCancel: boolean;
  freeCancellationUntil: Date | null; isFreeCancellation: boolean; lateCancellation: boolean;
  canRate: boolean; rating: number | null; ratingComment: string | null; session: ClassSession | null;
}
/** Reserva confirmada pero sin cobrar (sin bono): se paga en la clase o con un bono. */
export const isPaymentPending = (b: { status: string; paymentMode: string }) => b.status === 'booked' && b.paymentMode === 'pending';
export const parseBooking = (j: J): Booking => ({
  id: j.id, status: j.status, statusLabel: j.status_label ?? j.status, paymentMode: j.payment_mode ?? '',
  attendee: parseAttendee(j.attendee ?? {}), canCancel: j.can_cancel === true,
  freeCancellationUntil: dtn(j.free_cancellation_until), isFreeCancellation: j.is_free_cancellation === true,
  lateCancellation: j.late_cancellation === true, canRate: j.can_rate === true, rating: int(j.rating),
  ratingComment: str(j.rating_comment), session: isObj(j.session) ? parseSession(j.session) : null,
});

export interface UserPass {
  id: number; name: string; classesTotal: number | null; classesRemaining: number | null;
  unlimited: boolean; startsOn: Date; expiresOn: Date | null; status: string; usable: boolean;
}
export const parseUserPass = (j: J): UserPass => ({
  id: j.id, name: j.name, classesTotal: int(j.classes_total), classesRemaining: int(j.classes_remaining),
  unlimited: j.unlimited === true, startsOn: parseDate(j.starts_on), expiresOn: dn(j.expires_on),
  status: j.status ?? '', usable: j.usable === true,
});

export interface Pass {
  id: number; name: string; description: string | null; type: string; classesCount: number | null;
  unlimited: boolean; validityDays: number | null; priceCents: number; priceLabel: string; isFeatured: boolean;
}
export const parsePass = (j: J): Pass => ({
  id: j.id, name: j.name, description: str(j.description), type: j.type ?? 'pack',
  classesCount: int(j.classes_count), unlimited: j.unlimited === true, validityDays: int(j.validity_days),
  priceCents: num(j.price_cents), priceLabel: j.price_label ?? '', isFeatured: j.is_featured === true,
});
export const isSubscription = (p: Pass) => p.type === 'subscription';

export interface Promotion {
  id: number; title: string; body: string | null; type: string; color: string; imageUrl: string | null;
  ctaLabel: string | null; ctaUrl: string | null; endsAt: Date | null;
}
export const parsePromotion = (j: J): Promotion => ({
  id: j.id, title: j.title, body: str(j.body), type: j.type ?? 'promo', color: parseHex(j.color),
  imageUrl: str(j.image_url), ctaLabel: str(j.cta_label), ctaUrl: str(j.cta_url), endsAt: dtn(j.ends_at),
});

export interface AppEvent {
  id: number; title: string; type: string; description: string | null; location: string | null;
  startsAt: Date; endsAt: Date | null; capacity: number | null; spotsLeft: number | null;
  priceCents: number | null; priceLabel: string | null; imageUrl: string | null;
  /** confirmed | waitlist | null */
  myRegistration: string | null;
}
export const parseEvent = (j: J): AppEvent => ({
  id: j.id, title: j.title, type: j.type ?? 'taller', description: str(j.description), location: str(j.location),
  startsAt: parseDateTime(j.starts_at), endsAt: dtn(j.ends_at), capacity: int(j.capacity),
  spotsLeft: int(j.spots_left), priceCents: int(j.price_cents), priceLabel: str(j.price_label),
  imageUrl: str(j.image_url), myRegistration: str(j.my_registration),
});

export interface VideoPlayback { provider: string; ref: string }
export interface VideoActivityRef { id: number; slug: string; name: string; color: string }

export interface Video {
  id: number; title: string; description: string | null; category: string | null; level: string | null;
  durationMinutes: number | null; thumbnailUrl: string | null; isPaid: boolean; priceCents: number;
  priceLabel: string; locked: boolean; activity: VideoActivityRef | null; playback: VideoPlayback | null;
}
export const parseVideo = (j: J): Video => ({
  id: j.id, title: j.title, description: str(j.description), category: str(j.category), level: str(j.level),
  durationMinutes: int(j.duration_minutes), thumbnailUrl: str(j.thumbnail_url), isPaid: j.is_paid === true,
  priceCents: num(j.price_cents), priceLabel: j.price_label ?? '', locked: j.locked === true,
  activity: isObj(j.activity)
    ? { id: j.activity.id, slug: j.activity.slug ?? '', name: j.activity.name, color: parseHex(j.activity.color) }
    : null,
  playback: isObj(j.playback) ? { provider: j.playback.provider ?? '', ref: j.playback.ref ?? '' } : null,
});

export interface WellnessItem {
  id: number; type: string; title: string; description: string | null; content: string | null;
  mediaUrl: string | null; durationMinutes: number | null; icon: string | null; config: J;
}
export const parseWellness = (j: J): WellnessItem => ({
  id: j.id, type: j.type, title: j.title, description: str(j.description), content: str(j.content),
  mediaUrl: str(j.media_url), durationMinutes: int(j.duration_minutes), icon: str(j.icon),
  config: isObj(j.config) ? j.config : {},
});

export interface MindfulnessPractice { title: string; durationMinutes: number | null; steps: string[] }
export function practicesFromConfig(config: J): MindfulnessPractice[] {
  const raw = config.practices;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isObj)
    .map((p) => ({
      title: p.title ?? '',
      durationMinutes: int(p.duration_minutes),
      steps: Array.isArray(p.steps) ? p.steps.map((e: unknown) => String(e)) : [],
    }))
    .filter((p) => p.title.length > 0);
}

export interface SunDay {
  date: Date; firstLight: Date | null; sunrise: Date | null; solarNoon: Date | null;
  sunset: Date | null; lastLight: Date | null; daylightMinutes: number | null;
}
export const parseSunDay = (j: J): SunDay => ({
  date: parseDate(j.date), firstLight: dtn(j.first_light), sunrise: dtn(j.sunrise), solarNoon: dtn(j.solar_noon),
  sunset: dtn(j.sunset), lastLight: dtn(j.last_light), daylightMinutes: int(j.daylight_minutes),
});
export interface SunInfo { location: string; days: SunDay[] }
export const parseSunInfo = (j: J): SunInfo => ({ location: j.location ?? '', days: list(j.days, parseSunDay) });

export interface GratitudeEntry { id: number; entryDate: Date; body: string }
export const parseGratitude = (j: J): GratitudeEntry => ({ id: j.id, entryDate: parseDate(j.entry_date), body: j.body });

export interface Announcement { id: number; title: string; body: string | null; sentAt: Date | null }
export const parseAnnouncement = (j: J): Announcement => ({ id: j.id, title: j.title, body: str(j.body), sentAt: dtn(j.sent_at) });

export interface Streak { weeks: number; classesThisWeek: number; totalClasses: number }
export const parseStreak = (j: J): Streak => ({
  weeks: num(j.weeks), classesThisWeek: num(j.classes_this_week), totalClasses: num(j.total_classes),
});

export interface HomeData {
  welcomeMessage: string | null; nextBooking: Booking | null; passes: UserPass[]; promotions: Promotion[];
  upcomingEvents: AppEvent[]; bookingToRate: Booking | null; streak: Streak;
}
export const parseHome = (j: J): HomeData => ({
  welcomeMessage: str(j.welcome_message),
  nextBooking: isObj(j.next_booking) ? parseBooking(j.next_booking) : null,
  passes: list(j.passes, parseUserPass), promotions: list(j.promotions, parsePromotion),
  upcomingEvents: list(j.upcoming_events, parseEvent),
  bookingToRate: isObj(j.booking_to_rate) ? parseBooking(j.booking_to_rate) : null,
  streak: parseStreak(isObj(j.streak) ? j.streak : {}),
});

export interface CenterSettings {
  name: string | null; address: string | null; phone: string | null; email: string | null;
  instagram: string | null; website: string | null; cancellationHours: number; bookingOpenDays: number;
  waitlistEnabled: boolean; welcomeMessage: string | null; termsUrl: string | null;
}
const nonEmpty = (v: unknown): string | null => {
  const s = v == null ? '' : String(v).trim();
  return s === '' ? null : s;
};
const intOr = (v: unknown, d: number) => (Number.isFinite(parseInt(String(v), 10)) ? parseInt(String(v), 10) : d);
export const parseSettings = (j: J): CenterSettings => ({
  name: nonEmpty(j.center_name), address: nonEmpty(j.center_address), phone: nonEmpty(j.center_phone),
  email: nonEmpty(j.center_email), instagram: nonEmpty(j.center_instagram), website: nonEmpty(j.center_website),
  cancellationHours: intOr(j.cancellation_hours, 12), bookingOpenDays: intOr(j.booking_open_days, 14),
  waitlistEnabled: String(j.waitlist_enabled) === '1', welcomeMessage: nonEmpty(j.welcome_message),
  termsUrl: nonEmpty(j.terms_url),
});
