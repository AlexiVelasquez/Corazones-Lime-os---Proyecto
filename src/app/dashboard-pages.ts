import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardNav } from './pages';
import { PageBase } from './page-base';
import { LocationMapComponent } from './location-map';
import { AdminAccountRules, type AdminAccountData } from './business-rules';

@Component({
  standalone: true,
  imports: [DashboardNav, FormsModule, RouterLink],
  template: `
    <dashboard-nav [base]="s.panel" />
    <main class="dashboard">
      <header class="dash-head">
        <div><span class="eyebrow">Gestión</span><h1>Donaciones</h1><p>{{ subtitle }}</p></div>
        @if (s.user?.role === 'donante') { <a class="btn" routerLink="/donar">+ Nueva donación</a> }
      </header>
      <section class="panel">
        <div class="section-title"><h2>Registro de donaciones</h2><span>{{visibleDonations.length}} resultado(s)</span></div>
        <div class="donation-filters"><label>Buscar por ID<input [(ngModel)]="filterId" placeholder="Ej. CL-1001" autocomplete="off"></label><label>Fecha<input [(ngModel)]="filterDate" type="date"></label><label>Estado<select [(ngModel)]="filterStatus"><option>Todos</option><option>Pendiente</option><option>En tránsito</option><option>Entregado</option></select></label><button class="btn outline small" type="button" (click)="clearFilters()">Limpiar filtros</button></div>
        <div class="table-wrap"><table><thead><tr><th>ID</th><th>Donante</th><th>Artículo</th><th>Destino</th><th>Fecha</th><th>Estado</th><th>Detalle</th><th>Acción</th></tr></thead><tbody>
          @for (d of visibleDonations; track d.id) {
            <tr><td>{{ d.id }}</td><td>{{ d.donorName }}</td><td>{{ d.description }}</td><td>{{ s.shelterName(d.shelter) }}</td><td>{{ d.date }}</td><td><span class="status" [class.done]="d.status === 'Entregado'">{{ d.status }}</span></td><td><button class="table-eye" type="button" (click)="openDonation(d.id)" [attr.aria-label]="'Ver detalle de la donación ' + d.id" title="Ver contenido">👁</button></td><td>
              @if (s.user?.role === 'admin' && d.status === 'Pendiente') { <button class="btn small" (click)="dispatch(d.id)">Asignar ruta</button> }
              @if (s.user?.role === 'albergue' && d.status === 'En tránsito') { <button class="btn small" (click)="receive(d.id)">Confirmar recepción</button> }
            </td></tr>
          } @empty { <tr><td colspan="8"><div class="empty">No hay donaciones para estos filtros.</div></td></tr> }
        </tbody></table></div>
      </section>
    </main>
    @if(selectedDonation; as donation){<div class="review-overlay" role="presentation" (click)="closeDonation()"><section class="review-dialog donation-dialog" role="dialog" aria-modal="true" [attr.aria-label]="'Detalle de donación ' + donation.id" (click)="$event.stopPropagation()"><header><div><span class="eyebrow">Donación {{donation.status}}</span><h2>{{donation.id}}</h2><p>Contenido y datos logísticos registrados.</p></div><button class="review-close" type="button" (click)="closeDonation()" aria-label="Cerrar detalle">✕</button></header><div class="donation-summary"><span class="donation-icon">{{donation.category==='Juguetes'?'🧸':'🥫'}}</span><div><small>{{donation.category}}</small><h3>{{donation.description}}</h3><span>{{donation.quantity}} caja(s) · Estado: {{donation.condition || 'No especificado'}}</span></div></div><div class="review-grid"><div><small>Donante</small><b>{{donation.donorName}}</b></div><div><small>Destino</small><b>{{s.shelterName(donation.shelter)}}</b></div><div><small>Fecha</small><b>{{donation.date}}</b></div><div><small>Método</small><b>{{donation.method==='pickup'?'Recojo a domicilio':'Punto de recojo'}}</b></div><div class="review-wide"><small>Dirección o punto</small><b>{{donation.address || donation.district || 'No especificado'}}</b></div><div class="review-wide"><small>Referencia y horario</small><p>{{donation.reference || 'Sin referencia'}} · {{donation.time || 'Sin horario preferido'}}</p></div></div></section></div>}
  `,
})
export class DashboardDonationsPage extends PageBase {
  filterId = '';
  filterDate = '';
  selectedDonationId = '';
  constructor() { super(); if (!this.s.user) this.go('/ingresar'); }
  get subtitle() { return this.s.user?.role === 'donante' ? 'Consulta el avance de toda tu ayuda sin salir del panel.' : this.s.user?.role === 'albergue' ? 'Revisa y confirma las entregas destinadas a tu albergue.' : 'Supervisa y asigna las donaciones pendientes.'; }
  get visibleDonations() {
    const rows = this.s.user?.role === 'donante' ? this.s.ownDonations : this.s.user?.role === 'albergue' ? this.s.incoming : this.s.donations;
    const id = this.filterId.trim().toLowerCase();
    return rows.filter(d => (this.filterStatus === 'Todos' || d.status === this.filterStatus) && (!id || d.id.toLowerCase().includes(id)) && (!this.filterDate || d.date === this.filterDate));
  }
  get selectedDonation(){return this.s.donations.find(item=>item.id===this.selectedDonationId)??null;}
  openDonation(id:string){this.selectedDonationId=id;}
  closeDonation(){this.selectedDonationId='';}
  clearFilters(){this.filterId='';this.filterDate='';this.filterStatus='Todos';}
}

