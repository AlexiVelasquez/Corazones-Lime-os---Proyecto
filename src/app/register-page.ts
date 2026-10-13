import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PublicRegistrationRole, RegistrationData, RegistrationRules } from './business-rules';
import { Store } from './store';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="register-page">
      <header class="register-head">
        <a class="brand" routerLink="/">♥ Corazones Limeños</a>
        <span>¿Ya tienes una cuenta? <a routerLink="/ingresar">Iniciar sesión</a></span>
      </header>

      <section class="register-shell">
        <div class="register-intro">
          <span class="eyebrow">Únete a la comunidad</span>
          <h1>Crea tu cuenta</h1>
          <p>Selecciona el perfil que describe cómo participarás en Corazones Limeños.</p>
          <div class="role-definitions">
            <button type="button" [class.selected]="form.role === 'donante'" (click)="selectRole('donante')">
              <span>♡</span><b>Donante</b>
              <small>Registra aportes, consulta su seguimiento y obtiene insignias de impacto.</small>
            </button>
            <button type="button" [class.selected]="form.role === 'albergue'" (click)="selectRole('albergue')">
              <span>⌂</span><b>Albergue</b>
              <small>Solicita validación, publica necesidades y confirma las entregas recibidas.</small>
            </button>
          </div>
          <aside class="admin-note"><b>Administrador</b><span>Aprueba albergues, gestiona rutas y supervisa reportes. Este acceso se asigna internamente.</span></aside>
        </div>

        <form class="register-form panel" (ngSubmit)="submit()">
          <div class="form-section"><b>Datos del responsable</b><span>Información utilizada para identificar tu cuenta.</span></div>
          <div class="form-grid">
            <label>Nombres<input [(ngModel)]="form.name" name="name" autocomplete="given-name" required></label>
            <label>Apellidos<input [(ngModel)]="form.surname" name="surname" autocomplete="family-name" required></label>
            <label class="wide-label">Correo electrónico<input [(ngModel)]="form.email" name="email" type="email" autocomplete="email" required></label>
            <label>Teléfono<input [(ngModel)]="form.phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="987654321" required></label>
            <label>Distrito<select [(ngModel)]="form.district" name="district" required>@for(district of districts; track district){<option>{{district}}</option>}</select></label>
          </div>

          @if(form.role === 'albergue') {
            <div class="form-section"><b>Datos del albergue</b><span>La solicitud quedará pendiente de aprobación administrativa.</span></div>
            <div class="form-grid">
              <label class="wide-label">Nombre del albergue<input [(ngModel)]="form.shelterName" name="shelterName" required></label>
              <label>RUC<input [(ngModel)]="form.ruc" name="ruc" inputmode="numeric" maxlength="11" placeholder="11 dígitos" required></label>
              <label>Dirección<input [(ngModel)]="form.address" name="address" autocomplete="street-address" required></label>
              <label class="wide-label">Descripción<textarea [(ngModel)]="form.description" name="description" rows="3" maxlength="500" placeholder="Describe la labor y población atendida" required></textarea></label>
            </div>
          }

          <div class="form-section"><b>Seguridad</b><span>Usa al menos 8 caracteres, mayúscula, minúscula y número.</span></div>
          <div class="form-grid">
            <label>Contraseña<div class="password-wrap"><input [(ngModel)]="form.password" name="password" [type]="showPassword ? 'text' : 'password'" autocomplete="new-password" required><button type="button" class="eye" (click)="showPassword=!showPassword">{{showPassword ? '◉' : '◎'}}</button></div></label>
            <label>Repetir contraseña<input [(ngModel)]="form.repeatPassword" name="repeatPassword" [type]="showPassword ? 'text' : 'password'" autocomplete="new-password" required></label>
          </div>
          <label class="terms"><input [(ngModel)]="form.acceptTerms" name="acceptTerms" type="checkbox"> <span>Acepto los términos de uso y la política de privacidad.</span></label>
          @if(error){<p class="form-error">{{error}}</p>}
          <button class="btn full" type="submit" [disabled]="loading">{{loading ? 'Creando cuenta…' : form.role === 'albergue' ? 'Enviar solicitud' : 'Crear cuenta'}}</button>
        </form>
      </section>
    </main>
  `,
})
export class RegisterPage {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  readonly districts = ['Miraflores', 'San Isidro', 'Comas', 'San Juan de Lurigancho', 'Villa El Salvador', 'Los Olivos', 'San Martín de Porres', 'Santiago de Surco', 'Lima Cercado', 'La Molina'];
  showPassword = false;
  loading = false;
  error = '';
  form: RegistrationData = {
    role: 'donante', name: '', surname: '', shelterName: '', email: '', phone: '',
    district: 'Miraflores', password: '', repeatPassword: '', ruc: '', address: '',
    description: '', acceptTerms: false,
  };

  constructor() {
    void this.redirectAuthenticatedUser();
  }

  private async redirectAuthenticatedUser() {
    await this.store.ready;
    if (this.store.user) await this.router.navigateByUrl(this.store.panel);
  }

  selectRole(role: PublicRegistrationRole) { this.form.role = role; this.error = ''; }

  async submit() {
    this.error = '';
    const validation = RegistrationRules.validate(this.form);
    if (!validation.valid) { this.error = validation.message; return; }
    this.loading = true;
    const result = await this.store.register(this.form);
    this.loading = false;
    if (!result.ok) { this.error = result.message; return; }
    this.store.notify(this.form.role === 'albergue'
      ? 'Cuenta creada. Tu albergue está pendiente de aprobación.'
      : 'Cuenta creada correctamente. ¡Bienvenido!');
    await this.router.navigateByUrl(this.store.panel);
  }
}
