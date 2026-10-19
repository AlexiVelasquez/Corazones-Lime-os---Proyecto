import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardNav } from './pages';
import { PageBase } from './page-base';
import { LocationMapComponent } from './location-map';

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
        <div class="section-title"><h2>Registro de donaciones</h2><select [(ngModel)]="filterStatus"><option>Todos</option><option>Pendiente</option><option>En tránsito</option><option>Entregado</option></select></div>
        <div class="table-wrap"><table><thead><tr><th>ID</th><th>Donante</th><th>Artículo</th><th>Destino</th><th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>
          @for (d of visibleDonations; track d.id) {
            <tr><td>{{ d.id }}</td><td>{{ d.donorName }}</td><td>{{ d.description }}</td><td>{{ s.shelterName(d.shelter) }}</td><td>{{ d.date }}</td><td><span class="status" [class.done]="d.status === 'Entregado'">{{ d.status }}</span></td><td>
              @if (s.user?.role === 'admin' && d.status === 'Pendiente') { <button class="btn small" (click)="dispatch(d.id)">Asignar ruta</button> }
              @if (s.user?.role === 'albergue' && d.status === 'En tránsito') { <button class="btn small" (click)="receive(d.id)">Confirmar recepción</button> }
            </td></tr>
          } @empty { <tr><td colspan="7"><div class="empty">No hay donaciones para este filtro.</div></td></tr> }
        </tbody></table></div>
      </section>
    </main>
  `,
})
export class DashboardDonationsPage extends PageBase {
  constructor() { super(); if (!this.s.user) this.go('/ingresar'); }
  get subtitle() { return this.s.user?.role === 'donante' ? 'Consulta el avance de toda tu ayuda sin salir del panel.' : this.s.user?.role === 'albergue' ? 'Revisa y confirma las entregas destinadas a tu albergue.' : 'Supervisa y asigna las donaciones pendientes.'; }
  get visibleDonations() {
    const rows = this.s.user?.role === 'donante' ? this.s.ownDonations : this.s.user?.role === 'albergue' ? this.s.incoming : this.s.donations;
    return rows.filter(d => this.filterStatus === 'Todos' || d.status === this.filterStatus);
  }
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
