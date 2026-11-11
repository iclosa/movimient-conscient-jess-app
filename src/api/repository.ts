import { ApiClient } from './client';
import * as M from './models';

const rows = (j: any): any[] => (Array.isArray(j?.data) ? j.data : []);
const obj = (j: any): any => (j?.data && typeof j.data === 'object' ? j.data : {});

/** Acceso tipado a los endpoints de `/api/v1` del backend. */
export class Repository {
  constructor(private api: ApiClient) {}

  // Auth
  async login(email: string, password: string, device = 'app') {
    const j = await this.api.post('auth/login', { email, password, device_name: device });
    return { token: j.token as string, user: M.parseUser(j.user) };
  }

  async register(p: {
    name: string; email: string; password: string; phone?: string; locale: string;
    marketingConsent: boolean; device?: string;
  }) {
    const j = await this.api.post('auth/register', {
      name: p.name,
      email: p.email,
      password: p.password,
      ...(p.phone ? { phone: p.phone } : {}),
      locale: p.locale,
      marketing_consent: p.marketingConsent,
      device_name: p.device ?? 'app',
    });
    return { token: j.token as string, user: M.parseUser(j.user) };
  }

  logout() { return this.api.post('auth/logout'); }

  // Perfil
  async me() { return M.parseUser(obj(await this.api.get('me'))); }
  async updateMe(body: Record<string, unknown>) { return M.parseUser(obj(await this.api.patch('me', body))); }
  updatePassword(current: string, password: string, confirmation: string) {
    return this.api.put('me/password', { current_password: current, password, password_confirmation: confirmation });
  }
  deleteAccount(password: string) { return this.api.delete('me', { password }); }
  async addChild(name: string, birthDate: Date | null) {
    return M.parseChild(obj(await this.api.post('me/children', { name, ...(birthDate ? { birth_date: M.toApiDate(birthDate) } : {}) })));
  }
  async updateChild(id: number, name: string, birthDate: Date | null) {
    return M.parseChild(obj(await this.api.patch(`me/children/${id}`, { name, birth_date: birthDate ? M.toApiDate(birthDate) : null })));
  }
  deleteChild(id: number) { return this.api.delete(`me/children/${id}`); }
  async streak() { return M.parseStreak(obj(await this.api.get('me/streak'))); }

  // Resumen
  async home() { return M.parseHome(obj(await this.api.get('home'))); }

  // Reservas
  async activities() { return rows(await this.api.get('activities')).map(M.parseActivity); }
  async sessions(from: Date, to: Date, activityId?: number) {
    const j = await this.api.get('sessions', { from: M.toApiDate(from), to: M.toApiDate(to), activity_id: activityId });
    return rows(j).map(M.parseSession);
  }
  async book(sessionId: number, childId?: number | null) {
    const j = await this.api.post('bookings', { class_session_id: sessionId, ...(childId != null ? { child_id: childId } : {}) });
    return M.parseBooking(obj(j));
  }
  async cancelBooking(id: number) { return M.parseBooking(obj(await this.api.delete(`bookings/${id}`))); }
  /** scope: upcoming | past | all */
  async bookings(scope: string) { return rows(await this.api.get('bookings', { scope })).map(M.parseBooking); }
  async rate(bookingId: number, rating: number, comment?: string) {
    const c = comment?.trim();
    return M.parseBooking(obj(await this.api.post(`bookings/${bookingId}/rating`, { rating, ...(c ? { comment: c } : {}) })));
  }

  // Bonos
  async passCatalogue() { return rows(await this.api.get('passes')).map(M.parsePass); }
  async myPasses() { return rows(await this.api.get('me/passes')).map(M.parseUserPass); }
  async purchasePass(id: number): Promise<string> { return obj(await this.api.post(`passes/${id}/purchase`)).message ?? ''; }

  // Vídeos
  async videos() { return rows(await this.api.get('videos')).map(M.parseVideo); }
  async video(id: number) { return M.parseVideo(obj(await this.api.get(`videos/${id}`))); }
  /** Devuelve la URL de pago si el backend ya la ofrece; si no, null (solicitud registrada). */
  async purchaseVideo(id: number): Promise<string | null> { return obj(await this.api.post(`videos/${id}/purchase`)).checkout_url ?? null; }

  // Contenido
  async settings() { return M.parseSettings(obj(await this.api.get('settings'))); }
  async promotions() { return rows(await this.api.get('promotions')).map(M.parsePromotion); }
  async events() { return rows(await this.api.get('events')).map(M.parseEvent); }
  async registerForEvent(id: number): Promise<string> { return obj(await this.api.post(`events/${id}/registration`)).status ?? 'confirmed'; }
  cancelEventRegistration(id: number) { return this.api.delete(`events/${id}/registration`); }
  async announcements() { return rows(await this.api.get('announcements')).map(M.parseAnnouncement); }
  async markAnnouncementRead(id: number) { await this.api.post(`announcements/${id}/read`); }
  async markAllAnnouncementsRead() { await this.api.post('announcements/read-all'); }

  // Més (benestar)
  async wellness() { return rows(await this.api.get('wellness')).map(M.parseWellness); }
  async sunrise(days = 7) { return M.parseSunInfo(obj(await this.api.get('wellness/sunrise', { days }))); }
  async gratitude() { return rows(await this.api.get('gratitude')).map(M.parseGratitude); }
  async addGratitude(body: string) { return M.parseGratitude(obj(await this.api.post('gratitude', { body }))); }
  async updateGratitude(id: number, body: string) { return M.parseGratitude(obj(await this.api.patch(`gratitude/${id}`, { body }))); }
  deleteGratitude(id: number) { return this.api.delete(`gratitude/${id}`); }
}
