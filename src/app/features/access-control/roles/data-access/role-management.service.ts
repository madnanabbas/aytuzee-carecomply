import { Injectable } from '@angular/core';
import {
  ModulePermissionGroup,
  RoleEditorModel,
  RoleListItem,
} from '../models/role-management.models';

@Injectable({
  providedIn: 'root',
})
export class RoleManagementService {
  private readonly roles: RoleListItem[] = [
    {
      id: '1',
      name: 'System Administrator',
      description: 'Full access to CareComply administration and operations.',
      assignedUsers: 1,
      permissionCount: 48,
    },
    {
      id: '2',
      name: 'Compliance Manager',
      description: 'Manage compliance, clients and related documents.',
      assignedUsers: 3,
      permissionCount: 24,
    },
    {
      id: '3',
      name: 'HR Manager',
      description: 'Manage employees, training and background checks.',
      assignedUsers: 4,
      permissionCount: 18,
    },
    {
      id: '4',
      name: 'Read Only User',
      description: 'View-only access to approved CareComply areas.',
      assignedUsers: 6,
      permissionCount: 10,
    },
  ];

  private readonly permissionCatalog: ModulePermissionGroup[] = [
    {
      id: 'people',
      key: 'people',
      name: 'People',
      features: [
        {
          id: 'clients',
          key: 'clients',
          name: 'Clients',
          permissions: [
            {
              id: 'client-view',
              code: 'Client.View',
              name: 'View',
              description: '',
            },
            {
              id: 'client-create',
              code: 'Client.Create',
              name: 'Create',
              description: '',
            },
            {
              id: 'client-edit',
              code: 'Client.Edit',
              name: 'Edit',
              description: '',
            },
          ],
        },
        {
          id: 'employees',
          key: 'employees',
          name: 'Employees',
          permissions: [
            {
              id: 'employee-view',
              code: 'Employee.View',
              name: 'View',
            },
            {
              id: 'employee-create',
              code: 'Employee.Create',
              name: 'Create',
            },
            {
              id: 'employee-edit',
              code: 'Employee.Edit',
              name: 'Edit',
            },
          ],
        },
      ],
    },
    {
      id: 'compliance',
      key: 'compliance',
      name: 'Compliance',
      features: [
        {
          id: 'documents',
          key: 'documents',
          name: 'Documents',
          permissions: [
            {
              id: 'document-view',
              code: 'Document.View',
              name: 'View',
            },
            {
              id: 'document-upload',
              code: 'Document.Upload',
              name: 'Upload',
            },
            {
              id: 'document-download',
              code: 'Document.Download',
              name: 'Download',
            },
          ],
        },
        {
          id: 'training',
          key: 'training',
          name: 'Training',
          permissions: [
            {
              id: 'training-view',
              code: 'Training.View',
              name: 'View',
            },
            {
              id: 'training-manage',
              code: 'Training.Manage',
              name: 'Manage',
            },
          ],
        },
      ],
    },
    {
      id: 'administration',
      key: 'administration',
      name: 'Administration',
      features: [
        {
          id: 'users',
          key: 'users',
          name: 'Users',
          permissions: [
            {
              id: 'user-view',
              code: 'User.View',
              name: 'View',
            },
            {
              id: 'user-manage',
              code: 'User.Manage',
              name: 'Manage',
            },
          ],
        },
        {
          id: 'roles',
          key: 'roles',
          name: 'Roles',
          permissions: [
            {
              id: 'role-view',
              code: 'Role.View',
              name: 'View',
            },
            {
              id: 'role-manage',
              code: 'Role.Manage',
              name: 'Manage',
            },
          ],
        },
      ],
    },
  ];

  getRoles(): readonly RoleListItem[] {
    return this.roles;
  }

  getPermissionCatalog(): readonly ModulePermissionGroup[] {
    return this.permissionCatalog;
  }

  getRole(id: string): RoleEditorModel | null {
    const role = this.roles.find((item) => item.id === id);

    if (!role) {
      return null;
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissionIds:
        role.id === '1'
          ? this.permissionCatalog.flatMap((module) =>
              module.features.flatMap((feature) =>
                feature.permissions.map((permission) => permission.id),
              ),
            )
          : [],
    };
  }
}