import { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useBookings } from '@/api/hooks';
import { Booking, isPaymentPending } from '@/api/models';
import { useStrings, useTheme } from '@/theme';
import { activityTone, Space, withAlpha } from '@/theme/tokens';
import { AppCard, Button, EmptyState, ErrorBox, Loading, Pill, RatingStars, Segmented, SubScreen, Txt } from '@/ui';
import { cancelParamsOf, RateSheet, useCancelBooking } from '../reservar/bookingActions';

export function BookingsScreen() {
  const s = useStrings();
  const router = useRouter();
  const qc = useQueryClient();
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const bookings = useBookings(scope);
  const [rate, setRate] = useState<Booking | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  return (
    <SubScreen
      title={s('my_bookings')}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await qc.invalidateQueries({ queryKey: ['bookings'] });
        setRefreshing(false);
      }}
    >
      <Segmented
        value={scope}
        onChange={setScope}
        options={[{ value: 'upcoming', label: s('bookings_upcoming') }, { value: 'past', label: s('bookings_past') }]}
      />
      <View style={{ height: Space.s3 }} />
      {bookings.isPending ? (
        <Loading />
      ) : bookings.isError ? (
        <ErrorBox error={bookings.error} onRetry={() => void bookings.refetch()} />
      ) : bookings.data.length === 0 ? (
        <EmptyState
          icon="calendar-clear-outline"
          title={s(scope === 'upcoming' ? 'bookings_none_upcoming' : 'bookings_none_past')}
          actionLabel={scope === 'upcoming' ? s('book_a_class') : undefined}
          onAction={() => router.navigate('/reservar')}
        />
      ) : (
        <View style={{ gap: Space.s3 }}>
          {bookings.data.map((b) => (
            <BookingTile key={b.id} booking={b} onRate={() => setRate(b)} />
          ))}
        </View>
      )}
      <RateSheet booking={rate} visible={!!rate} onClose={() => setRate(null)} />
    </SubScreen>
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
        {isPaymentPending(booking) ? <Pill label={s('state_payment_pending')} background={withAlpha(c.warning, 0.18)} foreground={c.isDark ? c.warning : c.ink} icon="time-outline" /> : null}
      </View>
      <Txt variant="body" style={{ marginTop: Space.s1 }}>{`${s.dateLong(session.startsAt)} · ${s.timeRange(session.startsAt, session.endsAt)}`}</Txt>
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
