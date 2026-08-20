import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';
import { AuthenticatedLandingService } from '../auth/authenticated-landing.service';
import { MfaContextStatus } from '../auth/auth.models';

export const mfaChallengeGuard: CanActivateFn = () => guardMfaContext('mfaRequired');

export const mfaEnrollmentGuard: CanActivateFn = () =>
  guardMfaContext('mfaEnrollmentRequired');

async function guardMfaContext(expectedStatus: MfaContextStatus): Promise<boolean | UrlTree> {
  const session = inject(AuthSessionService);
  const landing = inject(AuthenticatedLandingService);
  const router = inject(Router);

  await session.initialize();
  if (session.isAuthenticated()) {
    return router.parseUrl(landing.firstAllowedPath());
  }

  const context = await session.prepareMfaContext();
  if (context.status === expectedStatus) {
    return true;
  }

  if (context.status === 'mfaRequired') {
    return router.parseUrl('/auth/mfa');
  }

  if (context.status === 'mfaEnrollmentRequired') {
    return router.parseUrl('/auth/mfa/setup');
  }

  return router.parseUrl('/auth/login');
}