@Component({
  standalone: true,
  imports: [DashboardNav, RouterLink, LocationMapComponent],
  template: `
    <dashboard-nav [base]="s.panel" />
    <main class="dashboard">
      <header class="dash-head"><div><span class="eyebrow">Red solidaria</span><h1>Albergues</h1><p>Explora los centros aprobados y sus necesidades sin abandonar tu espacio de trabajo.</p></div><a class="btn outline" routerLink="/albergues">Ver directorio público</a></header>
      <div class="cards dashboard-shelters">
        @for (a of s.approvedShelters; track a.id) {
          <article class="card dashboard-shelter-card"><img class="dashboard-shelter-image" [src]="s.shelterImage(a.id)" [alt]="a.name"><div class="dashboard-shelter-body"><span class="location">● {{ a.district }}</span><h2>{{ a.name }}</h2><small class="shelter-address">{{ s.shelterLocation(a.id).address }}</small><div class="needs"><b>Necesidades activas</b>@for (n of needsFor(a.id); track n.id) { <span>{{ n.description }}</span> } @empty { <span>Sin necesidades urgentes publicadas</span> }</div><location-map [latitude]="s.shelterLocation(a.id).latitude" [longitude]="s.shelterLocation(a.id).longitude" [title]="a.name" [address]="s.shelterLocation(a.id).address" [compact]="true"/>
            @if (s.user?.role === 'donante') { <button class="btn full" (click)="start(a.id)">Donar a este albergue</button> }
            @if (s.user?.role === 'albergue' && a.id === s.user?.id) { <span class="own-shelter">Este es tu albergue</span> }
          </div></article>
        }
      </div>
      @if (s.user?.role === 'admin' && s.pendingShelters.length) { <section class="panel pending-strip"><div><b>{{ s.pendingShelters.length }} solicitudes pendientes</b><p>Revísalas desde el panel de control.</p></div><a class="btn" [routerLink]="s.panel">Revisar ahora</a></section> }
    </main>
  `,
})
export class DashboardSheltersPage extends PageBase {
  constructor() { super(); if (!this.s.user) this.go('/ingresar'); }
  needsFor(id: string) { return this.s.needs.filter(n => n.shelter === id && n.active); }
}

