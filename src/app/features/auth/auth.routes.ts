import { Routes } from '@angular/router';

import { anonymousOnlyGuard } from '../../core/guards/auth.guard';
import {
  mfaChallengeGuard,
  mfaEnrollmentGuard,
} from '../../core/guards/mfa-challenge.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () =>
      import('./pages/login/login-page').then(
        (module) => module.LoginPageComponent,
      ),
  },
  {
    path: 'forgot-password',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password-page').then(
        (module) => module.ForgotPasswordPageComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password-page').then(
        (module) => module.ResetPasswordPageComponent,
      ),
  },
  {
    path: 'mfa',
    canActivate: [mfaChallengeGuard],
    loadComponent: () =>
      import('./pages/mfa-challenge/mfa-challenge-page').then(
        (module) => module.MfaChallengePageComponent,
      ),
  },
  {
    path: 'mfa/setup',
    canActivate: [mfaEnrollmentGuard],
    loadComponent: () =>
      import('./pages/mfa-enrollment/mfa-enrollment-page').then(
        (module) => module.MfaEnrollmentPageComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
];
