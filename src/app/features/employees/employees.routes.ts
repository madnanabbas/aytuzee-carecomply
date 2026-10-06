import { Routes } from '@angular/router';
import { Permissions } from '../../core/authorization/permissions';
import { permissionGuard, PermissionRouteData } from '../../core/guards/permission-guard';

export const employeesRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: [Permissions.Employee.View] } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/employee-list/employee-list-page').then((x) => x.EmployeeListPageComponent),
  },
  {
    path: 'new',
    canActivate: [permissionGuard],
    data: { permissions: [Permissions.Employee.Create] } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/employee-form/employee-form-page').then((x) => x.EmployeeFormPageComponent),
  },
  {
    path: ':employeeId/edit',
    canActivate: [permissionGuard],
    data: { permissions: [Permissions.Employee.Edit] } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/employee-form/employee-form-page').then((x) => x.EmployeeFormPageComponent),
  },
  {
    path: ':employeeId',
    canActivate: [permissionGuard],
    data: { permissions: [Permissions.Employee.View] } satisfies PermissionRouteData,
    loadComponent: () =>
      import('./pages/employee-view/employee-view-page').then((x) => x.EmployeeViewPageComponent),
  },
];
