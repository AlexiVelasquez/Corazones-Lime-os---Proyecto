import { DatabaseApi } from './database-api';

function response(ok: boolean, status: number, body: unknown) {
  return { ok, status, json: async () => body } as Response;
}

describe('10. Sesión y protección CSRF del cliente', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('CP-UNIT-043 renueva el token CSRF expirado y reintenta una sola vez', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(false, 403, { error: 'Token expirado', code: 'CSRF_INVALID' }))
      .mockResolvedValueOnce(response(true, 200, { accounts: [], shelters: [], donations: [], needs: [], csrfToken: 'token-renovado' }))
      .mockResolvedValueOnce(response(true, 200, { account: { id: 'carlos' }, csrfToken: 'token-sesion' }));
    vi.stubGlobal('fetch', fetchMock);

    await new DatabaseApi().login('donante@calidad.pe', 'Demo123!');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('action=bootstrap');
    expect(fetchMock.mock.calls[2][1].headers['X-CSRF-Token']).toBe('token-renovado');
  });

  it('CP-UNIT-044 no reintenta errores de autorización ajenos a CSRF', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(false, 403, { error: 'Rol sin permiso', code: 'FORBIDDEN' }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(new DatabaseApi().login('albergue@calidad.pe', 'Demo123!')).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
