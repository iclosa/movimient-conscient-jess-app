/**
 * @jest-environment node
 *
 * Prueba de integración contra el backend real. Solo se ejecuta con LIVE_API_URL, p. ej.:
 *   LIVE_API_URL=http://127.0.0.1:8000 npx jest __tests__/live.test.ts
 */
import { ApiClient, ApiError } from '../src/api/client';
import { Repository } from '../src/api/repository';

const URL_ = process.env.LIVE_API_URL;
const d = URL_ ? describe : describe.skip;

d('API real', () => {
  let token: string | null = null;
  const repo = new Repository(new ApiClient({ readToken: () => token, baseUrl: URL_ }));
  const email = `rn-${Date.now()}@test.cat`;

  test('registro y /me', async () => {
    const r = await repo.register({ name: 'Anna Prova', email, password: 'secret-1234', locale: 'ca', marketingConsent: false });
    token = r.token;
    expect(r.user.email).toBe(email);
    const me = await repo.me();
    expect(me.name).toBe('Anna Prova');
  });

  test('login con credenciales erróneas da ApiError 4xx', async () => {
    const err = await repo.login(email, 'mala-clau').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect([401, 422]).toContain(err.status);
  });

  test('actividades, ajustes, promociones, eventos y avisos', async () => {
    const acts = await repo.activities();
    expect(acts.length).toBeGreaterThan(0);
    expect(acts[0].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    const cfg = await repo.settings();
    expect(cfg.bookingOpenDays).toBeGreaterThan(0);
    await repo.promotions();
    await repo.events();
    await repo.announcements();
  });

  test('clases de las próximas 2 semanas y resumen', async () => {
    const from = new Date();
    const to = new Date(Date.now() + 13 * 86400000);
    const sessions = await repo.sessions(from, to);
    console.log(`clases: ${sessions.length}`);
    for (const s of sessions) {
      expect(s.endsAt.getTime()).toBeGreaterThan(s.startsAt.getTime());
      expect(['available', 'full', 'booked', 'waitlist', 'cancelled']).toContain(s.state);
    }
    const home = await repo.home();
    expect(home.streak.totalClasses).toBe(0);
    expect(home.nextBooking).toBeNull();
  });

  test('bonos y vídeos', async () => {
    const cat = await repo.passCatalogue();
    expect(cat.length).toBeGreaterThan(0);
    expect(await repo.myPasses()).toEqual([]);
    const vids = await repo.videos();
    console.log(`vídeos: ${vids.length}, de pago: ${vids.filter((v) => v.isPaid).length}`);
    for (const v of vids.filter((x) => x.isPaid)) expect(v.locked).toBe(true);
    if (vids[0]) expect((await repo.video(vids[0].id)).id).toBe(vids[0].id);
  });

  test('Més: herramientas, salida del sol y diario de gratitud', async () => {
    const items = await repo.wellness();
    const types = items.map((i) => i.type);
    console.log(`herramientas: ${types.join(', ')}`);
    expect(types).toEqual(expect.arrayContaining(['mindfulness', 'sunrise', 'breathing', 'meditation_timer', 'gratitude']));
    const sun = await repo.sunrise(7);
    expect(sun.days).toHaveLength(7);
    expect(sun.days[0].sunrise).toBeInstanceOf(Date);
    expect(sun.days[0].sunset!.getTime()).toBeGreaterThan(sun.days[0].sunrise!.getTime());
    const g = await repo.addGratitude('Per la pau d\'aquest matí');
    expect((await repo.gratitude()).map((x) => x.id)).toContain(g.id);
    const u = await repo.updateGratitude(g.id, 'Editat');
    expect(u.body).toBe('Editat');
    await repo.deleteGratitude(g.id);
    expect((await repo.gratitude()).map((x) => x.id)).not.toContain(g.id);
  });

  test('perfil: hijos, edición y contraseña', async () => {
    const ch = await repo.addChild('Pau', new Date(2020, 4, 1));
    expect(ch.birthDate?.getFullYear()).toBe(2020);
    expect((await repo.me()).children).toHaveLength(1);
    const renamed = await repo.updateChild(ch.id, 'Pau Jr', null);
    expect(renamed.name).toBe('Pau Jr');
    await repo.deleteChild(ch.id);
    const me = await repo.updateMe({ locale: 'es', phone: '600000000' });
    expect(me.locale).toBe('es');
    await repo.updatePassword('secret-1234', 'nova-clau-5678', 'nova-clau-5678');
    const again = await repo.login(email, 'nova-clau-5678');
    expect(again.user.email).toBe(email);
  });

  test('reservar una clase pide bono o se confirma; luego cancelar', async () => {
    const sessions = await repo.sessions(new Date(), new Date(Date.now() + 13 * 86400000));
    const open = sessions.find((s) => !s.isPast && s.state === 'available' && !s.activity?.isFamily);
    if (!open) return console.log('sin clases disponibles para reservar');
    try {
      const b = await repo.book(open.id);
      console.log(`reserva: ${b.status}`);
      expect(b.session?.id).toBe(open.id);
      const cancelled = await repo.cancelBooking(b.id);
      expect(cancelled.status).toBe('cancelled');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      console.log(`reserva rechazada: ${(e as ApiError).code} - ${(e as ApiError).message}`);
      expect((e as ApiError).code).toBeTruthy();
    }
  });

  test('sin token: 401', async () => {
    const anon = new Repository(new ApiClient({ readToken: () => null, baseUrl: URL_ }));
    const err = await anon.home().catch((e) => e);
    expect(err.status).toBe(401);
  });

  test('cerrar sesión', async () => {
    await repo.logout();
  });
});
