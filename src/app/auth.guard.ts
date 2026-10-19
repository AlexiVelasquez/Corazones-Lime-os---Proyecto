import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { Store } from './store';
import { AccessRules, ProtectedArea } from './business-rules';

function loginRedirect(router: Router, state: RouterStateSnapshot) {
  return router.createUrlTree(['/ingresar'], { queryParams: { returnUrl: state.url } });
}

export const authGuard: CanActivateFn = async (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  await store.ready;
  return store.user ? true : loginRedirect(router, state);
};

export const areaGuard = (area: ProtectedArea): CanActivateFn => async (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  await store.ready;
  if (!store.user) return loginRedirect(router, state);
  if (AccessRules.canAccess(store.user.role, area)) return true;
  store.notify('Acceso denegado: tu rol no puede utilizar esta función.');
  return router.parseUrl(store.panel);
};

export const publicOnlyGuard: CanActivateFn = async () => {
  const store = inject(Store);
  const router = inject(Router);
  await store.ready;
  if (!store.user) return true;
  store.notify('Tienes una sesión activa. Cierra sesión primero para volver a las páginas públicas.');
  return router.parseUrl(store.panel);
};

export const matchingPanelRoleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state) => {
  const store = inject(Store);
  const router = inject(Router);
  await store.ready;
  if (!store.user) return loginRedirect(router, state);
  if (route.paramMap.get('role') === store.user.role) return true;
  store.notify('Acceso denegado: no puedes consultar el panel de otro rol.');
  return router.parseUrl(store.panel);
};
