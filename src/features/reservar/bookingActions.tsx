import { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Booking, ClassSession, isPaymentPending } from '@/api/models';
import { useSession } from '@/session';
import { useStrings } from '@/theme';
import { Space } from '@/theme/tokens';
import { Button, Field, RatingStars, Sheet, Txt, errorText, useFeedback } from '@/ui';

/** Vuelve a pedir todo lo que depende de las reservas. */
export function useInvalidateBookingData() {
  const qc = useQueryClient();
  return () => {
    for (const k of ['home', 'sessions', 'bookings', 'my-passes', 'streak']) void qc.invalidateQueries({ queryKey: [k] });
  };
}

/** Pide confirmación y cancela la reserva. Devuelve true si se ha cancelado. */
export function useCancelBooking() {
  const s = useStrings();
  const { repo } = useSession();
  const { confirm, toast } = useFeedback();
  const invalidate = useInvalidateBookingData();

  return async (p: { id: number; title: string; status: string; isFree: boolean }): Promise<boolean> => {
    const body = p.status === 'waitlist' ? s('cancel_waitlist_body') : p.isFree ? s('cancel_free_body') : s('cancel_late_body');
    const ok = await confirm({
      title: s('cancel_booking_title', { title: p.title }),
      body,
      confirmLabel: s('cancel_booking_confirm'),
      cancelLabel: s('keep_booking'),
      destructive: true,
    });
    if (!ok) return false;
    try {
      await repo.cancelBooking(p.id);
      invalidate();
      toast(s('booking_cancelled'));
      return true;
    } catch (e) {
      toast(errorText(e, s));
      return false;
    }
  };
}

export const cancelParamsOf = (b: Booking) => ({
  id: b.id,
  title: b.session?.title ?? '',
  status: b.status,
  isFree: b.isFreeCancellation,
});

/** Hoja para valorar una clase ya hecha (1–5 estrellas y comentario opcional). */
export function RateSheet({
  booking, initial = 0, visible, onClose,
}: { booking: Booking | null; initial?: number; visible: boolean; onClose: () => void }) {
  const s = useStrings();
  const { repo } = useSession();
  const { toast } = useFeedback();
  const invalidate = useInvalidateBookingData();
  const [rating, setRating] = useState(initial);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  // Reinicia al abrir con otra valoración inicial.
  const [seen, setSeen] = useState({ visible: false, initial: 0 });
  if (visible && (!seen.visible || seen.initial !== initial)) {
    setSeen({ visible: true, initial });
    setRating(initial);
    setComment('');
  } else if (!visible && seen.visible) {
    setSeen({ visible: false, initial: seen.initial });
  }

  const send = async () => {
    if (!booking) return;
    if (rating < 1) return toast(s('rate_pick_stars'));
    setSending(true);
    try {
      await repo.rate(booking.id, rating, comment);
      invalidate();
      onClose();
      toast(s('rate_thanks'));
    } catch (e) {
      toast(errorText(e, s));
    } finally {
      setSending(false);
    }
  };

  const session = booking?.session;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt variant="titleMedium">{s('rate_title')}</Txt>
      {session ? <Txt variant="small" style={{ marginTop: Space.s1 }}>{`${session.title} · ${s.dateLong(session.startsAt)}`}</Txt> : null}
      <View style={{ alignItems: 'center', marginVertical: Space.s3 }}>
        <RatingStars value={rating} onChange={setRating} size={40} />
      </View>
      <Field label={s('rate_comment')} value={comment} onChangeText={setComment} multiline maxLength={1000} autoCapitalize="sentences" />
      <Button label={s('rate_send')} onPress={send} loading={sending} style={{ marginTop: Space.s4 }} />
    </Sheet>
  );
}

/** Reserva rápida desde una tarjeta (sin hoja): pide confirmación, reserva y avisa. */
export function useQuickBook() {
  const s = useStrings();
  const { repo } = useSession();
  const { confirm, toast } = useFeedback();
  const invalidate = useInvalidateBookingData();

  return async (session: ClassSession): Promise<boolean> => {
    const ok = await confirm({
      title: s('book_confirm_title', { title: session.title }),
      body: `${s.dateLong(session.startsAt)} · ${s.timeRange(session.startsAt, session.endsAt)}`,
      confirmLabel: s('book_confirm_yes'),
      cancelLabel: s('book_confirm_back'),
    });
    if (!ok) return false;
    try {
      const booking = await repo.book(session.id, null);
      invalidate();
      toast(s(booking.status === 'waitlist' ? 'booked_waitlist' : isPaymentPending(booking) ? 'booked_pending' : 'booked_ok'));
      return true;
    } catch (e) {
      toast(errorText(e, s));
      return false;
    }
  };
}
