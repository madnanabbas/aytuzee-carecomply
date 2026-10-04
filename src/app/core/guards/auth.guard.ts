import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';
import { AuthenticatedLandingService } from '../auth/authenticated-landing.service';

export const authGuard: CanActivateFn = async () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);

  await session.initialize();
  return session.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
};

export const anonymousOnlyGuard: CanActivateFn = async () => {
  const session = inject(AuthSessionService);
  const landing = inject(AuthenticatedLandingService);
  const router = inject(Router);

  await session.initialize();
  return session.isAuthenticated() ? router.parseUrl(landing.firstAllowedPath()) : true;
};
