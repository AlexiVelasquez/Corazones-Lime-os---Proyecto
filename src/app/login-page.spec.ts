import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginPage } from './pages';
import { Account, Store } from './store';

const donor: Account = {
  id: 'carlos', role: 'donante', name: 'Carlos', surname: 'Mendoza',
  email: 'donante@calidad.pe', phone: '987654321', district: 'Miraflores',
  password: '12345678', notifications: [true, true, false],
};

describe('9. Caso de uso de inicio de sesión', () => {
  let store: any;
  let router: { navigateByUrl: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn> };
  let page: LoginPage;

  beforeEach(() => {
    sessionStorage.clear();
    store = {
      user: null,
      accounts: [donor],
      message: signal(''),
      panel: '/panel/donante',
      donations: [],
      login: vi.fn(),
      notify: vi.fn((message: string) => store.message.set(message)),
    };
    router = { navigateByUrl: vi.fn().mockResolvedValue(true), navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    page = TestBed.runInInjectionContext(() => new LoginPage());
    history.replaceState({}, '', '/ingresar');
  });

  it('CP-UNIT-037 valida correo y contraseña antes de consultar la API', async () => {
    page.email = 'correo-invalido';
    page.password = '';
    await page.login();
    expect(store.login).not.toHaveBeenCalled();
    expect(page.loginError).toContain('correo válido');
  });

  it('CP-UNIT-038 muestra el error de autenticación entregado por el servidor', async () => {
    store.login.mockImplementation(async () => { store.message.set('Correo o contraseña incorrectos.'); return false; });
    page.email = donor.email;
    page.password = 'Incorrecta123!';
    await page.login();
    expect(page.loginError).toContain('Correo o contraseña incorrectos.');
    expect(page.loginError).toContain('2 intentos');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('CP-UNIT-039 autentica y redirige al panel correspondiente al rol', async () => {
    store.login.mockImplementation(async () => { store.user = donor; return true; });
    page.email = donor.email;
    page.password = donor.password;
    await page.login();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/panel/donante');
  });

  it('CP-UNIT-040 recupera una ruta interna permitida después del login', async () => {
    history.replaceState({}, '', '/ingresar?returnUrl=%2Fdonar%2Fentrega');
    store.login.mockImplementation(async () => { store.user = donor; return true; });
    page.email = donor.email;
    page.password = donor.password;
    await page.login();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/donar/entrega');
  });

  it('CP-UNIT-041 ignora redirecciones externas después del login', async () => {
    history.replaceState({}, '', '/ingresar?returnUrl=%2F%2Fsitio-malicioso.test');
    store.login.mockImplementation(async () => { store.user = donor; return true; });
    page.email = donor.email;
    page.password = donor.password;
    await page.login();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/panel/donante');
  });

  it('CP-UNIT-042 evita enviar dos veces el formulario mientras autentica', async () => {
    let finish!: (value: boolean) => void;
    store.login.mockReturnValue(new Promise<boolean>(resolve => { finish = resolve; }));
    page.email = donor.email;
    page.password = donor.password;
    const first = page.login();
    const second = page.login();
    expect(store.login).toHaveBeenCalledTimes(1);
    finish(false);
    await Promise.all([first, second]);
    expect(page.loginLoading).toBe(false);
  });

  it('CP-UNIT-053 bloquea el login tras tres fallos y recomienda registrar una cuenta', async () => {
    store.login.mockResolvedValue(false);
    page.email = donor.email;
    page.password = 'Incorrecta123!';
    await page.login();
    await page.login();
    await page.login();
    expect(page.loginLocked).toBe(true);
    expect(page.loginError).toContain('registra una cuenta');
    await page.login();
    expect(store.login).toHaveBeenCalledTimes(3);
  });

  it('CP-UNIT-054 restablece el botón si la autenticación produce un error inesperado', async () => {
    store.login.mockRejectedValue(new Error('Servidor no disponible'));
    page.email = donor.email;
    page.password = donor.password;
    await page.login();
    expect(page.loginLoading).toBe(false);
    expect(page.loginError).toContain('No se pudo completar');
  });

  it('CP-UNIT-055 cancela visualmente una autenticación que no responde', async () => {
    vi.useFakeTimers();
    store.login.mockReturnValue(new Promise<boolean>(() => undefined));
    page.email = donor.email;
    page.password = donor.password;
    const attempt = page.login();
    await vi.advanceTimersByTimeAsync(6500);
    await attempt;
    expect(page.loginLoading).toBe(false);
    expect(page.loginError).toContain('tardó demasiado');
    vi.useRealTimers();
  });
});
