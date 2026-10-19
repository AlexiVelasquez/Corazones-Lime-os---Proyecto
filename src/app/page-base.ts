import { Directive, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store, blankDraft, Role } from './store';
import { AccessRules, DonationRules, DonationStatusRules, ProfileRules } from './business-rules';

@Directive()
export class PageBase {
  s = inject(Store);
  router = inject(Router);
  district = 'Todos';
  search = '';
  need = { description: '', category: 'Alimentos no perecibles' };
  contact = { name: '', email: '', subject: 'Consulta general', message: '' };
  profile = { ...this.s.user, notifications: [...(this.s.user?.notifications ?? [true, true, false])] };
  currentPassword = ''; newPassword = ''; repeatPassword = '';
  email = ''; password = ''; loginError = '';
  loginLoading = false;
  showPassword = false;
  filterStatus = 'Todos';
  get filteredDonations() { return this.s.donations.filter(d => this.filterStatus === 'Todos' || d.status === this.filterStatus); }
  go(path: string) { void this.router.navigateByUrl(path); }
  start(shelter = 'esperanza', category = '') { this.s.draft = { ...blankDraft(), shelter, category }; this.s.save(); this.go('/donar'); }
  next(step: number) {
    const d = this.s.draft;
    const category = DonationRules.validateCategory(d.category);
    if (!category.valid) { this.s.notify(category.message); return; }
    if (step === 3) {
      const details = DonationRules.validateDetails(d.description, d.quantity);
      if (!details.valid) { this.s.notify(details.message); return; }
    }
    this.s.save(); this.go('/donar/' + (step === 2 ? 'detalle' : 'entrega'));
  }
  quantity(delta: number) { this.s.draft.quantity = DonationRules.clampQuantity(this.s.draft.quantity + delta); this.s.save(); }
  async confirm() {
    if (!this.s.user) { this.s.save(); void this.router.navigate(['/ingresar'], { queryParams: { returnUrl: '/donar/entrega' } }); return; }
    if (this.s.user.role !== 'donante') { this.s.notify('Ingresa con la cuenta de donante para registrar una donación.'); return; }
    const d = this.s.draft;
    const submission = DonationRules.validateSubmission(d, this.s.approvedShelters.map(shelter => shelter.id));
    if (!submission.valid) { this.s.notify(submission.message); return; }
    const id = 'CL-' + Date.now().toString().slice(-8);
    const donation = { ...d, id, donor: this.s.user.id, donorName: this.s.user.name + ' ' + this.s.user.surname, date: new Date().toISOString().slice(0,10), status: 'Pendiente' as const };
    if (!await this.s.persistDonation(donation)) return;
    this.s.donations.unshift(donation);
    this.s.draft = blankDraft(); this.s.save(); this.s.notify('¡Gracias! Tu donación ' + id + ' fue registrada. Puedes seguirla aquí.'); this.go(this.s.panel);
  }
  async login() {
    this.s.message.set('');
    this.loginError = '';
    if (!ProfileRules.isValidEmail(this.email) || !this.password) {
      this.loginError = 'Ingresa un correo válido y tu contraseña.';
      return;
    }
    if (this.loginLoading) return;
    this.loginLoading = true;
    const authenticated = await this.s.login(this.email.trim(), this.password);
    this.loginLoading = false;
    if (!authenticated) { this.loginError = this.s.message() || 'Correo o contraseña incorrectos.'; return; }
    const dest = new URLSearchParams(location.search).get('returnUrl');
    const safeReturn = this.s.user ? AccessRules.safeReturnUrl(this.s.user.role, dest) : null;
    this.go(safeReturn ?? this.s.panel);
  }
  fill(role: Role) { const a = this.s.accounts.find(a => a.role === role)!; this.email = a.email; this.password = a.password; }
  async publish() {
    if (this.s.user?.role !== 'albergue') return;
    if (this.s.currentShelter?.status !== 'Aprobado') { this.s.notify('Tu albergue debe ser aprobado antes de publicar necesidades.'); return; }
    if (this.need.description.trim().length < 5) { this.s.notify('Describe la necesidad con al menos 5 caracteres.'); return; }
    const need = { ...this.need, description: this.need.description.trim(), id: 'N' + Date.now(), shelter: this.s.user.id, active: true };
    if (!await this.s.persistNeed(need)) return;
    this.s.needs.unshift(need); this.need.description = ''; this.s.save(); this.s.notify('Necesidad publicada. Ya es visible en el directorio.');
  }
  async closeNeed(id: string) { const n = this.s.needs.find(n => n.id === id && n.shelter === this.s.userId); if(n && await this.s.persistNeedStatus(id, false)) { n.active = false; this.s.save(); } }
  async receive(id: string) { const d = this.s.donations.find(d => d.id === id && d.shelter === this.s.userId); if (d && this.s.user?.role === 'albergue') { const next = DonationStatusRules.transition(d.status, 'albergue'); if (next !== d.status && await this.s.persistDonationStatus(id, next)) { d.status = next; this.s.save(); this.s.notify('Recepción confirmada. El donante ya puede ver la entrega.'); } } }
  async dispatch(id: string) { const d = this.s.donations.find(d => d.id === id); if (d && this.s.user?.role === 'admin') { const next = DonationStatusRules.transition(d.status, 'admin'); if (next !== d.status && await this.s.persistDonationStatus(id, next)) { d.status = next; this.s.save(); this.s.notify('Donación asignada a la ruta de entrega.'); } } }
  async approve(id: string, approved: boolean) { const shelter = this.s.shelters.find(a => a.id === id); const status = approved ? 'Aprobado' as const : 'Rechazado' as const; if (shelter && this.s.user?.role === 'admin' && await this.s.persistShelterStatus(id, status)) { shelter.status = status; this.s.save(); this.s.notify(approved ? 'Albergue aprobado y añadido al directorio.' : 'Solicitud rechazada.'); } }
  matches(index: number) { const a = this.s.shelters[index]; return (this.district === 'Todos' || a.district === this.district) && a.name.toLowerCase().includes(this.search.toLowerCase()); }
  async sendContact() { if (!this.contact.name.trim() || !ProfileRules.isValidEmail(this.contact.email) || this.contact.message.trim().length < 10) { this.s.notify('Completa tu nombre, un correo válido y un mensaje de al menos 10 caracteres.'); return; } const message = { ...this.contact }; if (!await this.s.persistMessage(message)) return; this.s.messages.push({ ...message, date: new Date().toISOString() }); this.s.save(); this.contact.message = ''; this.s.notify('Mensaje registrado correctamente.'); }
  async saveProfile() {
    if (!this.s.user || !this.profile.name?.trim() || !ProfileRules.isValidEmail(this.profile.email ?? '') || !ProfileRules.isValidPhone(this.profile.phone ?? '')) { this.s.notify('Revisa tu nombre, correo y teléfono (9 a 15 dígitos).'); return; }
    if (this.s.accounts.some(a => a.id !== this.s.userId && a.email.toLowerCase() === this.profile.email?.toLowerCase())) { this.s.notify('Ese correo ya pertenece a otra cuenta.'); return; }
    const updated = { ...this.s.user, ...this.profile } as typeof this.s.user;
    if (!updated || !await this.s.persistProfile(updated)) return;
    Object.assign(this.s.user, this.profile); this.s.save(); this.s.notify('Perfil y preferencias guardados.');
  }
  async changePassword() { if (!this.s.user) return; const result = ProfileRules.validatePasswordChange(this.currentPassword, this.s.user.password, this.newPassword, this.repeatPassword); if (!result.valid) { this.s.notify(result.message); return; } if (this.s.databaseConnected() && !await this.s.persistPassword(this.currentPassword, this.newPassword)) { this.s.notify('MySQL rechazó el cambio de contraseña.'); return; } this.s.user.password = this.newPassword; this.profile.password = this.newPassword; this.s.save(); this.currentPassword = this.newPassword = this.repeatPassword = ''; this.s.notify('Contraseña actualizada.'); }
  async photo(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 500000) { this.s.notify('Selecciona una imagen JPG, PNG o WebP menor a 500 KB.'); return; } const reader = new FileReader(); reader.onload = () => { this.profile.photo = String(reader.result); this.s.notify('Foto seleccionada. Guarda los cambios para conservarla.'); }; reader.readAsDataURL(file); }
  exportReport() { const rows = [['ID','Fecha','Donante','Albergue','Categoría','Cajas','Estado'], ...this.s.donations.map(d => [d.id,d.date,d.donorName,this.s.shelterName(d.shelter),d.category,String(d.quantity),d.status])]; const csv = rows.map(r => r.map(v => '"' + (/^[=+@-]/.test(v) ? "'" : '') + v.replace(/"/g,'""') + '"').join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'})); const a = document.createElement('a'); a.href = url; a.download = 'donaciones-calidad.csv'; a.click(); URL.revokeObjectURL(url); }
}
