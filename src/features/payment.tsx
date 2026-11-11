import { PaymentInfo } from '@/api/models';
import { Strings } from '@/i18n';
import { useStrings, useTheme } from '@/theme';
import { withAlpha } from '@/theme/tokens';
import { Pill } from '@/ui';

const STATUS_KEYS: Record<string, string> = {
  paid: 'pay_paid',
  pending: 'state_payment_pending',
  refund_pending: 'pay_refund_pending',
  refunded: 'pay_refunded',
  failed: 'pay_failed',
  cancelled: 'pay_cancelled',
};

/** Texto del cobro: «Pendent de pagar · 12 € · Efectiu». Null si no hay cobro. */
export function paymentText(s: Strings, p: Partial<PaymentInfo>): string | null {
  if (!p.paymentStatus) return null;
  const parts = [s(STATUS_KEYS[p.paymentStatus] ?? 'pay_paid')];
  if (p.paymentAmountCents) parts.push(s.money(p.paymentAmountCents));
  if (p.paymentMethod) parts.push(s(`pay_method_${p.paymentMethod}`));
  return parts.join(' · ');
}

/** Tono del cobro para colorear la etiqueta. */
export const paymentTone = (status?: string): 'ok' | 'warning' | 'muted' =>
  status === 'paid' ? 'ok' : status === 'pending' || status === 'refund_pending' ? 'warning' : 'muted';

/** Etiqueta de color con el estado del cobro; no pinta nada si no hay cobro. */
export function PaymentPill({ info }: { info: Partial<PaymentInfo> }) {
  const s = useStrings();
  const c = useTheme();
  const text = paymentText(s, info);
  if (!text) return null;
  const tone = paymentTone(info.paymentStatus);
  return (
    <Pill
      label={text}
      icon="wallet-outline"
      background={tone === 'warning' ? withAlpha(c.warning, 0.18) : tone === 'ok' ? withAlpha(c.ok, 0.14) : c.surface300}
      foreground={tone === 'ok' ? c.ok : tone === 'warning' ? (c.isDark ? c.warning : c.ink) : c.inkMuted}
    />
  );
}
