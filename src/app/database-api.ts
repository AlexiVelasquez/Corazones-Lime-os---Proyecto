import { Injectable } from '@angular/core';
import type { Account, Donation, MapLocation, Need, Shelter } from './store';
import type { AdminAccountData, RegistrationData } from './business-rules';

export interface DatabaseBootstrap {
  accounts: Account[];
  shelters: Shelter[];
  collectionPoints: MapLocation[];
  donations: Donation[];
  needs: Need[];
  csrfToken: string;
}

export class DatabaseApiError extends Error {
  constructor(message: string, readonly status: number, readonly code = '') {
    super(message);
    this.name = 'DatabaseApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class DatabaseApi {
  private readonly endpoint = `${window.location.protocol}//${window.location.hostname || '127.0.0.1'}:8081/api.php`;
  private csrfToken = '';

  private async request<T>(action: string, data?: unknown, timeout = 5000, retryCsrf = true): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${this.endpoint}?action=${encodeURIComponent(action)}`, {
        method: data === undefined ? 'GET' : 'POST',
        credentials: 'include',
        headers: data === undefined ? undefined : {
          'Content-Type': 'application/json',
          ...(this.csrfToken ? { 'X-CSRF-Token': this.csrfToken } : {}),
        },
        body: data === undefined ? undefined : JSON.stringify(data),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({})) as T & { error?: string; code?: string };
      if (!response.ok) {
        if (data !== undefined && retryCsrf && result.code === 'CSRF_INVALID') {
          await this.request<DatabaseBootstrap>('bootstrap', undefined, 1800, false);
          return this.request<T>(action, data, timeout, false);
        }
        throw new DatabaseApiError(result.error || `Error HTTP ${response.status}`, response.status, result.code);
      }
      const token = (result as T & { csrfToken?: string }).csrfToken;
      if (token) this.csrfToken = token;
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  bootstrap() { return this.request<DatabaseBootstrap>('bootstrap', undefined, 1800); }
  login(email: string, password: string) { return this.request<{ account: Account; csrfToken: string }>('login', { email, password }); }
  register(registration: RegistrationData) { return this.request<{ account: Account; shelter?: Shelter; csrfToken: string }>('register', registration); }
  createAdmin(registration: AdminAccountData) { return this.request<{ account: Account }>('createAdmin', registration); }
  logout() { return this.request<{ ok: boolean }>('logout', {}); }
  createDonation(donation: Donation) { return this.request<{ ok: boolean }>('createDonation', donation); }
  createNeed(need: Need) { return this.request<{ ok: boolean; id: string }>('createNeed', need); }
  updateNeed(id: string, active: boolean) { return this.request<{ ok: boolean }>('updateNeed', { id, active }); }
  updateDonationStatus(id: string, status: Donation['status']) { return this.request<{ ok: boolean }>('updateDonationStatus', { id, status }); }
  updateShelterStatus(id: string, status: Shelter['status']) { return this.request<{ ok: boolean }>('updateShelterStatus', { id, status }); }
  saveMessage(message: { name: string; email: string; subject: string; message: string }) { return this.request<{ ok: boolean }>('saveMessage', message); }
  updateProfile(account: Account) { return this.request<{ ok: boolean }>('updateProfile', account); }
  changePassword(id: string, currentPassword: string, newPassword: string) {
    return this.request<{ ok: boolean; csrfToken: string }>('changePassword', { id, currentPassword, newPassword });
  }
}
