import { inject, Injectable, signal } from '@angular/core';
import { DatabaseApi, DatabaseApiError } from './database-api';
import type { RegistrationData } from './business-rules';

export type Role = 'donante' | 'albergue' | 'admin';
export interface Account { id: string; role: Role; name: string; surname: string; email: string; phone: string; district: string; password: string; notifications: boolean[]; photo?: string | null }
export interface Donation { id: string; donor: string; donorName: string; shelter: string; category: string; description: string; quantity: number; condition: string; method: string; district: string; address: string; reference: string; time: string; date: string; status: 'Pendiente' | 'En tránsito' | 'Entregado' }
export interface Need { id: string; shelter: string; description: string; category: string; active: boolean }
export interface Shelter { id: string; name: string; district: string; status: 'Pendiente' | 'Aprobado' | 'Rechazado' }
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
  { id: 'esperanza', name: 'Hogar de la Esperanza', district: 'San Juan de Lurigancho', status: 'Aprobado' },
  { id: 'patitas', name: 'Patitas Felices', district: 'Villa El Salvador', status: 'Aprobado' },
  { id: 'renacer', name: 'Renacer - Adulto Mayor', district: 'Comas', status: 'Aprobado' },
  { id: 'sanjose', name: 'Refugio San José', district: 'Los Olivos', status: 'Pendiente' },
  { id: 'nuevo', name: 'Hogar Esperanza', district: 'San Martín de Porres', status: 'Pendiente' }
];

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
      if (error instanceof DatabaseApiError) return false;
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
  logout() { void this.api.logout(); this.userId = null; this.draft = blankDraft(); this.save(); }
  toggleTheme() { this.darkMode.update(value => !value); localStorage.setItem('calidad.v1.theme', JSON.stringify(this.darkMode() ? 'dark' : 'light')); this.applyTheme(); }
  private applyTheme() { document.documentElement.classList.toggle('dark', this.darkMode()); }
  save() {
    try {
      for (const [key, value] of Object.entries({ accounts: this.accounts, session: this.userId, shelters: this.shelters, donations: this.donations, needs: this.needs, messages: this.messages, draft: this.draft })) localStorage.setItem('calidad.v1.' + key, JSON.stringify(value));
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
      this.donations = data.donations;
      this.needs = data.needs;
      this.databaseConnected.set(true);
      this.save();
    } catch {
      this.databaseConnected.set(false);
    }
  }
  private async remote(operation: () => Promise<unknown>) {
    try { await operation(); this.databaseConnected.set(true); }
    catch { this.databaseConnected.set(false); }
  }
  persistDonation(donation: Donation) { void this.remote(() => this.api.createDonation(donation)); }
  persistNeed(need: Need) {
    void this.remote(async () => {
      const result = await this.api.createNeed(need);
      const local = this.needs.find(item => item.id === need.id);
      if (local) local.id = result.id;
      this.save();
    });
  }
  persistNeedStatus(id: string, active: boolean) { void this.remote(() => this.api.updateNeed(id, active)); }
  persistDonationStatus(id: string, status: Donation['status']) { void this.remote(() => this.api.updateDonationStatus(id, status)); }
  persistShelterStatus(id: string, status: Shelter['status']) { void this.remote(() => this.api.updateShelterStatus(id, status)); }
  persistMessage(message: { name: string; email: string; subject: string; message: string }) { void this.remote(() => this.api.saveMessage(message)); }
  persistProfile(account: Account) { void this.remote(() => this.api.updateProfile(account)); }
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
