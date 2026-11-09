import { Routes } from '@angular/router';
import { Permissions } from '../../core/authorization/permissions';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard, PermissionRouteData } from '../../core/guards/permission-guard';

export const clientsRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Client.View],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/client-list/client-list-page').then(
        (component) => component.ClientListPageComponent,
      ),
  },
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Client.View],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/client-list/client-list-page').then(
        (component) => component.ClientListPageComponent,
      ),
  },
  {
    path: 'new',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Client.Create],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/client-create/client-create-page').then(
        (component) => component.ClientCreatePageComponent,
      ),
  },
  {
    path: 'new/:clientId',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Client.Edit],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/client-create/client-create-page').then(
        (component) => component.ClientCreatePageComponent,
      ),
  },
  {
    path: 'forms',
    canActivate: [authGuard, permissionGuard],
    data: {
      permissions: [Permissions.ClientForm.View],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./forms/pages/client-forms-page/client-forms-page').then(
        (component) => component.ClientFormsPageComponent,
      ),
  },
  {
    path: ':clientId/edit',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Client.Edit],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/client-edit/client-edit-page').then(
        (component) => component.ClientEditPageComponent,
      ),
  },
  {
    path: ':clientId',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Client.View],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/client-view/client-view-page').then(
        (component) => component.ClientViewPageComponent,
      ),
  },
];
