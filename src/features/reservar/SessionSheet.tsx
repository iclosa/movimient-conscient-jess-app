import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMyPasses, useSessions, useSettings } from '@/api/hooks';
import { ApiError } from '@/api/client';
import { ClassSession, MyBookingRef, firstName, isPaymentPending } from '@/api/models';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { activityTone, legibleOnSoft, Space, withAlpha } from '@/theme/tokens';
import { Button, Chip, IconName, Pill, Sheet, Txt, errorText, useFeedback } from '@/ui';
import { useCancelBooking, useInvalidateBookingData } from './bookingActions';

const dayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function Row({ icon, text }: { icon: IconName; text: string }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Space.s2, marginBottom: Space.s2 }}>
      <Ionicons name={icon} size={20} color={c.violeta} />
      <Txt variant="bodyLarge" style={{ flex: 1 }}>{text}</Txt>
    </View>
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function SessionSheet({ session: initial, onClose }: { session: ClassSession | null; onClose: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const router = useRouter();
  const { repo, user } = useSession();
  const { toast, confirm } = useFeedback();
  const invalidate = useInvalidateBookingData();
  const cancel = useCancelBooking();
  const settings = useSettings().data;
  const passes = useMyPasses();
  const day = initial ? dayOf(initial.startsAt) : dayOf(new Date());
  // Datos más recientes de la clase (por si cambian con la hoja abierta).
  const fresh = useSessions(day, day).data?.find((x) => x.id === initial?.id);
  const [childId, setChildId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const session = fresh ?? initial;

  const book = async () => {
    if (!session) return;
    // Confirmación: el diálogo no puede abrirse encima de la hoja, así que se cierra antes.
    const kid = childId != null ? (user?.children ?? []).find((k) => k.id === childId) : null;
    const lines = [
      `${s.dateLong(session.startsAt)} · ${s.timeRange(session.startsAt, session.endsAt)}`,
      kid ? s('book_confirm_for', { who: kid.name }) : null,
      session.state === 'full' ? s('book_confirm_full') : null,
      passes.data && !passes.data.some((p) => p.usable) && session.state !== 'full' ? s('book_confirm_nopass') : null,
    ].filter(Boolean);
    onClose();
    await sleep(450);
    const ok = await confirm({
      title: s('book_confirm_title', { title: session.title }),
      body: lines.join('\n\n'),
      confirmLabel: s('book_confirm_yes'),
      cancelLabel: s('book_confirm_back'),
    });
    if (!ok) return;
    setBusy(true);
    try {
      const booking = await repo.book(session.id, childId);
      invalidate();
      toast(s(booking.status === 'waitlist' ? 'booked_waitlist' : isPaymentPending(booking) ? 'booked_pending' : 'booked_ok'));
    } catch (e) {
      if (e instanceof ApiError && e.code === 'pass_required') {
        // iOS no puede abrir el diálogo encima de la hoja: se cierra la hoja y luego se pregunta.
        setBusy(false);
        await sleep(100);
        const go = await confirm({ title: s('pass_required_title'), body: e.message, confirmLabel: s('see_passes'), cancelLabel: s('close') });
        if (go) router.push('/bons');
      } else {
        toast(errorText(e, s));
      }
    } finally {
      setBusy(false);
    }
  };

  const children = user?.children ?? [];
  const content = (() => {
    if (!session) return null;
    const activity = session.activity;
    const tone = activityTone(c, activity?.color ?? c.violeta, activity?.colorText);
    const canBook = !session.isPast && session.state !== 'cancelled';
    const full = session.spotsLeft <= 0;
    const waitlistOn = settings?.waitlistEnabled ?? true;
    const cancelHours = settings?.cancellationHours ?? 12;
    const isFreeCancel = Date.now() < session.startsAt.getTime() - cancelHours * 3600_000;
    const attendeeName = (b: MyBookingRef) =>
      b.childId == null ? (user ? firstName(user) : s('me')) : children.find((ch) => ch.id === b.childId)?.name ?? s('child');
    const activeRefs = session.myBookings.filter((b) => b.status !== 'cancelled' && b.status !== 'attended');
    const legible = legibleOnSoft(c, tone.base);

    return (
      <>
        {activity ? <Pill label={activity.name} background={tone.soft} foreground={legible} /> : null}
        <Txt variant="title" style={{ marginTop: Space.s2 }}>{session.title}</Txt>
        {activity?.tagline ? <Txt variant="body" muted style={{ marginTop: 2 }}>{activity.tagline}</Txt> : null}
        <View style={{ height: Space.s3 }} />
        <Row icon="time-outline" text={`${s.dateLong(session.startsAt)} · ${s.timeRange(session.startsAt, session.endsAt)}`} />
        {session.instructor ? <Row icon="person-outline" text={session.instructor.name} /> : null}
        {session.room ? <Row icon="location-outline" text={session.room} /> : null}
        {session.priceCents ? <Row icon="pricetag-outline" text={s('price_single_class', { price: s.money(session.priceCents) })} /> : null}
        <Row icon="people-outline" text={full ? s('class_full') : s('spots_left', { n: session.spotsLeft })} />
        {activity?.description ? <Txt variant="body" style={{ marginTop: Space.s2 }}>{activity.description}</Txt> : null}

        {activeRefs.length > 0 ? (
          <View style={{ marginTop: Space.s4 }}>
            <Txt variant="titleSmall">{s('your_booking')}</Txt>
            {activeRefs.map((b) => (
              <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: Space.s2, gap: Space.s2 }}>
                <View style={{ flex: 1 }}>
                  <Pill
                    label={`${attendeeName(b)} · ${s(b.status === 'waitlist' ? 'state_waitlist' : isPaymentPending(b) ? 'state_payment_pending' : 'state_booked')}`}
                    background={withAlpha(c.ok, 0.14)}
                    foreground={c.ok}
                    icon="checkmark-circle-outline"
                  />
                </View>
                <Button
                  variant="text"
                  label={s('cancel_booking')}
                  disabled={busy || session.isPast}
                  onPress={async () => {
                    onClose();
                    await sleep(450);
                    await cancel({ id: b.id, title: session.title, status: b.status, isFree: isFreeCancel });
                  }}
                />
              </View>
            ))}
          </View>
        ) : null}

        {canBook ? (
          <View>
            {activity?.isFamily ? (
              <View style={{ marginTop: Space.s4 }}>
                <Txt variant="titleSmall">{s('who_attends')}</Txt>
                {children.length === 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Space.s2 }}>
                    <Txt variant="small" style={{ flex: 1 }}>{s('family_no_children')}</Txt>
                    <Button variant="text" label={s('add_child')} onPress={() => { onClose(); router.push('/fills'); }} />
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.s2, marginTop: Space.s2 }}>
                    <Chip label={user ? firstName(user) : s('me')} selected={childId == null} onPress={() => setChildId(null)} />
                    {children.map((ch) => (
                      <Chip key={ch.id} label={ch.name} selected={childId === ch.id} onPress={() => setChildId(ch.id)} />
                    ))}
                  </View>
                )}
              </View>
            ) : null}
            <Button
              label={s(full ? (waitlistOn ? 'join_waitlist' : 'class_full') : 'book_now')}
              onPress={book}
              loading={busy}
              disabled={full && !waitlistOn}
              style={{ marginTop: Space.s4 }}
            />
            {full && waitlistOn ? <Txt variant="small" style={{ marginTop: Space.s2 }}>{s('waitlist_hint')}</Txt> : null}
          </View>
        ) : session.isPast ? (
          <View style={{ marginTop: Space.s4 }}><Pill label={s('state_past')} icon="time-outline" /></View>
        ) : null}
      </>
    );
  })();

  return (
    <Sheet visible={!!initial} onClose={onClose}>
      {content}
    </Sheet>
  );
}
