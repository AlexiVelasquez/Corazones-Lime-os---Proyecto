import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { Role, Store } from './store';

function loginRedirect(router: Router, state: RouterStateSnapshot) {
  return router.createUrlTree(['/ingresar'], { queryParams: { returnUrl: state.url } });
}

export const authGuard: CanActivateFn = async (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  await store.ready;
  return store.user ? true : loginRedirect(router, state);
};

export const roleGuard = (...roles: Role[]): CanActivateFn => async (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  await store.ready;
  if (!store.user) return loginRedirect(router, state);
  return roles.includes(store.user.role) ? true : router.parseUrl(store.panel);
};

export const matchingPanelRoleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state) => {
  const store = inject(Store);
  const router = inject(Router);
  await store.ready;
  if (!store.user) return loginRedirect(router, state);
  return route.paramMap.get('role') === store.user.role ? true : router.parseUrl(store.panel);
};
