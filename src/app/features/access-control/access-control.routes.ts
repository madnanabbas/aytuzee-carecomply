import { Routes } from '@angular/router';
import { Permissions } from '../../core/authorization/permissions';
import { permissionGuard, PermissionRouteData } from '../../core/guards/permission-guard';
import { AccessControlPlaceholderComponent } from './pages/access-control-placeholder/access-control-placeholder';
import { UserEditorStore } from './users/data-access/user-editor.store';

const userEditorChildren: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'general' },
  {
    path: 'general',
    loadComponent: () =>
      import('./users/pages/user-general/user-general-page').then(
        (component) => component.UserGeneralPageComponent,
      ),
  },
];

export const accessControlRoutes: Routes = [
  {
    path: '',
    component: AccessControlPlaceholderComponent,
  },
  {
    path: 'users',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.User.View],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import(
        './users/pages/user-list/user-list-page'
      ).then(
        (component) =>
          component.UserListPageComponent,
      ),
  },
  {
    path: 'users/new',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.User.Manage],
      createMode: true,
    } satisfies PermissionRouteData & { readonly createMode: true },
    providers: [UserEditorStore],
    loadComponent: () =>
      import('./users/pages/user-editor/user-editor-page').then(
        (component) => component.UserEditorPageComponent,
      ),
    children: userEditorChildren,
  },
  {
    path: 'users/:userId',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.User.View],
    } satisfies PermissionRouteData,
    providers: [UserEditorStore],
    loadComponent: () =>
      import('./users/pages/user-editor/user-editor-page').then(
        (component) => component.UserEditorPageComponent,
      ),
    children: userEditorChildren,
  },
  {
    path: 'roles',
    loadComponent: () =>
      import(
        './roles/pages/role-list/role-list-page'
      ).then((m) => m.RoleListPage),
  },
  {
    path: 'roles/new',
    loadComponent: () =>
      import(
        './roles/pages/role-editor/role-editor-page'
      ).then((m) => m.RoleEditorPage),
  },
  {
    path: 'roles/:roleId',
    loadComponent: () =>
      import(
        './roles/pages/role-editor/role-editor-page'
      ).then((m) => m.RoleEditorPage),
  },
];
