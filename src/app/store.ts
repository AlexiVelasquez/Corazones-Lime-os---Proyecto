import { inject, Injectable, signal } from '@angular/core';
import { DatabaseApi, DatabaseApiError } from './database-api';
import type { RegistrationData } from './business-rules';

export type Role = 'donante' | 'albergue' | 'admin';
export interface Account { id: string; role: Role; name: string; surname: string; email: string; phone: string; district: string; password: string; notifications: boolean[]; photo?: string | null }
export interface Donation { id: string; donor: string; donorName: string; shelter: string; category: string; description: string; quantity: number; condition: string; method: string; district: string; address: string; reference: string; time: string; date: string; status: 'Pendiente' | 'En tránsito' | 'Entregado' }
export interface Need { id: string; shelter: string; description: string; category: string; active: boolean }
export interface Shelter { id: string; name: string; district: string; status: 'Pendiente' | 'Aprobado' | 'Rechazado'; address?: string; description?: string; image?: string | null; latitude?: number | null; longitude?: number | null }
export interface MapLocation { id: string; title: string; district: string; address: string; latitude: number; longitude: number; reference?: string; schedule?: string; label?: string }
export const ROLE_DEFINITIONS: Record<Role, { label: string; description: string; permissions: string[] }> = {
  donante: { label: 'Donante', description: 'Persona que entrega ayuda.', permissions: ['Registrar donaciones', 'Seguir entregas', 'Gestionar su perfil'] },
  albergue: { label: 'Albergue', description: 'Institución receptora validada.', permissions: ['Publicar necesidades', 'Consultar aportes asignados', 'Confirmar recepciones'] },
  admin: { label: 'Administrador', description: 'Responsable de supervisión.', permissions: ['Aprobar albergues', 'Asignar rutas', 'Consultar reportes globales'] },
};
export const ACCOUNTS: Account[] = [
  { id: 'carlos', role: 'donante', name: 'Carlos', surname: 'Mendoza', email: 'donante@calidad.pe', phone: '987654321', district: 'Miraflores', password: 'Demo123!', notifications: [true, true, false] },
  { id: 'esperanza', role: 'albergue', name: 'Hogar de la Esperanza', surname: '', email: 'albergue@calidad.pe', phone: '987654322', district: 'San Juan de Lurigancho', password: 'Demo123!', notifications: [true, true, false] },
  { id: 'patitas', role: 'albergue', name: 'Patitas Felices', surname: '', email: 'patitas@calidad.pe', phone: '987654324', district: 'Villa El Salvador', password: 'Demo123!', notifications: [true, true, false] },
  { id: 'renacer', role: 'albergue', name: 'Renacer - Adulto Mayor', surname: '', email: 'renacer@calidad.pe', phone: '987654325', district: 'Comas', password: 'Demo123!', notifications: [true, true, false] },
  { id: 'admin', role: 'admin', name: 'María', surname: 'García', email: 'admin@calidad.pe', phone: '987654323', district: 'San Isidro', password: 'Demo123!', notifications: [true, true, false] }
];
export const blankDraft = () => ({ category: '', description: '', quantity: 1, condition: 'nuevo', method: 'dropoff', district: '', address: '', reference: '', time: '', shelter: 'esperanza' });
const initialShelters: Shelter[] = [
  { id: 'esperanza', name: 'Hogar de la Esperanza', district: 'San Juan de Lurigancho', status: 'Aprobado', address: 'Av. Los Jardines 450, San Juan de Lurigancho', description: 'Refugio y alimentación para niños y adolescentes.', image: '/assets/images/albergue-esperanza.jpg', latitude: -12.0153, longitude: -77.0063 },
  { id: 'patitas', name: 'Patitas Felices', district: 'Villa El Salvador', status: 'Aprobado', address: 'Av. Central 820, Villa El Salvador', description: 'Rescate y rehabilitación de perros y gatos.', image: '/assets/images/albergue-patitas.jpg', latitude: -12.2137, longitude: -76.9375 },
  { id: 'renacer', name: 'Renacer - Adulto Mayor', district: 'Comas', status: 'Aprobado', address: 'Jr. Primavera 180, Comas', description: 'Cuidado para adultos mayores en situación vulnerable.', image: '/assets/images/albergue-renacer.jpg', latitude: -11.936, longitude: -77.0558 },
  { id: 'sanjose', name: 'Refugio San José', district: 'Los Olivos', status: 'Pendiente', address: 'Av. Universitaria 1550, Los Olivos', latitude: -11.9827, longitude: -77.0715 },
  { id: 'nuevo', name: 'Hogar Esperanza', district: 'San Martín de Porres', status: 'Pendiente', address: 'Jr. Lima 240, San Martín de Porres', latitude: -12.0061, longitude: -77.0838 }
];

