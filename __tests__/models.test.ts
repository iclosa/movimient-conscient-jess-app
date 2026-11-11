import {
  hasActiveBooking, isPaymentPending, parseBooking, parseHex, parseHome, parseSession, parseSettings, parseSunInfo, parseUser, parseVideo,
  practicesFromConfig, parseDate, toApiDate,
} from '../src/api/models';

describe('modelos', () => {
  test('parseDate usa medianoche local y toApiDate lo revierte', () => {
    const d = parseDate('2026-11-07');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 10, 7, 0]);
    expect(toApiDate(d)).toBe('2026-11-07');
  });

  test('parseHex acepta #RRGGBB y cae al violeta de marca', () => {
    expect(parseHex('#0E7685')).toBe('#0E7685');
    expect(parseHex('rojo')).toBe('#6A3593');
    expect(parseHex(null, '#FFFFFF')).toBe('#FFFFFF');
  });

  test('usuario con hijos', () => {
    const u = parseUser({ id: 1, name: 'Anna Puig', email: 'a@b.cat', locale: 'es', marketing_consent: true, children: [{ id: 3, name: 'Pau', birth_date: '2020-05-01' }] });
    expect(u.children[0].birthDate?.getFullYear()).toBe(2020);
    expect(u.locale).toBe('es');
    expect(u.marketingConsent).toBe(true);
  });

  test('clase con actividad, monitor y mis reservas', () => {
    const s = parseSession({
      id: 9, title: 'Hatha', starts_at: '2026-11-09T18:00:00+01:00', ends_at: '2026-11-09T19:00:00+01:00', is_past: false,
      capacity: 8, spots_left: 3, state: 'booked', price_cents: 1200,
      activity: { id: 2, name: 'Hatha Yoga', slug: 'hatha', color: '#6A3593', color_text: '#FFFFFF', is_family: false },
      instructor: { id: 1, name: 'Jess' }, room: 'Sala 1', my_bookings: [{ id: 5, status: 'confirmed', child_id: null }],
    });
    expect(s.activity?.name).toBe('Hatha Yoga');
    expect(s.myBookings[0].childId).toBeNull();
    expect(s.endsAt.getTime() - s.startsAt.getTime()).toBe(3600_000);
  });

  test('reserva con valoración pendiente', () => {
    const b = parseBooking({ id: 1, status: 'attended', attendee: { type: 'user', name: 'Anna' }, can_rate: true, can_cancel: false });
    expect(b.canRate).toBe(true);
    expect(b.rating).toBeNull();
    expect(b.statusLabel).toBe('attended');
  });

  test('resumen sin datos opcionales no revienta', () => {
    const h = parseHome({});
    expect(h.nextBooking).toBeNull();
    expect(h.passes).toEqual([]);
    expect(h.streak.totalClasses).toBe(0);
  });

  test('vídeo de pago bloqueado', () => {
    const v = parseVideo({ id: 1, title: 'Rutina', is_paid: true, price_cents: 900, price_label: '9 €', locked: true });
    expect(v.locked).toBe(true);
    expect(v.playback).toBeNull();
  });

  test('ajustes del centro: números como texto y vacíos a null', () => {
    const c = parseSettings({ center_name: ' Moviment ', center_phone: '', cancellation_hours: '6', booking_open_days: 'x', waitlist_enabled: '1' });
    expect(c.name).toBe('Moviment');
    expect(c.phone).toBeNull();
    expect(c.cancellationHours).toBe(6);
    expect(c.bookingOpenDays).toBe(14);
    expect(c.waitlistEnabled).toBe(true);
  });

  test('salida del sol', () => {
    const i = parseSunInfo({ location: 'Vallirana', days: [{ date: '2026-11-07', sunrise: '2026-11-07T07:41:00+01:00', daylight_minutes: 573 }] });
    expect(i.days[0].sunrise).toBeInstanceOf(Date);
    expect(i.days[0].sunset).toBeNull();
    expect(i.days[0].daylightMinutes).toBe(573);
  });

  test('prácticas de mindfulness descartan las que no tienen título', () => {
    const p = practicesFromConfig({ practices: [{ title: 'Escaneig', duration_minutes: 5, steps: ['a', 'b'] }, { title: '' }, 'x'] });
    expect(p).toHaveLength(1);
    expect(p[0].steps).toEqual(['a', 'b']);
    expect(practicesFromConfig({})).toEqual([]);
  });

  test('el estado de pago sale del cobro (payment_status) y solo «pending» es pendiente', () => {
    const base = { id: 1, status: 'booked', status_label: 'Reservada', attendee: { type: 'user', name: 'Isaac' } };
    expect(isPaymentPending(parseBooking({ ...base, payment_status: 'pending' }))).toBe(true);
    expect(isPaymentPending(parseBooking({ ...base, payment_status: 'paid' }))).toBe(false);
    expect(isPaymentPending(parseBooking({ ...base, payment_status: 'cancelled' }))).toBe(false);
    expect(isPaymentPending(parseBooking({ ...base, status: 'cancelled', payment_status: 'pending' }))).toBe(false);
  });

  test('no se puede reservar de nuevo si esa persona ya tiene plaza viva en la clase', () => {
    const ref = (status: string, childId: number | null) => ({ id: 1, status, paymentStatus: 'pending', childId });
    const mine = { myBookings: [ref('booked', null), ref('booked', 7), ref('cancelled', 8), ref('waitlist', 9)] };
    expect(hasActiveBooking(mine, null)).toBe(true);   // titular ya reservado
    expect(hasActiveBooking(mine, 7)).toBe(true);      // hijo/a ya reservado/a
    expect(hasActiveBooking(mine, 8)).toBe(false);     // reserva cancelada: puede volver a reservar
    expect(hasActiveBooking(mine, 9)).toBe(true);      // en lista de espera también cuenta
    expect(hasActiveBooking(mine, 10)).toBe(false);
    expect(hasActiveBooking({ myBookings: [] }, null)).toBe(false);
  });
});
