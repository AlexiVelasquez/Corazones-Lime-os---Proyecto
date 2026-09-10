import { Routes } from '@angular/router';
import { AdminPage, ContactPage, DonorPage, HomePage, LoginPage, ShelterDirectoryPage, ShelterPage, StepOnePage, StepThreePage, StepTwoPage } from './pages';
import { DashboardDonationsPage, DashboardSheltersPage } from './dashboard-pages';
import { ProfileSettingsPage } from './profile-page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Corazones Limeños — Inicio' },
  { path: 'albergues', component: ShelterDirectoryPage, title: 'Albergues de Lima' },
  { path: 'contacto', component: ContactPage, title: 'Contacto y soporte' },
  { path: 'donar', component: StepOnePage, title: 'Donar — Categoría' },
  { path: 'donar/detalle', component: StepTwoPage, title: 'Donar — Detalle' },
  { path: 'donar/entrega', component: StepThreePage, title: 'Donar — Entrega' },
  { path: 'ingresar', component: LoginPage, title: 'Ingresar' },
  { path: 'panel/donante', component: DonorPage, title: 'Panel del donante' },
  { path: 'panel/albergue', component: ShelterPage, title: 'Panel del albergue' },
  { path: 'panel/admin', component: AdminPage, title: 'Administración' },
  { path: 'panel/:role/donaciones', component: DashboardDonationsPage, title: 'Donaciones' },
  { path: 'panel/:role/albergues', component: DashboardSheltersPage, title: 'Albergues' },
  { path: 'perfil', component: ProfileSettingsPage, title: 'Mi perfil' },
  { path: '**', redirectTo: '' }
];