export const COLLECTION_POINTS: MapLocation[] = [
  { id: 'PR-1', title: 'Sede Central Miraflores', district: 'Miraflores', address: 'Av. Larco 880, Miraflores', reference: 'A una cuadra del parque Kennedy', schedule: 'Lun-Sáb 09:00-18:00', latitude: -12.121231, longitude: -77.029722, label: 'Miraflores — Sede Central' },
  { id: 'PR-2', title: 'Centro Comunitario San Isidro', district: 'San Isidro', address: 'Av. Arequipa 3200, San Isidro', reference: 'Ingreso por la puerta lateral', schedule: 'Lun-Vie 09:00-17:00', latitude: -12.096526, longitude: -77.035245, label: 'San Isidro — Centro Comunitario' },
  { id: 'PR-3', title: 'Punto Aliado Surco', district: 'Santiago de Surco', address: 'Av. Caminos del Inca 450, Santiago de Surco', reference: 'Frente al centro comercial', schedule: 'Lun-Dom 10:00-19:00', latitude: -12.112412, longitude: -76.991622, label: 'Santiago de Surco — Punto Aliado' },
  { id: 'PR-4', title: 'Punto Aliado Lima Cercado', district: 'Lima Cercado', address: 'Av. Abancay 250, Lima Cercado', reference: 'Módulo de recepción', schedule: 'Lun-Sáb 08:00-16:00', latitude: -12.047531, longitude: -77.02889, label: 'Lima Cercado — Punto Aliado' },
];

const districtCenters: Record<string, { latitude: number; longitude: number }> = {
  Miraflores: { latitude: -12.1219, longitude: -77.03 },
  'San Isidro': { latitude: -12.0973, longitude: -77.0369 },
  Comas: { latitude: -11.936, longitude: -77.0558 },
  'San Juan de Lurigancho': { latitude: -12.0153, longitude: -77.0063 },
  'Villa El Salvador': { latitude: -12.2137, longitude: -76.9375 },
  'Los Olivos': { latitude: -11.9827, longitude: -77.0715 },
  'San Martín de Porres': { latitude: -12.0061, longitude: -77.0838 },
  'Santiago de Surco': { latitude: -12.1124, longitude: -76.9916 },
  'Lima Cercado': { latitude: -12.0475, longitude: -77.0289 },
};

