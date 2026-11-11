import { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useBookings, useEventRegistrations } from '@/api/hooks';
import { AppEvent, Booking, EventRegistration } from '@/api/models';
import { useStrings, useTheme } from '@/theme';
import { activityTone, Space, withAlpha } from '@/theme/tokens';
import { AppCard, Button, EmptyState, ErrorBox, Loading, Pill, RatingStars, Segmented, SubScreen, Txt } from '@/ui';
import { PaymentPill } from '../payment';
import { EventSheet, eventTypeKey } from '../resum/EventSheet';
import { cancelParamsOf, RateSheet, useCancelBooking } from '../reservar/bookingActions';

export function BookingsScreen() {
  const s = useStrings();
  const router = useRouter();
  const qc = useQueryClient();
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const bookings = useBookings(scope);
  const registrations = useEventRegistrations(scope);
  const [rate, setRate] = useState<Booking | null>(null);
  const [event, setEvent] = useState<AppEvent | null>(null);
  // Clases y actividades/talleres juntos, ordenados por fecha (próximos: los más cercanos primero).
  const items: Item[] = [
    ...(bookings.data ?? []).filter((b) => b.session).map((b): Item => ({ kind: 'class', at: b.session!.startsAt, booking: b })),
    ...(registrations.data ?? []).filter((r) => r.event).map((r): Item => ({ kind: 'event', at: r.event!.startsAt, registration: r })),
  ].sort((a, b) => (scope === 'upcoming' ? a.at.getTime() - b.at.getTime() : b.at.getTime() - a.at.getTime()));
  const pending = bookings.isPending || registrations.isPending;
  const error = bookings.error ?? registrations.error;
  const [refreshing, setRefreshing] = useState(false);

  return (
    <SubScreen
      title={s('my_bookings')}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await Promise.all([qc.invalidateQueries({ queryKey: ['bookings'] }), qc.invalidateQueries({ queryKey: ['event-registrations'] })]);
        setRefreshing(false);
      }}
    >
      <Segmented
        value={scope}
        onChange={setScope}
        options={[{ value: 'upcoming', label: s('bookings_upcoming') }, { value: 'past', label: s('bookings_past') }]}
      />
      <View style={{ height: Space.s3 }} />
      {pending ? (
        <Loading />
      ) : error ? (
        <ErrorBox error={error} onRetry={() => { void bookings.refetch(); void registrations.refetch(); }} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="calendar-clear-outline"
          title={s(scope === 'upcoming' ? 'bookings_none_upcoming' : 'bookings_none_past')}
          actionLabel={scope === 'upcoming' ? s('book_a_class') : undefined}
          onAction={() => router.navigate('/reservar')}
        />
      ) : (
        <View style={{ gap: Space.s3 }}>
          {items.map((i) =>
            i.kind === 'class' ? (
              <BookingTile key={`c${i.booking.id}`} booking={i.booking} onRate={() => setRate(i.booking)} />
            ) : (
              <EventTile key={`e${i.registration.id}`} registration={i.registration} onOpen={() => setEvent(i.registration.event)} />
            ),
          )}
        </View>
      )}
      <RateSheet booking={rate} visible={!!rate} onClose={() => setRate(null)} />
      <EventSheet event={event} onClose={() => setEvent(null)} />
    </SubScreen>
  );
}

type Item =
  | { kind: 'class'; at: Date; booking: Booking }
  | { kind: 'event'; at: Date; registration: EventRegistration };

function EventTile({ registration, onOpen }: { registration: EventRegistration; onOpen: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const e = registration.event;
  if (!e) return null;
  const cancelled = registration.status === 'cancelled';
  const label = cancelled ? s('state_cancelled') : s(registration.status === 'waitlist' ? 'event_status_waitlist' : 'event_status_confirmed');
  return (
    <AppCard onPress={onOpen}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s2 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.violeta }} />
        <Txt variant="titleSmall" style={{ flex: 1 }}>{e.title}</Txt>
        <Pill
          label={label}
          background={cancelled ? c.surface300 : withAlpha(c.ok, 0.14)}
          foreground={cancelled ? c.inkMuted : c.ok}
        />
      </View>
      <Txt variant="small" muted style={{ marginTop: 2 }}>{s(eventTypeKey(e.type))}</Txt>
      <Txt variant="body" style={{ marginTop: Space.s1 }}>{`${s.dateLong(e.startsAt)} · ${e.endsAt ? s.timeRange(e.startsAt, e.endsAt) : s.time(e.startsAt)}`}</Txt>
      {registration.paymentStatus ? <View style={{ marginTop: Space.s2 }}><PaymentPill info={registration} /></View> : null}
    </AppCard>
  );
}

function BookingTile({ booking, onRate }: { booking: Booking; onRate: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const cancel = useCancelBooking();
  const session = booking.session;
  if (!session) return null;
  const tone = activityTone(c, session.activity?.color ?? c.violeta, session.activity?.colorText);
  const cancelled = booking.status === 'cancelled';
  return (
    <AppCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s2 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: tone.base }} />
        <Txt variant="titleSmall" style={{ flex: 1 }}>{session.title}</Txt>
        <Pill
          label={booking.statusLabel}
          background={cancelled ? c.surface300 : withAlpha(c.ok, 0.14)}
          foreground={cancelled ? c.inkMuted : c.ok}
        />
      </View>
      <Txt variant="body" style={{ marginTop: Space.s1 }}>{`${s.dateLong(session.startsAt)} · ${s.timeRange(session.startsAt, session.endsAt)}`}</Txt>
      {booking.paymentStatus && (!cancelled || booking.paymentStatus === 'refund_pending' || booking.paymentStatus === 'refunded') ? <View style={{ marginTop: Space.s2 }}><PaymentPill info={booking} /></View> : null}
      {booking.attendee.type === 'child' ? <Txt variant="small">{s('for_child', { name: booking.attendee.name })}</Txt> : null}
      {cancelled && booking.lateCancellation ? <Txt variant="small" style={{ marginTop: Space.s1 }}>{s('late_cancelled_note')}</Txt> : null}
      {booking.rating != null ? (
        <View style={{ marginTop: Space.s2 }}>
          <RatingStars value={booking.rating} size={22} />
          {booking.ratingComment ? <Txt variant="small">{booking.ratingComment}</Txt> : null}
        </View>
      ) : null}
      {booking.canCancel || booking.canRate ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Space.s2, gap: Space.s2 }}>
          {booking.canRate ? <Button label={s('rate_action')} compact onPress={onRate} /> : null}
          {booking.canCancel ? <Button variant="text" label={s('cancel_booking')} onPress={() => void cancel(cancelParamsOf(booking))} /> : null}
        </View>
      ) : null}
    </AppCard>
  );
}
