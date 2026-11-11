import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAnnouncements, useBookings, useEvents, useHome, useSessions } from '@/api/hooks';
import { AppEvent, Booking, ClassSession, firstName, isPaymentPending, HomeData, Promotion, Streak, UserPass } from '@/api/models';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { activityTone, legibleOnSoft, fonts, Radii, Space, withAlpha, cardShadow, hexToRgb } from '@/theme/tokens';
import {
  AppCard, Button, EmptyState, ErrorBox, HScroll, Loading, LogoMark, Pill, RatingStars, Screen, SectionHeader, Txt, IconName,
} from '@/ui';
import { useCancelBooking, cancelParamsOf, RateSheet, useQuickBook } from '../reservar/bookingActions';
import { SessionSheet } from '../reservar/SessionSheet';
import { EventSheet, eventTypeKey } from './EventSheet';

export const promoTypeKey = (type: string) =>
  type === 'taller' ? 'promo_type_taller' : type === 'avis' ? 'promo_type_avis' : 'promo_type_promo';

/** Texto oscuro o blanco según la luminosidad del fondo. */
export function readableOn(bg: string): string {
  const [r, g, b] = hexToRgb(bg).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? '#17141C' : '#FFFFFF';
}

export function ResumScreen() {
  const s = useStrings();
  const qc = useQueryClient();
  const home = useHome();
  const { user } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([qc.invalidateQueries({ queryKey: ['home'] }), qc.invalidateQueries({ queryKey: ['events'] }), qc.invalidateQueries({ queryKey: ['bookings'] }), qc.invalidateQueries({ queryKey: ['sessions'] })]);
    setRefreshing(false);
  };

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Header name={user ? firstName(user) : undefined} welcome={home.data?.welcomeMessage ?? undefined} />
      {home.isPending ? (
        <Loading />
      ) : home.isError ? (
        <ErrorBox error={home.error} onRetry={() => void home.refetch()} />
      ) : (
        <HomeContent data={home.data} />
      )}
      <Txt variant="caption" center style={{ marginTop: Space.s5 }}>{s('app_footer')}</Txt>
    </Screen>
  );
}

