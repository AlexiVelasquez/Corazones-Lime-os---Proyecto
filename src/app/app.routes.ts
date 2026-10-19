import { Routes } from '@angular/router';
import { AdminPage, ContactPage, DonorPage, HomePage, LoginPage, ShelterDirectoryPage, ShelterPage, StepOnePage, StepThreePage, StepTwoPage } from './pages';
import { AdminUsersPage, DashboardDonationsPage, DashboardSheltersPage } from './dashboard-pages';
import { ProfileSettingsPage } from './profile-page';
import { RegisterPage } from './register-page';
import { areaGuard, authGuard, matchingPanelRoleGuard, publicOnlyGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Corazones Limeños — Inicio', canActivate: [publicOnlyGuard] },
  { path: 'albergues', component: ShelterDirectoryPage, title: 'Albergues de Lima', canActivate: [publicOnlyGuard] },
  { path: 'contacto', component: ContactPage, title: 'Contacto y soporte', canActivate: [publicOnlyGuard] },
  { path: 'donar', component: StepOnePage, title: 'Donar — Categoría', canActivate: [areaGuard('donation')] },
  { path: 'donar/detalle', component: StepTwoPage, title: 'Donar — Detalle', canActivate: [areaGuard('donation')] },
  { path: 'donar/entrega', component: StepThreePage, title: 'Donar — Entrega', canActivate: [areaGuard('donation')] },
  { path: 'ingresar', component: LoginPage, title: 'Ingresar', canActivate: [publicOnlyGuard] },
  { path: 'registro', component: RegisterPage, title: 'Crear cuenta', canActivate: [publicOnlyGuard] },
  { path: 'panel/donante', component: DonorPage, title: 'Panel del donante', canActivate: [areaGuard('donor-panel')] },
  { path: 'panel/albergue', component: ShelterPage, title: 'Panel del albergue', canActivate: [areaGuard('shelter-panel')] },
  { path: 'panel/admin', component: AdminPage, title: 'Administración', canActivate: [areaGuard('admin-panel')] },
  { path: 'panel/admin/usuarios', component: AdminUsersPage, title: 'Usuarios administradores', canActivate: [areaGuard('admin-panel')] },
  { path: 'panel/:role/donaciones', component: DashboardDonationsPage, title: 'Donaciones', canActivate: [matchingPanelRoleGuard] },
  { path: 'panel/:role/albergues', component: DashboardSheltersPage, title: 'Albergues', canActivate: [matchingPanelRoleGuard] },
  { path: 'perfil', component: ProfileSettingsPage, title: 'Mi perfil', canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
