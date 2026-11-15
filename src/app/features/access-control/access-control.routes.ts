import { Routes } from '@angular/router';
import { Permissions } from '../../core/authorization/permissions';
import { permissionGuard, PermissionRouteData } from '../../core/guards/permission-guard';
import { authGuard } from '../../core/guards/auth.guard';
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
    path: 'form-templates',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: [Permissions.FormTemplate.View] } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./form-templates/pages/form-template-list/form-template-list-page').then(
        (component) => component.FormTemplateListPageComponent,
      ),
  },
  {
    path: 'form-templates/:templateId/versions/:versionId/mappings',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: [Permissions.FormTemplate.Manage] } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./form-templates/pages/form-template-mapping/form-template-mapping-page').then(
        (component) => component.FormTemplateMappingPageComponent,
      ),
  },
  {
    path: 'form-templates/:templateId',
    canActivate: [authGuard, permissionGuard],
    data: { permissions: [Permissions.FormTemplate.View] } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./form-templates/pages/form-template-detail/form-template-detail-page').then(
        (component) => component.FormTemplateDetailPageComponent,
      ),
  },
  {
    path: 'companies',
    canActivate: [permissionGuard],
    data: { permissions: [Permissions.Company.View] } satisfies PermissionRouteData,
    loadComponent: () => import('./companies/company-page').then((m) => m.CompanyPage),
  },
  {
    path: 'payers',
    canActivate: [permissionGuard],
    data: { permissions: [Permissions.Payer.View] } satisfies PermissionRouteData,
    loadComponent: () => import('./payers/payer-page').then((m) => m.PayerPage),
  },
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
      import('./users/pages/user-list/user-list-page').then(
        (component) => component.UserListPageComponent,
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
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Role.View],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./roles/pages/role-list/role-list-page').then((m) => m.RoleListPage),
  },
  {
    path: 'roles/new',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Role.Manage],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./roles/pages/role-editor/role-editor-page').then((m) => m.RoleEditorPage),
  },
  {
    path: 'roles/:roleId',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Role.View],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./roles/pages/role-editor/role-editor-page').then((m) => m.RoleEditorPage),
  },
  {
    path: 'modules-features',
    canActivate: [permissionGuard],
    data: {
      permissions: [Permissions.Permission.View],
    } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./modules-features/pages/module-feature-page/module-feature-page').then(
        (m) => m.ModuleFeaturePage,
      ),
  },
];