function Header({ name, welcome }: { name?: string; welcome?: string }) {
  const s = useStrings();
  const c = useTheme();
  const router = useRouter();
  const count = useAnnouncements().data?.length ?? 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: Space.s2 }}>
      <LogoMark size={48} />
      <View style={{ flex: 1, marginLeft: Space.s3 }}>
        <Txt variant="titleMedium">{name ? s('hello_name', { name }) : s('hello')}</Txt>
        {welcome ? <Txt variant="small" numberOfLines={2}>{welcome}</Txt> : null}
      </View>
      <Pressable
        onPress={() => router.push('/avisos')}
        accessibilityRole="button"
        accessibilityLabel={count > 0 ? `${s('announcements_title')}: ${count}` : s('announcements_title')}
        style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="notifications-outline" size={26} color={c.ink} />
        {count > 0 ? (
          <View
            style={{
              position: 'absolute', top: 4, right: 2, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10,
              alignItems: 'center', justifyContent: 'center', backgroundColor: c.error,
            }}
          >
            <Txt color="#FFFFFF" style={{ fontFamily: fonts.sansBold, fontSize: 11, lineHeight: 14, includeFontPadding: false }}>{count > 99 ? '99+' : String(count)}</Txt>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function HomeContent({ data }: { data: HomeData }) {
  const s = useStrings();
  const router = useRouter();
  const events = useEvents();
  const bookings = useBookings('upcoming');
  const [session, setSession] = useState<ClassSession | null>(null);
  // «Properament»: las siguientes clases de la persona (tras la próxima) y los eventos, por fecha.
  const upcoming: Upcoming[] = [
    ...(events.data ?? data.upcomingEvents).map((e): Upcoming => ({ kind: 'event', at: e.startsAt, event: e })),
    ...(bookings.data ?? [])
      .filter((b) => b.session && b.id !== data.nextBooking?.id && (b.status === 'booked' || b.status === 'waitlist'))
      .map((b): Upcoming => ({ kind: 'class', at: b.session!.startsAt, booking: b })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  // Próximas clases con plaza, para reservar rápido (las que ya tienes reservadas no salen).
  const quickBook = useQuickBook();
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextSessions = useSessions(from, new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6));
  const quick = (nextSessions.data ?? [])
    .filter((x) => !x.isPast && x.startsAt > now && x.myBookings.length === 0 && !['booked', 'waitlist', 'cancelled', 'full'].includes(x.state))
    .slice(0, 3);
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [rate, setRate] = useState<{ booking: Booking; initial: number } | null>(null);

  return (
    <View>
      {data.streak.totalClasses > 0 ? <View style={{ marginTop: Space.s3 }}><StreakBanner streak={data.streak} /></View> : null}
      <SectionHeader title={s('next_class')} />
      {data.nextBooking ? <NextClassCard booking={data.nextBooking} /> : <NoNextClass />}
      {data.bookingToRate ? (
        <>
          <SectionHeader title={s('previous_booking')} />
          <RateCard booking={data.bookingToRate} onRate={(v) => setRate({ booking: data.bookingToRate!, initial: v })} />
        </>
      ) : null}
      {upcoming.length > 0 || quick.length > 0 ? (
        <>
          <SectionHeader title={s('coming_soon')} />
          <View style={{ gap: Space.s3 }}>
            {upcoming.slice(0, 5).map((u) =>
              u.kind === 'event' ? (
                <EventTile key={`e${u.event.id}`} event={u.event} onPress={() => setEvent(u.event)} />
              ) : (
                <ClassTile key={`c${u.booking.id}`} booking={u.booking} onPress={() => setSession(u.booking.session)} />
              ),
            )}
          </View>
          {quick.length > 0 ? (
            <View style={{ marginTop: upcoming.length > 0 ? Space.s4 : 0, gap: Space.s3 }}>
              {upcoming.length > 0 ? <Txt variant="label" muted>{s('quick_book_title')}</Txt> : null}
              {quick.map((x) => (
                <QuickClassTile
                  key={`q${x.id}`}
                  session={x}
                  onOpen={() => setSession(x)}
                  onBook={() => (x.activity?.isFamily ? setSession(x) : void quickBook(x))}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : null}
      <EventSheet event={event} onClose={() => setEvent(null)} />
      <SessionSheet session={session} onClose={() => setSession(null)} />
      <RateSheet booking={rate?.booking ?? null} initial={rate?.initial ?? 0} visible={!!rate} onClose={() => setRate(null)} />
    </View>
  );
}

function StreakBanner({ streak }: { streak: Streak }) {
  const s = useStrings();
  const c = useTheme();
  const hot = streak.weeks > 0;
  const flame = c.isDark ? '#FFA45C' : '#E8590C';
  const text = hot ? s('streak_weeks', { n: streak.weeks }) : s('streak_this_week', { n: streak.classesThisWeek });
  return (
    <View
      accessible
      accessibilityLabel={`${text}. ${s('streak_total', { n: streak.totalClasses })}`}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: Space.s3, padding: Space.s3, borderRadius: Radii.lg,
        backgroundColor: withAlpha(hot ? flame : c.turquesa, 0.14), borderWidth: 1, borderColor: withAlpha(hot ? flame : c.turquesa, 0.35),
      }}
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(hot ? flame : c.turquesa, 0.18) }}>
        <Ionicons name={hot ? 'flame' : 'flame-outline'} size={30} color={hot ? flame : c.turquesa} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="titleSmall" color={hot ? flame : c.turquesa}>{text}</Txt>
        <Txt variant="small">{s('streak_total', { n: streak.totalClasses })}</Txt>
      </View>
    </View>
  );
}

function NoNextClass() {
  const s = useStrings();
  const router = useRouter();
  return (
    <AppCard>
      <EmptyState
        icon="calendar-outline"
        title={s('no_next_class')}
        body={s('no_next_class_body')}
        actionLabel={s('book_a_class')}
        onAction={() => router.navigate('/reservar')}
      />
    </AppCard>
  );
}

function OnRow({ icon, color, text }: { icon: IconName; color: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Space.s2, marginBottom: Space.s1 }}>
      <Ionicons name={icon} size={20} color={color} />
      <Txt variant="bodyLarge" color={color} style={{ flex: 1, fontFamily: fonts.sansSemi }}>{text}</Txt>
    </View>
  );
}

function NextClassCard({ booking: b }: { booking: Booking }) {
  const s = useStrings();
  const c = useTheme();
  const cancel = useCancelBooking();
  const [busy, setBusy] = useState(false);
  const session = b.session;
  if (!session) return null;
  const tone = activityTone(c, session.activity?.color ?? c.violeta, session.activity?.colorText);
  const on = tone.onBase;

  return (
    <View
      accessible
      accessibilityLabel={`${s('next_class')}: ${session.title}, ${s.dateLong(session.startsAt)} ${s.time(session.startsAt)}`}
      style={[{ padding: Space.s5, backgroundColor: tone.base, borderRadius: Radii.lg }, cardShadow(c)]}
    >
      <Txt variant="title" color={on}>{session.title}</Txt>
      <View style={{ height: Space.s3 }} />
      <OnRow icon="time-outline" color={on} text={`${s.relativeDay(session.startsAt)} · ${s.timeRange(session.startsAt, session.endsAt)}`} />
      {session.instructor ? <OnRow icon="person-outline" color={on} text={session.instructor.name} /> : null}
      {session.room ? <OnRow icon="location-outline" color={on} text={session.room} /> : null}
      {b.attendee.type === 'child' ? <OnRow icon="happy-outline" color={on} text={s('for_child', { name: b.attendee.name })} /> : null}
      {isPaymentPending(b) ? <OnRow icon="wallet-outline" color={on} text={s('state_payment_pending')} /> : null}
      {b.canCancel ? (
        <View>
          <Txt variant="small" color={on} style={{ marginTop: Space.s2, opacity: 0.9 }}>
            {b.isFreeCancellation && b.freeCancellationUntil
              ? s('free_cancel_until', { when: `${s.relativeDay(b.freeCancellationUntil)} ${s.time(b.freeCancellationUntil)}` })
              : s('late_cancel_warning')}
          </Txt>
          <Button
            variant="outlined"
            color={on}
            label={s('cancel_booking')}
            disabled={busy}
            style={{ marginTop: Space.s3 }}
            onPress={async () => {
              setBusy(true);
              await cancel(cancelParamsOf(b));
              setBusy(false);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

export function PromotionCard({ promotion: p, width }: { promotion: Promotion; width?: number }) {
  const s = useStrings();
  const on = readableOn(p.color);
  return (
    <View style={{ width, minHeight: 190, padding: Space.s4, borderRadius: Radii.lg, backgroundColor: p.color }}>
      <Pill label={s(promoTypeKey(p.type))} background={withAlpha(on, 0.18)} foreground={on} />
      <Txt variant="titleSmall" color={on} style={{ marginTop: Space.s2 }}>{p.title}</Txt>
      {p.body ? <Txt variant="body" color={on} style={{ marginTop: Space.s1 }}>{p.body}</Txt> : null}
      <View style={{ flex: 1, minHeight: Space.s2 }} />
      {p.endsAt ? <Txt variant="small" color={on} style={{ opacity: 0.85 }}>{s('promo_until', { date: s.dateShort(p.endsAt) })}</Txt> : null}
      {p.ctaUrl && p.ctaLabel ? (
        <Button
          label={p.ctaLabel}
          color={on}
          onColor={p.color}
          compact
          style={{ marginTop: Space.s2 }}
          onPress={() => void Linking.openURL(p.ctaUrl!).catch(() => {})}
        />
      ) : null}
    </View>
  );
}

type Upcoming = { kind: 'event'; at: Date; event: AppEvent } | { kind: 'class'; at: Date; booking: Booking };

function ClassTile({ booking: b, onPress }: { booking: Booking; onPress: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const session = b.session;
  if (!session) return null;
  const tone = activityTone(c, session.activity?.color ?? c.violeta, session.activity?.colorText);
  return (
    <AppCard onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 58, paddingVertical: Space.s2, alignItems: 'center', borderRadius: Radii.md, backgroundColor: tone.base }}>
          <Txt color={tone.onBase} style={{ fontFamily: fonts.displayExtra, fontSize: 24, lineHeight: 28 }}>{s.dayNumber(session.startsAt)}</Txt>
          <Txt variant="caption" color={tone.onBase}>{s.dateShort(session.startsAt).replace(/\d+\s*/g, '')}</Txt>
        </View>
        <View style={{ flex: 1, marginHorizontal: Space.s3 }}>
          <Txt variant="titleSmall">{session.title}</Txt>
          <Txt variant="small" style={{ marginTop: 2 }}>{`${s.timeRange(session.startsAt, session.endsAt)}${session.instructor ? ` · ${session.instructor.name}` : ''}`}</Txt>
          {b.attendee.type === 'child' ? <Txt variant="small">{s('for_child', { name: b.attendee.name })}</Txt> : null}
          {b.status === 'waitlist' || isPaymentPending(b) ? (
            <View style={{ marginTop: Space.s1 }}>
              <Pill
                label={s(b.status === 'waitlist' ? 'state_waitlist' : 'state_payment_pending')}
                background={withAlpha(c.warning, 0.18)}
                foreground={c.isDark ? c.warning : c.ink}
              />
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={22} color={c.inkMuted} />
      </View>
    </AppCard>
  );
}

function QuickClassTile({ session, onOpen, onBook }: { session: ClassSession; onOpen: () => void; onBook: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const tone = activityTone(c, session.activity?.color ?? c.violeta, session.activity?.colorText);
  return (
    <AppCard onPress={onOpen}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 58, paddingVertical: Space.s2, alignItems: 'center', borderRadius: Radii.md, backgroundColor: withAlpha(tone.base, 0.18) }}>
          <Txt color={legibleOnSoft(c, tone.base)} style={{ fontFamily: fonts.displayExtra, fontSize: 24, lineHeight: 28 }}>{s.dayNumber(session.startsAt)}</Txt>
          <Txt variant="caption" color={legibleOnSoft(c, tone.base)}>{s.dateShort(session.startsAt).replace(/\d+\s*/g, '')}</Txt>
        </View>
        <View style={{ flex: 1, marginHorizontal: Space.s3 }}>
          <Txt variant="titleSmall">{session.title}</Txt>
          <Txt variant="small" style={{ marginTop: 2 }}>{`${s.relativeDay(session.startsAt)} · ${s.time(session.startsAt)}`}</Txt>
          <Txt variant="small" color={c.turquesa}>{s('spots_left_short', { n: session.spotsLeft })}</Txt>
        </View>
        <Button compact label={s('quick_book_btn')} onPress={onBook} />
      </View>
    </AppCard>
  );
}

function EventTile({ event, onPress }: { event: AppEvent; onPress: () => void }) {
  const s = useStrings();
  const c = useTheme();
  return (
    <AppCard onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 58, paddingVertical: Space.s2, alignItems: 'center', borderRadius: Radii.md, backgroundColor: withAlpha(c.violeta, 0.14) }}>
          <Txt color={c.violeta} style={{ fontFamily: fonts.displayExtra, fontSize: 24, lineHeight: 28 }}>{s.dayNumber(event.startsAt)}</Txt>
          <Txt variant="caption" color={c.violeta}>{s.dateShort(event.startsAt).replace(/\d+\s*/g, '')}</Txt>
        </View>
        <View style={{ flex: 1, marginHorizontal: Space.s3 }}>
          <Txt variant="titleSmall">{event.title}</Txt>
          <Txt variant="small" style={{ marginTop: 2 }}>{`${s(eventTypeKey(event.type))} · ${s.time(event.startsAt)}`}</Txt>
          {event.myRegistration ? (
            <View style={{ marginTop: Space.s1 }}>
              <Pill
                label={s(event.myRegistration === 'waitlist' ? 'event_status_waitlist' : 'event_status_confirmed')}
                background={withAlpha(c.ok, 0.14)}
                foreground={c.ok}
              />
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={22} color={c.inkMuted} />
      </View>
    </AppCard>
  );
}

function RateCard({ booking, onRate }: { booking: Booking; onRate: (v: number) => void }) {
  const s = useStrings();
  const c = useTheme();
  const session = booking.session;
  if (!session) return null;
  const tone = activityTone(c, session.activity?.color ?? c.violeta, session.activity?.colorText);
  return (
    <AppCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s2 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: tone.base }} />
        <Txt variant="titleMedium" style={{ flex: 1 }}>{session.title}</Txt>
      </View>
      <Txt variant="small" style={{ marginTop: 2 }}>{`${s.dateLong(session.startsAt)} · ${s.time(session.startsAt)}`}</Txt>
      <Txt variant="bodyLarge" style={{ marginTop: Space.s3 }}>{s('rate_prompt')}</Txt>
      <View style={{ alignItems: 'center' }}>
        <RatingStars value={0} onChange={onRate} />
      </View>
    </AppCard>
  );
}
