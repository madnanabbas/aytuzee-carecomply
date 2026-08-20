import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard, PermissionRouteData } from './core/guards/permission-guard';
import { APP_NAVIGATION_ITEMS } from './core/navigation/app-navigation';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(
        (module) => module.authRoutes,
      ),
  },
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./layout/forbidden/forbidden').then((module) => module.ForbiddenComponent),
      },
      {
        path: 'dashboard',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.dashboard.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((module) => module.dashboardRoutes),
      },
      {
        path: 'clients',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.clients.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/clients/clients.routes').then((module) => module.clientsRoutes),
      },
      {
        path: 'employees',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.employees.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/employees/employees.routes').then((module) => module.employeesRoutes),
      },
      {
        path: 'dhs-library',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.dhsLibrary.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/dhs-library/dhs-library.routes').then(
            (module) => module.dhsLibraryRoutes,
          ),
      },
      {
        path: 'documents',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.documents.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/documents/documents.routes').then((module) => module.documentsRoutes),
      },
      {
        path: 'training',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.training.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/training/training.routes').then((module) => module.trainingRoutes),
      },
      {
        path: 'background-checks',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.backgroundChecks.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/background-checks/background-checks.routes').then(
            (module) => module.backgroundChecksRoutes,
          ),
      },
      {
        path: 'expiry-review',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.expiryReview.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/expiry-review/expiry-review.routes').then(
            (module) => module.expiryReviewRoutes,
          ),
      },
      {
        path: 'notifications',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.notifications.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then(
            (module) => module.notificationsRoutes,
          ),
      },
      {
        path: 'reports',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.reports.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/reports/reports.routes').then((module) => module.reportsRoutes),
      },
      {
        path: 'access-control',
        canActivate: [authGuard, permissionGuard],
        data: {
          permissions: APP_NAVIGATION_ITEMS.accessControl.permissions,
        } satisfies PermissionRouteData,
        loadChildren: () =>
          import('./features/access-control/access-control.routes').then(
            (module) => module.accessControlRoutes,
          ),
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
