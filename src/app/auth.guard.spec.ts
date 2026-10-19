import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, convertToParamMap, provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { areaGuard, authGuard, matchingPanelRoleGuard, publicOnlyGuard } from './auth.guard';
import { Account, Store } from './store';

const donor: Account = {
  id: 'carlos', role: 'donante', name: 'Carlos', surname: 'Mendoza',
  email: 'donante@calidad.pe', phone: '987654321', district: 'Miraflores',
  password: '12345678', notifications: [true, true, false],
};

function route(role?: string): ActivatedRouteSnapshot {
  return { paramMap: convertToParamMap(role ? { role } : {}) } as ActivatedRouteSnapshot;
}

function state(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('8. Guards reales de Angular', () => {
  let store: { ready: Promise<void>; user: Account | null; panel: string; notify: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    store = { ready: Promise.resolve(), user: null, panel: '/panel/donante', notify: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Store, useValue: store }],
    });
  });

  it('CP-UNIT-031 redirige al login y conserva la ruta solicitada cuando no hay sesión', async () => {
    const result = await TestBed.runInInjectionContext(() => authGuard(route(), state('/perfil')));
    expect(result).not.toBe(true);
    expect((result as ReturnType<Router['parseUrl']>).toString()).toBe('/ingresar?returnUrl=%2Fperfil');
  });

  it('CP-UNIT-032 permite al donante abrir el flujo de donación', async () => {
    store.user = donor;
    const result = await TestBed.runInInjectionContext(() => areaGuard('donation')(route(), state('/donar')));
    expect(result).toBe(true);
  });

  it('CP-UNIT-033 bloquea un área de otro rol y regresa al panel propio', async () => {
    store.user = donor;
    const result = await TestBed.runInInjectionContext(() => areaGuard('admin-panel')(route(), state('/panel/admin')));
    expect((result as ReturnType<Router['parseUrl']>).toString()).toBe('/panel/donante');
    expect(store.notify).toHaveBeenCalledWith(expect.stringContaining('Acceso denegado'));
  });

  it('CP-UNIT-034 impide alterar el parámetro role de las rutas del panel', async () => {
    store.user = donor;
    const result = await TestBed.runInInjectionContext(() => matchingPanelRoleGuard(route('admin'), state('/panel/admin/donaciones')));
    expect((result as ReturnType<Router['parseUrl']>).toString()).toBe('/panel/donante');
  });

  it('CP-UNIT-035 evita que una sesión activa vuelva a una página pública', async () => {
    store.user = donor;
    const result = await TestBed.runInInjectionContext(() => publicOnlyGuard(route(), state('/')));
    expect((result as ReturnType<Router['parseUrl']>).toString()).toBe('/panel/donante');
    expect(store.notify).toHaveBeenCalledWith(expect.stringContaining('Cierra sesión primero'));
  });

  it('CP-UNIT-036 declara guard en todas las rutas privadas', () => {
    const privatePaths = ['donar', 'donar/detalle', 'donar/entrega', 'panel/donante', 'panel/albergue', 'panel/admin', 'panel/admin/usuarios', 'panel/:role/donaciones', 'panel/:role/albergues', 'perfil'];
    for (const path of privatePaths) {
      expect(routes.find(item => item.path === path)?.canActivate?.length, path).toBeGreaterThan(0);
    }
  });

  it('CP-UNIT-045 protege las páginas públicas cuando ya existe una sesión', () => {
    const publicPaths = ['', 'albergues', 'contacto', 'ingresar', 'registro'];
    for (const path of publicPaths) {
      expect(routes.find(item => item.path === path)?.canActivate).toContain(publicOnlyGuard);
    }
  });

  it('CP-UNIT-046 permite abrir la landing cuando no hay sesión', async () => {
    const result = await TestBed.runInInjectionContext(() => publicOnlyGuard(route(), state('/')));
    expect(result).toBe(true);
    expect(store.notify).not.toHaveBeenCalled();
  });
});
