import { Directive, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store, blankDraft, Role } from './store';

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
  showPassword = false;
  filterStatus = 'Todos';
  get filteredDonations() { return this.s.donations.filter(d => this.filterStatus === 'Todos' || d.status === this.filterStatus); }
  go(path: string) { void this.router.navigateByUrl(path); }
  start(shelter = 'esperanza', category = '') { this.s.draft = { ...blankDraft(), shelter, category }; this.s.save(); this.go('/donar'); }
  next(step: number) {
    const d = this.s.draft;
    if (!d.category) { this.s.notify('Selecciona Juguetes o Víveres para continuar.'); return; }
    if (step === 3 && (d.description.trim().length < 5 || !Number.isInteger(d.quantity) || d.quantity < 1 || d.quantity > 1000)) { this.s.notify('Describe tus artículos (mínimo 5 caracteres) e indica entre 1 y 1000 cajas.'); return; }
    this.s.save(); this.go('/donar/' + (step === 2 ? 'detalle' : 'entrega'));
  }
  quantity(delta: number) { this.s.draft.quantity = Math.max(1, Math.min(1000, this.s.draft.quantity + delta)); this.s.save(); }
  confirm() {
    if (!this.s.user) { this.s.save(); void this.router.navigate(['/ingresar'], { queryParams: { returnUrl: '/donar/entrega' } }); return; }
    if (this.s.user.role !== 'donante') { this.s.notify('Ingresa con la cuenta de donante para registrar una donación.'); return; }
    const d = this.s.draft;
    if (!d.category || d.description.trim().length < 5) { this.go('/donar'); return; }
    if (d.method === 'dropoff' ? !d.district : d.address.trim().length < 8 || !d.time) { this.s.notify(d.method === 'dropoff' ? 'Selecciona un punto de recojo.' : 'Completa la dirección y el horario de recojo.'); return; }
    if (!this.s.approvedShelters.some(s => s.id === d.shelter)) { this.s.notify('Selecciona un albergue aprobado.'); return; }
    const id = 'CL-' + Date.now().toString().slice(-8);
    this.s.donations.unshift({ ...d, id, donor: this.s.user.id, donorName: this.s.user.name + ' ' + this.s.user.surname, date: new Date().toISOString().slice(0,10), status: 'Pendiente' });
    this.s.draft = blankDraft(); this.s.save(); this.s.notify('¡Gracias! Tu donación ' + id + ' fue registrada. Puedes seguirla aquí.'); this.go(this.s.panel);
  }
  login() {
    if (!this.s.login(this.email, this.password)) { this.loginError = 'Correo o contraseña incorrectos.'; return; }
    const dest = new URLSearchParams(location.search).get('returnUrl');
    this.go(dest === '/donar/entrega' && this.s.user?.role === 'donante' ? dest : this.s.panel);
  }
  fill(role: Role) { const a = this.s.accounts.find(a => a.role === role)!; this.email = a.email; this.password = a.password; }
  publish() {
    if (this.s.user?.role !== 'albergue') return;
    if (this.need.description.trim().length < 5) { this.s.notify('Describe la necesidad con al menos 5 caracteres.'); return; }
    this.s.needs.unshift({ ...this.need, description: this.need.description.trim(), id: 'N' + Date.now(), shelter: this.s.user.id, active: true }); this.need.description = ''; this.s.save(); this.s.notify('Necesidad publicada. Ya es visible en el directorio.');
  }
  closeNeed(id: string) { const n = this.s.needs.find(n => n.id === id && n.shelter === this.s.userId); if(n) { n.active = false; this.s.save(); } }
  receive(id: string) { const d = this.s.donations.find(d => d.id === id && d.shelter === this.s.userId); if (d && this.s.user?.role === 'albergue' && d.status !== 'Entregado') { d.status = 'Entregado'; this.s.save(); this.s.notify('Recepción confirmada. El donante ya puede ver la entrega.'); } }
  dispatch(id: string) { const d = this.s.donations.find(d => d.id === id); if (d && this.s.user?.role === 'admin' && d.status === 'Pendiente') { d.status = 'En tránsito'; this.s.save(); this.s.notify('Donación asignada a la ruta de entrega.'); } }
  approve(id: string, approved: boolean) { const shelter = this.s.shelters.find(a => a.id === id); if (shelter && this.s.user?.role === 'admin') { shelter.status = approved ? 'Aprobado' : 'Rechazado'; this.s.save(); this.s.notify(approved ? 'Albergue aprobado y añadido al directorio.' : 'Solicitud rechazada.'); } }
  matches(index: number) { const a = this.s.shelters[index]; return (this.district === 'Todos' || a.district === this.district) && a.name.toLowerCase().includes(this.search.toLowerCase()); }
  sendContact() { if (!this.contact.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.contact.email) || this.contact.message.trim().length < 10) { this.s.notify('Completa tu nombre, un correo válido y un mensaje de al menos 10 caracteres.'); return; } this.s.messages.push({ ...this.contact, date: new Date().toISOString() }); this.s.save(); this.contact.message = ''; this.s.notify('Mensaje guardado en la bandeja local de demostración. No se ha enviado un correo.'); }
  saveProfile() {
    if (!this.s.user || !this.profile.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.profile.email ?? '') || !/^\+?[\d\s]{9,15}$/.test(this.profile.phone ?? '')) { this.s.notify('Revisa tu nombre, correo y teléfono (9 a 15 dígitos).'); return; }
    if (this.s.accounts.some(a => a.id !== this.s.userId && a.email.toLowerCase() === this.profile.email?.toLowerCase())) { this.s.notify('Ese correo ya pertenece a otra cuenta.'); return; }
    Object.assign(this.s.user, this.profile); this.s.save(); this.s.notify('Perfil y preferencias guardados.');
  }
  changePassword() { if (!this.s.user || this.currentPassword !== this.s.user.password) { this.s.notify('La contraseña actual no es correcta.'); return; } if (this.newPassword.length < 8 || this.newPassword !== this.repeatPassword) { this.s.notify('Usa al menos 8 caracteres y repite la nueva contraseña.'); return; } this.s.user.password = this.newPassword; this.profile.password = this.newPassword; this.s.save(); this.currentPassword = this.newPassword = this.repeatPassword = ''; this.s.notify('Contraseña de demostración actualizada.'); }
  async photo(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 500000) { this.s.notify('Selecciona una imagen JPG, PNG o WebP menor a 500 KB.'); return; } const reader = new FileReader(); reader.onload = () => { this.profile.photo = String(reader.result); this.s.notify('Foto seleccionada. Guarda los cambios para conservarla.'); }; reader.readAsDataURL(file); }
  get mapUrl() { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((this.s.draft.district || 'Miraflores') + ', Lima, Perú'); }
  exportReport() { const rows = [['ID','Fecha','Donante','Albergue','Categoría','Cajas','Estado'], ...this.s.donations.map(d => [d.id,d.date,d.donorName,this.s.shelterName(d.shelter),d.category,String(d.quantity),d.status])]; const csv = rows.map(r => r.map(v => '"' + (/^[=+@-]/.test(v) ? "'" : '') + v.replace(/"/g,'""') + '"').join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'})); const a = document.createElement('a'); a.href = url; a.download = 'donaciones-calidad.csv'; a.click(); URL.revokeObjectURL(url); }
}
