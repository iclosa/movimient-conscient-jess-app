import { ApiClient, ApiError } from '../src/api/client';
import { Repository } from '../src/api/repository';

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) }) as unknown as Response;

function setup(fetchImpl: jest.Mock, token: string | null = 'tok', onUnauthorized = jest.fn()) {
  const client = new ApiClient({ readToken: () => token, onUnauthorized, baseUrl: 'http://x.test', fetchImpl: fetchImpl as any });
  return { repo: new Repository(client), onUnauthorized };
}

describe('cliente de la API', () => {
  test('envía el token Bearer y los parámetros en la URL', async () => {
    const f = jest.fn().mockResolvedValue(json(200, { data: [] }));
    const { repo } = setup(f);
    await repo.sessions(new Date(2026, 10, 7), new Date(2026, 10, 20), 4);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('http://x.test/api/v1/sessions?from=2026-11-07&to=2026-11-20&activity_id=4');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.method).toBe('GET');
  });

  test('no envía Authorization sin token y omite parámetros vacíos', async () => {
    const f = jest.fn().mockResolvedValue(json(200, { data: [] }));
    const { repo } = setup(f, null);
    await repo.sessions(new Date(2026, 0, 1), new Date(2026, 0, 2));
    expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(f.mock.calls[0][0]).not.toContain('activity_id');
  });

  test('login devuelve token y usuario', async () => {
    const f = jest.fn().mockResolvedValue(json(200, { token: 'abc', user: { id: 1, name: 'A', email: 'a@b.c' } }));
    const { repo } = setup(f, null);
    const r = await repo.login('a@b.c', 'secret');
    expect(r.token).toBe('abc');
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ email: 'a@b.c', password: 'secret', device_name: 'app' });
  });

  test('errores de validación llegan como fieldErrors', async () => {
    const f = jest.fn().mockResolvedValue(json(422, { message: 'Dades no vàlides', errors: { email: ['Ja existeix'] } }));
    const { repo } = setup(f);
    const err = await repo.updateMe({ email: 'x' }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.firstError('email')).toBe('Ja existeix');
    expect(err.firstError('name')).toBeUndefined();
  });

  test('código funcional pass_required', async () => {
    const f = jest.fn().mockResolvedValue(json(422, { message: 'Necessites un bo', code: 'pass_required' }));
    const { repo } = setup(f);
    const err = await repo.book(1).catch((e) => e);
    expect(err.code).toBe('pass_required');
    expect(err.message).toBe('Necessites un bo');
  });

  test('401 avisa para cerrar sesión', async () => {
    const f = jest.fn().mockResolvedValue(json(401, { message: 'No autenticat' }));
    const { repo, onUnauthorized } = setup(f);
    const err = await repo.me().catch((e) => e);
    expect(err.isUnauthorized).toBe(true);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test('sin red: ApiError con isNetwork', async () => {
    const f = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    const { repo } = setup(f);
    const err = await repo.home().catch((e) => e);
    expect(err.isNetwork).toBe(true);
  });

  test('respuesta no JSON con error 500', async () => {
    const f = jest.fn().mockResolvedValue({ ok: false, status: 500, text: async () => '<html>' } as unknown as Response);
    const { repo } = setup(f);
    const err = await repo.home().catch((e) => e);
    expect(err.status).toBe(500);
    expect(err.message).toContain('500');
  });

  test('reservar para un hijo y valorar con comentario', async () => {
    const f = jest.fn().mockResolvedValue(json(200, { data: { id: 7, status: 'confirmed', attendee: { type: 'child', name: 'Pau' } } }));
    const { repo } = setup(f);
    await repo.book(3, 11);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ class_session_id: 3, child_id: 11 });
    await repo.rate(7, 5, '  Genial  ');
    expect(f.mock.calls[1][0]).toBe('http://x.test/api/v1/bookings/7/rating');
    expect(JSON.parse(f.mock.calls[1][1].body)).toEqual({ rating: 5, comment: 'Genial' });
    await repo.rate(7, 4, '   ');
    expect(JSON.parse(f.mock.calls[2][1].body)).toEqual({ rating: 4 });
  });
});
