import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardNav } from './pages';
import { PageBase } from './page-base';

@Component({
  standalone: true,
  imports: [DashboardNav, FormsModule, CommonModule],
  template: `
    <dashboard-nav [base]="s.panel" />
    <main class="dashboard">
      <header class="dash-head"><div><span class="eyebrow">Mi cuenta</span><h1>Perfil y configuración</h1><p>Gestiona tus datos, preferencias y seguridad.</p></div><button (click)="go(s.panel)">← Volver al panel</button></header>
      <div class="profile-grid"><div>
        <section class="panel profile-card"><div class="profile-photo">@if(profile.photo){<img [src]="profile.photo" alt="Foto de perfil">}@else{<span>{{profile.name?.[0]}}</span>}<label class="btn outline small">Cambiar foto<input type="file" accept="image/png,image/jpeg,image/webp" (change)="photo($event)" hidden></label></div>
          <form class="form-grid" (ngSubmit)="saveProfile()"><label>Nombre<input [(ngModel)]="profile.name" name="name"></label><label>Apellidos<input [(ngModel)]="profile.surname" name="surname"></label><label class="wide-label">Correo electrónico<input [(ngModel)]="profile.email" name="email" type="email"></label><label>Teléfono<input [(ngModel)]="profile.phone" name="phone"></label><label>Distrito<select [(ngModel)]="profile.district" name="district"><option>Miraflores</option><option>San Isidro</option><option>Comas</option><option>San Juan de Lurigancho</option><option>Villa El Salvador</option></select></label><button class="btn">Guardar cambios</button></form>
        </section>
        <section class="panel"><h2>Preferencias de notificación</h2>@for(label of ['Actualizaciones de impacto','Nuevas campañas','Resumen mensual'];track label;let i=$index){<label class="check"><input type="checkbox" [(ngModel)]="profile.notifications[i]"><span><b>{{label}}</b><small>{{i===0?'Noticias sobre el destino de tus donaciones.':i===1?'Nuevas oportunidades para ayudar.':'Tu actividad e impacto del mes.'}}</small></span></label>}<button class="btn small" (click)="saveProfile()">Guardar preferencias</button></section>
      </div><aside>
        <section class="panel security"><h2>Seguridad</h2>
          <label for="current-password">Contraseña actual</label><div class="password-wrap"><input id="current-password" [(ngModel)]="currentPassword" [type]="showPassword?'text':'password'"><button type="button" class="eye" (click)="showPassword=!showPassword" [attr.aria-label]="showPassword?'Ocultar contraseñas':'Ver contraseñas'"><span class="material-symbols-outlined">{{showPassword?'visibility_off':'visibility'}}</span></button></div>
          <label for="new-password">Nueva contraseña</label><input id="new-password" [(ngModel)]="newPassword" [type]="showPassword?'text':'password'">
          <label for="repeat-password">Repetir contraseña</label><input id="repeat-password" [(ngModel)]="repeatPassword" [type]="showPassword?'text':'password'">
          <button class="btn full" (click)="changePassword()">Actualizar contraseña</button>
        </section>
        <section class="panel"><h2>Insignias de impacto</h2><div class="badges"><div>♥<b>Corazón fiel</b></div><div>🥫<b>Nutridor</b></div></div></section>
      </aside></div>
    </main>
  `,
})
export class ProfileSettingsPage extends PageBase {
  constructor() { super(); if (!this.s.user) this.go('/ingresar'); }
}
