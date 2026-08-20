import { Routes } from '@angular/router';
import { AccessControlPlaceholderComponent } from './pages/access-control-placeholder/access-control-placeholder';

export const accessControlRoutes: Routes = [
  {
    path: '',
    component: AccessControlPlaceholderComponent,
  },
  {
    path: 'register-user',
    loadComponent: () =>
      import(
        './pages/register-user/register-user-page'
      ).then(
        (component) =>
          component.RegisterUserPageComponent,
      ),
  },
];
