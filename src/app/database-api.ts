import { Injectable } from '@angular/core';
import type { Account, Donation, Need, Shelter } from './store';

export interface DatabaseBootstrap {
  accounts: Account[];
  shelters: Shelter[];
  donations: Donation[];
  needs: Need[];
}

@Injectable({ providedIn: 'root' })
export class DatabaseApi {
  private readonly endpoint = `${window.location.protocol}//${window.location.hostname || '127.0.0.1'}:8081/api.php`;

  private async request<T>(action: string, data?: unknown, timeout = 5000): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${this.endpoint}?action=${encodeURIComponent(action)}`, {
        method: data === undefined ? 'GET' : 'POST',
        headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: data === undefined ? undefined : JSON.stringify(data),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({})) as T & { error?: string };
      if (!response.ok) throw new Error(result.error || `Error HTTP ${response.status}`);
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  bootstrap() { return this.request<DatabaseBootstrap>('bootstrap', undefined, 1800); }
  login(email: string, password: string) { return this.request<{ account: Account }>('login', { email, password }); }
  createDonation(donation: Donation) { return this.request<{ ok: boolean }>('createDonation', donation); }
  createNeed(need: Need) { return this.request<{ ok: boolean; id: string }>('createNeed', need); }
  updateNeed(id: string, active: boolean) { return this.request<{ ok: boolean }>('updateNeed', { id, active }); }
  updateDonationStatus(id: string, status: Donation['status']) { return this.request<{ ok: boolean }>('updateDonationStatus', { id, status }); }
  updateShelterStatus(id: string, status: Shelter['status']) { return this.request<{ ok: boolean }>('updateShelterStatus', { id, status }); }
  saveMessage(message: { name: string; email: string; subject: string; message: string }) { return this.request<{ ok: boolean }>('saveMessage', message); }
  updateProfile(account: Account) { return this.request<{ ok: boolean }>('updateProfile', account); }
  changePassword(id: string, currentPassword: string, newPassword: string) {
    return this.request<{ ok: boolean }>('changePassword', { id, currentPassword, newPassword });
  }
}