@Injectable({ providedIn: 'root' })
export class Store {
  private readonly api = inject(DatabaseApi);
  readonly message = signal('');
  readonly darkMode = signal(this.read<string>('theme', 'light') === 'dark');
  readonly databaseConnected = signal(false);
  readonly ready: Promise<void>;
  accounts = this.read<Account[]>('accounts', structuredClone(ACCOUNTS));
  userId = this.read<string | null>('session', null);
  shelters = this.read<Shelter[]>('shelters', initialShelters);
  collectionPoints = this.read<MapLocation[]>('collectionPoints', COLLECTION_POINTS);
  donations = this.read<Donation[]>('donations', [
    { ...blankDraft(), id: 'CL-1001', donor: 'carlos', donorName: 'Carlos Mendoza', category: 'Víveres', description: 'Canasta de víveres básicos', quantity: 2, district: 'Comas', date: '2026-09-01', status: 'Entregado' },
    { ...blankDraft(), id: 'CL-1002', donor: 'carlos', donorName: 'Carlos Mendoza', category: 'Juguetes', description: '8 pelotas de fútbol', quantity: 1, district: 'Miraflores', date: '2026-09-09', status: 'En tránsito' }
  ]);
  needs = this.read<Need[]>('needs', [
    { id: 'N1', shelter: 'esperanza', description: '20 pelotas de fútbol', category: 'Juguetes', active: true },
    { id: 'N2', shelter: 'esperanza', description: '50 kg de arroz', category: 'Alimentos no perecibles', active: true }
  ]);
  messages = this.read<{name: string; email: string; subject: string; message: string; date: string}[]>('messages', []);
  draft = this.read('draft', blankDraft());
  constructor() {
    for (const account of ACCOUNTS) {
      if (!this.accounts.some(saved => saved.id === account.id)) this.accounts.push(structuredClone(account));
    }
    this.save();
    this.applyTheme();
    this.ready = this.syncFromDatabase();
  }
  get user() { return this.accounts.find(a => a.id === this.userId); }
  get panel() { return '/panel/' + (this.user?.role ?? 'donante'); }
  get roleDefinition() { return this.user ? ROLE_DEFINITIONS[this.user.role] : null; }
  get currentShelter() { return this.shelters.find(s => s.id === this.userId); }
  get ownDonations() { return this.donations.filter(d => d.donor === this.userId); }
  get incoming() { return this.donations.filter(d => d.shelter === this.userId); }
  get ownNeeds() { return this.needs.filter(n => n.shelter === this.userId && n.active); }
  get pendingShelters() { return this.shelters.filter(s => s.status === 'Pendiente'); }
  get approvedShelters() { return this.shelters.filter(s => s.status === 'Aprobado'); }
  shelterName(id: string) { return this.shelters.find(s => s.id === id)?.name ?? id; }
  shelterLocation(id: string): MapLocation {
    const shelter = this.shelters.find(item => item.id === id) ?? initialShelters.find(item => item.id === id);
    const defaults = initialShelters.find(item => item.id === id);
    const district = shelter?.district ?? defaults?.district ?? 'Lima';
    const center = districtCenters[district] ?? { latitude: -12.0464, longitude: -77.0428 };
    const latitude = Number(shelter?.latitude ?? defaults?.latitude);
    const longitude = Number(shelter?.longitude ?? defaults?.longitude);
    return {
      id,
      title: shelter?.name ?? defaults?.name ?? 'Sede Corazones Limeños',
      district,
      address: shelter?.address || defaults?.address || `${district}, Lima`,
      latitude: Number.isFinite(latitude) ? latitude : center.latitude,
      longitude: Number.isFinite(longitude) ? longitude : center.longitude,
    };
  }
  shelterDescription(id: string) { return this.shelters.find(item => item.id === id)?.description || initialShelters.find(item => item.id === id)?.description || 'Centro solidario verificado por Corazones Limeños.'; }
  shelterImage(id: string) { return this.shelters.find(item => item.id === id)?.image || initialShelters.find(item => item.id === id)?.image || '/assets/images/portada.jpg'; }
  collectionPoint(label: string) { return this.collectionPoints.find(point => point.label === label) ?? null; }
  async login(email: string, password: string) {
    const databaseWasConnected = this.databaseConnected();
    try {
      const { account } = await this.api.login(email, password);
      const saved = this.accounts.find(item => item.id === account.id);
      const complete = { ...account, password };
      if (saved) Object.assign(saved, complete); else this.accounts.push(complete);
      this.userId = account.id;
      this.databaseConnected.set(true);
      this.save();
      await this.syncFromDatabase();
      return true;
    } catch (error) {
      this.databaseConnected.set(false);
      if (error instanceof DatabaseApiError) { this.notify(error.message); return false; }
      if (databaseWasConnected) return false;
    }
    const account = this.accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
    if (!account) return false;
    this.userId = account.id; this.save(); return true;
  }
  async register(registration: RegistrationData): Promise<{ ok: boolean; message: string }> {
    const databaseWasConnected = this.databaseConnected();
    try {
      const result = await this.api.register(registration);
      const account = { ...result.account, password: registration.password };
      const existing = this.accounts.find(item => item.id === account.id);
      if (existing) Object.assign(existing, account); else this.accounts.push(account);
      if (result.shelter && !this.shelters.some(item => item.id === result.shelter!.id)) this.shelters.push(result.shelter);
      this.userId = account.id;
      this.databaseConnected.set(true);
      this.save();
      await this.syncFromDatabase();
      return { ok: true, message: '' };
    } catch (error) {
      if (error instanceof DatabaseApiError) return { ok: false, message: error.message };
      if (databaseWasConnected) return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear la cuenta.' };
    }

    const email = registration.email.trim().toLowerCase();
    if (this.accounts.some(account => account.email.toLowerCase() === email)) return { ok: false, message: 'El correo ya pertenece a otra cuenta.' };
    const id = `${registration.role === 'albergue' ? 'alb' : 'don'}_${Date.now().toString(36)}`;
    const account: Account = {
      id, role: registration.role, name: registration.name.trim(), surname: registration.surname.trim(),
      email, phone: registration.phone.trim(), district: registration.district,
      password: registration.password, notifications: [true, true, false],
    };
    this.accounts.push(account);
    if (registration.role === 'albergue') {
      this.shelters.push({ id, name: registration.shelterName.trim(), district: registration.district, status: 'Pendiente' });
    }
    this.userId = id;
    this.save();
    return { ok: true, message: '' };
  }
  async logout() {
    const closeRemoteSession = this.databaseConnected();
    this.userId = null; this.draft = blankDraft(); this.save();
    if (closeRemoteSession) await this.api.logout().catch(() => undefined);
  }
  toggleTheme() { this.darkMode.update(value => !value); localStorage.setItem('calidad.v1.theme', JSON.stringify(this.darkMode() ? 'dark' : 'light')); this.applyTheme(); }
  private applyTheme() { document.documentElement.classList.toggle('dark', this.darkMode()); }
  save() {
    try {
      for (const [key, value] of Object.entries({ accounts: this.accounts, session: this.userId, shelters: this.shelters, collectionPoints: this.collectionPoints, donations: this.donations, needs: this.needs, messages: this.messages, draft: this.draft })) localStorage.setItem('calidad.v1.' + key, JSON.stringify(value));
    } catch { this.message.set('No se pudo guardar en este navegador. Revisa el espacio disponible.'); }
  }
  private read<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem('calidad.v1.' + key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
  notify(message: string) { this.message.set(message); }
  async syncFromDatabase() {
    try {
      const data = await this.api.bootstrap();
      const localPasswords = new Map(this.accounts.map(account => [account.id, account.password]));
      for (const account of data.accounts) {
        const complete = { ...account, password: localPasswords.get(account.id) ?? '' };
        const saved = this.accounts.find(item => item.id === account.id);
        if (saved) Object.assign(saved, complete); else this.accounts.push(complete);
      }
      if (data.accounts.length === 1) this.userId = data.accounts[0].id;
      else if (this.userId) this.userId = null;
      this.shelters = data.shelters;
      if (data.collectionPoints?.length) this.collectionPoints = data.collectionPoints;
      this.donations = data.donations;
      this.needs = data.needs;
      this.databaseConnected.set(true);
      this.save();
    } catch {
      this.databaseConnected.set(false);
    }
  }
  private async remote(operation: () => Promise<unknown>): Promise<boolean> {
    if (!this.databaseConnected()) return true;
    try {
      await operation();
      return true;
    } catch (error) {
      if (error instanceof DatabaseApiError) {
        if (error.status === 401) {
          this.userId = null;
          this.notify('Tu sesión expiró. Inicia sesión nuevamente.');
        } else {
          this.notify(error.message);
        }
        await this.syncFromDatabase();
      } else {
        this.databaseConnected.set(false);
        this.notify('No se pudo conectar con MySQL. La operación no fue guardada.');
      }
      this.save();
      return false;
    }
  }
  persistDonation(donation: Donation) { return this.remote(() => this.api.createDonation(donation)); }
  persistNeed(need: Need) {
    return this.remote(async () => {
      const result = await this.api.createNeed(need);
      need.id = result.id;
      this.save();
    });
  }
  persistNeedStatus(id: string, active: boolean) { return this.remote(() => this.api.updateNeed(id, active)); }
  persistDonationStatus(id: string, status: Donation['status']) { return this.remote(() => this.api.updateDonationStatus(id, status)); }
  persistShelterStatus(id: string, status: Shelter['status']) { return this.remote(() => this.api.updateShelterStatus(id, status)); }
  persistMessage(message: { name: string; email: string; subject: string; message: string }) { return this.remote(() => this.api.saveMessage(message)); }
  persistProfile(account: Account) { return this.remote(() => this.api.updateProfile(account)); }
  async persistPassword(currentPassword: string, newPassword: string) {
    if (!this.user) return false;
    try {
      await this.api.changePassword(this.user.id, currentPassword, newPassword);
      this.databaseConnected.set(true);
      return true;
    } catch {
      this.databaseConnected.set(false);
      return false;
    }
  }
}