@Component({
  standalone: true,
  imports: [DashboardNav, FormsModule],
  template: `
    <dashboard-nav base="/panel/admin" />
    <main class="dashboard">
      <header class="dash-head"><div><span class="eyebrow">Acceso restringido</span><h1>Usuarios administradores</h1><p>Crea cuentas con permisos globales. Esta función solo está disponible para administradores autenticados.</p></div></header>
      <div class="bento admin-users-layout">
        <section class="panel span7"><h2>Crear administrador</h2><p>Registra los datos del responsable. La contraseña inicial podrá cambiarse desde su perfil.</p>
          <form class="form-grid admin-form" (ngSubmit)="createAdmin()">
            <label>Nombres<input [(ngModel)]="form.name" name="adminName" maxlength="100" autocomplete="given-name" required></label>
            <label>Apellidos<input [(ngModel)]="form.surname" name="adminSurname" maxlength="100" autocomplete="family-name" required></label>
            <label class="wide-label">Correo electrónico<input [(ngModel)]="form.email" name="adminEmail" type="email" maxlength="160" autocomplete="email" required></label>
            <label>Teléfono<input [(ngModel)]="form.phone" name="adminPhone" inputmode="tel" maxlength="15" autocomplete="tel" required></label>
            <label>Distrito<select [(ngModel)]="form.district" name="adminDistrict" required><option value="">Selecciona un distrito</option><option>Miraflores</option><option>San Isidro</option><option>Comas</option><option>San Juan de Lurigancho</option><option>Villa El Salvador</option><option>Los Olivos</option><option>San Martín de Porres</option><option>Santiago de Surco</option><option>Lima Cercado</option><option>La Molina</option></select></label>
            <label>Contraseña<div class="password-wrap"><input [(ngModel)]="form.password" name="adminPassword" [type]="showPassword?'text':'password'" autocomplete="new-password" required><button class="eye" type="button" (click)="showPassword=!showPassword" [attr.aria-label]="showPassword?'Ocultar contraseñas':'Ver contraseñas'">{{showPassword?'◉':'◎'}}</button></div></label>
            <label>Repetir contraseña<input [(ngModel)]="form.repeatPassword" name="adminRepeatPassword" [type]="showPassword?'text':'password'" autocomplete="new-password" required></label>
            @if(adminError){<p class="form-error wide-label" role="alert">{{adminError}}</p>}
            <div class="wide-label admin-form-actions"><small>Debe contener al menos 8 caracteres, mayúscula, minúscula y número.</small><button class="btn" type="submit" [disabled]="saving">{{saving?'Creando…':'Crear administrador'}}</button></div>
          </form>
        </section>
        <section class="panel span5"><div class="section-title"><h2>Administradores</h2><span>{{adminAccounts.length}} cuenta(s)</span></div><div class="admin-account-list">@for(account of adminAccounts; track account.id){<article><span class="avatar">{{account.name[0]}}</span><div><b>{{account.name}} {{account.surname}}</b><small>{{account.email}}</small><span>{{account.district}}</span></div>@if(account.id===s.user?.id){<em>Sesión actual</em>}</article>}</div></section>
      </div>
    </main>
  `,
})
export class AdminUsersPage extends PageBase {
  form: AdminAccountData = { name: '', surname: '', email: '', phone: '', district: '', password: '', repeatPassword: '' };
  adminError = '';
  saving = false;
  constructor(){super();if(this.s.user?.role!=='admin')this.go('/ingresar');}
  get adminAccounts(){return this.s.accounts.filter(account=>account.role==='admin');}
  async createAdmin(){
    this.adminError='';
    const validation=AdminAccountRules.validate(this.s.user?.role,this.form);
    if(!validation.valid){this.adminError=validation.message;return;}
    if(this.saving)return;
    this.saving=true;
    const result=await this.s.createAdmin(this.form);
    this.saving=false;
    if(!result.ok){this.adminError=result.message;return;}
    this.form={name:'',surname:'',email:'',phone:'',district:'',password:'',repeatPassword:''};
  }
}
