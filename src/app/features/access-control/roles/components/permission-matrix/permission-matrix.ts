import {
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FeaturePermissionGroup,
  ModulePermissionGroup,
} from '../../models/role-management.models';

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  templateUrl: './permission-matrix.html',
})
export class PermissionMatrixComponent {
  readonly modules = input.required<
    readonly ModulePermissionGroup[]
  >();

  readonly selectedPermissionIds = input.required<
    ReadonlySet<string>
  >();

  readonly permissionChanged = output<ReadonlySet<string>>();

  readonly search = signal('');

  readonly expandedModules = signal<ReadonlySet<string>>(
    new Set<string>(),
  );

  readonly filteredModules = computed(() => {
    const search = this.search().trim().toLowerCase();

    if (!search) {
      return this.modules();
    }

    return this.modules()
      .map((module) => ({
        ...module,
        features: module.features.filter((feature) => {
          return (
            feature.name.toLowerCase().includes(search) ||
            feature.permissions.some(
              (permission) =>
                permission.name.toLowerCase().includes(search) ||
                permission.code.toLowerCase().includes(search),
            )
          );
        }),
      }))
      .filter(
        (module) =>
          module.name.toLowerCase().includes(search) ||
          module.features.length > 0,
      );
  });

  constructor() {
    queueMicrotask(() => {
      this.expandedModules.set(
        new Set(this.modules().map((module) => module.id)),
      );
    });
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  toggleModule(moduleId: string): void {
    const next = new Set(this.expandedModules());

    if (next.has(moduleId)) {
      next.delete(moduleId);
    } else {
      next.add(moduleId);
    }

    this.expandedModules.set(next);
  }

  isModuleExpanded(moduleId: string): boolean {
    return this.expandedModules().has(moduleId);
  }

  togglePermission(permissionId: string): void {
    const next = new Set(this.selectedPermissionIds());

    if (next.has(permissionId)) {
      next.delete(permissionId);
    } else {
      next.add(permissionId);
    }

    this.permissionChanged.emit(next);
  }

  featureSelected(feature: FeaturePermissionGroup): boolean {
    return feature.permissions.every((permission) =>
      this.selectedPermissionIds().has(permission.id),
    );
  }

  toggleFeature(feature: FeaturePermissionGroup): void {
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

  moduleSelected(module: ModulePermissionGroup): boolean {
    const permissions = module.features.flatMap(
      (feature) => feature.permissions,
    );

    return (
      permissions.length > 0 &&
      permissions.every((permission) =>
        this.selectedPermissionIds().has(permission.id),
      )
    );
  }

  toggleModulePermissions(module: ModulePermissionGroup): void {
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
    this.expandedModules.set(
      new Set(this.modules().map((module) => module.id)),
    );
  }

  collapseAll(): void {
    this.expandedModules.set(new Set());
  }
}