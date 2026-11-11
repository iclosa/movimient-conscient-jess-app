import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEvents } from '@/api/hooks';
import { AppEvent } from '@/api/models';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { PaymentPill } from '../payment';
import { Space, withAlpha } from '@/theme/tokens';
import { Button, Pill, Sheet, Txt, errorText, useFeedback, IconName } from '@/ui';

export const eventTypeKey = (type: string) =>
  type === 'retir' ? 'event_type_retir' : type === 'esdeveniment' ? 'event_type_esdeveniment' : 'event_type_taller';

function InfoRow({ icon, text }: { icon: IconName; text: string }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: Space.s2, gap: Space.s2 }}>
      <Ionicons name={icon} size={20} color={c.violeta} />
      <Txt variant="bodyLarge" style={{ flex: 1 }}>{text}</Txt>
    </View>
  );
}

export function EventSheet({ event, onClose }: { event: AppEvent | null; onClose: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const { repo } = useSession();
  const { toast, confirm } = useFeedback();
  const qc = useQueryClient();
  const events = useEvents();
  const [busy, setBusy] = useState(false);

  // Datos más recientes del evento (por si cambian con la hoja abierta).
  const e = (event && events.data?.find((x) => x.id === event.id)) || event;

  const toggle = async (ev: AppEvent) => {
    setBusy(true);
    try {
      if (ev.myRegistration == null) {
        const status = await repo.registerForEvent(ev.id);
        toast(s(status === 'waitlist' ? 'event_waitlisted' : 'event_registered'));
      } else {
        onClose();
        await new Promise<void>((r) => setTimeout(r, 450));
        const ok = await confirm({
          title: s('event_cancel_title'),
          confirmLabel: s('event_cancel_confirm'),
          cancelLabel: s('keep_booking'),
          destructive: true,
        });
        if (!ok) return;
        await repo.cancelEventRegistration(ev.id);
        toast(s('event_cancelled'));
      }
      void qc.invalidateQueries({ queryKey: ['events'] });
      void qc.invalidateQueries({ queryKey: ['event-registrations'] });
      void qc.invalidateQueries({ queryKey: ['home'] });
    } catch (err) {
      toast(errorText(err, s));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={!!e} onClose={onClose}>
      {e ? (
        <>
          <Pill label={s(eventTypeKey(e.type))} background={withAlpha(c.violeta, 0.14)} foreground={c.violeta} />
          <Txt variant="title" style={{ marginTop: Space.s2, marginBottom: Space.s3 }}>{e.title}</Txt>
          <InfoRow
            icon="calendar-outline"
            text={`${s.dateLong(e.startsAt)} · ${e.endsAt ? s.timeRange(e.startsAt, e.endsAt) : s.time(e.startsAt)}`}
          />
          {e.location ? <InfoRow icon="location-outline" text={e.location} /> : null}
          {e.priceLabel ? <InfoRow icon="pricetag-outline" text={e.priceLabel} /> : null}
          {e.spotsLeft != null ? (
            <InfoRow icon="people-outline" text={e.spotsLeft <= 0 ? s('event_full') : s('spots_left', { n: e.spotsLeft })} />
          ) : null}
          {e.description ? <Txt variant="bodyLarge" style={{ marginTop: Space.s3 }}>{e.description}</Txt> : null}
          <View style={{ height: Space.s5 }} />
          {e.myRegistration ? (
            <View style={{ marginBottom: Space.s3 }}>
              <Pill
                label={s(e.myRegistration === 'waitlist' ? 'event_status_waitlist' : 'event_status_confirmed')}
                background={withAlpha(c.ok, 0.14)}
                foreground={c.ok}
                icon="checkmark-circle-outline"
              />
            </View>
          ) : null}
          {e.myRegistration && e.paymentStatus ? <View style={{ marginBottom: Space.s3 }}><PaymentPill info={e} /></View> : null}
          {e.myRegistration ? (
            <Button variant="outlined" label={s('event_cancel_action')} onPress={() => toggle(e)} disabled={busy} />
          ) : (
            <Button
              label={s(e.spotsLeft != null && e.spotsLeft <= 0 ? 'event_join_waitlist' : 'event_register')}
              onPress={() => toggle(e)}
              loading={busy}
            />
          )}
          {!e.myRegistration && (e.priceCents ?? 0) > 0 ? (
            <Txt variant="small" style={{ marginTop: Space.s2 }}>{s('event_payment_note', { price: s.money(e.priceCents!) })}</Txt>
          ) : null}
        </>
      ) : null}
    </Sheet>
  );
}
