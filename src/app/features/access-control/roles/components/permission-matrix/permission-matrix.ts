import { Component, computed, input, output, signal } from '@angular/core';
import {
  FeaturePermissionGroup,
  ModulePermissionGroup,
  PermissionOption,
  ResourcePermissionGroup,
} from '../../models/role-management.models';

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  templateUrl: './permission-matrix.html',
  styleUrls: ['../../../users/user-density.css'],
})
export class PermissionMatrixComponent {
  private readonly resourceLabels: Readonly<Record<string, string>> = {
    Client: 'Client record',
    ClientQuickNote: 'Quick notes',
    ClientTodo: 'To-dos',
    ClientServiceAgreement: 'Service agreements',
    ClientCaregiver: 'Primary caregivers',
    ClientResponsibleParty: 'Responsible parties',
    ClientHospitalization: 'Hospitalizations',
    ClientVisit: 'Visits',
    ClientForm: 'Forms',
    ClientDocument: 'Documents',
    ClientEmailLog: 'Email logs',
    ClientEmployeeService: 'Employee services',
    Employee: 'Employee records',
    EmployeeDocument: 'Employee documents',
    TrainingDocument: 'Training documents',
    BackgroundCheckDocument: 'Background check documents',
  };
  readonly modules = input.required<readonly ModulePermissionGroup[]>();
  readonly selectedPermissionIds = input.required<ReadonlySet<number>>();
  readonly disabled = input(false);

  readonly permissionChanged = output<ReadonlySet<number>>();
  readonly search = signal('');
  readonly expandedModules = signal<ReadonlySet<number>>(new Set<number>());

  readonly filteredModules = computed(() => {
    const search = this.search().trim().toLowerCase();

    if (!search) {
      return this.modules();
    }

    return this.modules()
      .map((module) => ({
        ...module,
        features: module.features.filter(
          (feature) =>
            feature.name.toLowerCase().includes(search) ||
            this.permissionGroups(feature).some((group) =>
              group.name.toLowerCase().includes(search),
            ) ||
            feature.permissions.some(
              (permission) =>
                permission.action.toLowerCase().includes(search) ||
                permission.code.toLowerCase().includes(search),
            ),
        ),
      }))
      .filter((module) => module.name.toLowerCase().includes(search) || module.features.length > 0);
  });

  constructor() {
    queueMicrotask(() => this.expandAll());
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  toggleModule(moduleId: number): void {
    const next = new Set(this.expandedModules());

    if (next.has(moduleId)) {
      next.delete(moduleId);
    } else {
      next.add(moduleId);
    }

    this.expandedModules.set(next);
  }

  isModuleExpanded(moduleId: number): boolean {
    return this.expandedModules().has(moduleId);
  }

  togglePermission(permissionId: number): void {
    if (this.disabled()) {
      return;
    }

    const next = new Set(this.selectedPermissionIds());

    if (next.has(permissionId)) {
      next.delete(permissionId);
    } else {
      next.add(permissionId);
    }

    this.permissionChanged.emit(next);
  }

  featureSelected(feature: FeaturePermissionGroup): boolean {
    return (
      feature.permissions.length > 0 &&
      feature.permissions.every((permission) => this.selectedPermissionIds().has(permission.id))
    );
  }

  toggleFeature(feature: FeaturePermissionGroup): void {
    if (this.disabled()) {
      return;
    }

    const next = new Set(this.selectedPermissionIds());
    const allSelected = this.featureSelected(feature);

    for (const permission of feature.permissions) {
      if (allSelected) {
        next.delete(permission.id);
      } else {
        next.add(permission.id);
      }
    }

    this.permissionChanged.emit(next);
  }

  permissionGroups(feature: FeaturePermissionGroup): readonly ResourcePermissionGroup[] {
    const groups = new Map<string, PermissionOption[]>();
    for (const permission of feature.permissions) {
      const key = permission.code.split('.', 1)[0];
      groups.set(key, [...(groups.get(key) ?? []), permission]);
    }
    return [...groups].map(([key, permissions]) => ({
      key,
      name: this.resourceLabels[key] ?? this.humanize(key),
      permissions,
    }));
  }

  groupSelected(group: ResourcePermissionGroup): boolean {
    return (
      group.permissions.length > 0 &&
      group.permissions.every(({ id }) => this.selectedPermissionIds().has(id))
    );
  }

  toggleGroup(group: ResourcePermissionGroup): void {
    if (this.disabled()) return;
    const next = new Set(this.selectedPermissionIds());
    const allSelected = this.groupSelected(group);
    for (const permission of group.permissions)
      allSelected ? next.delete(permission.id) : next.add(permission.id);
    this.permissionChanged.emit(next);
  }

  private humanize(value: string): string {
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  moduleSelected(module: ModulePermissionGroup): boolean {
    const permissions = module.features.flatMap((feature) => feature.permissions);

    return (
      permissions.length > 0 &&
      permissions.every((permission) => this.selectedPermissionIds().has(permission.id))
    );
  }

  toggleModulePermissions(module: ModulePermissionGroup): void {
    if (this.disabled()) {
      return;
    }

    const next = new Set(this.selectedPermissionIds());
    const allSelected = this.moduleSelected(module);

    for (const feature of module.features) {
      for (const permission of feature.permissions) {
        if (allSelected) {
          next.delete(permission.id);
        } else {
          next.add(permission.id);
        }
      }
    }

    this.permissionChanged.emit(next);
  }

  expandAll(): void {
    this.expandedModules.set(new Set(this.modules().map((module) => module.id)));
  }

  collapseAll(): void {
    this.expandedModules.set(new Set());
  }
}
