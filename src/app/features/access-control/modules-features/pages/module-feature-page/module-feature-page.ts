import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { ModuleFeatureApiService } from '../../data-access/module-feature-api.service';
import { ModuleFeatureItem, NavigationFeatureRequest, NavigationModuleItem, NavigationModuleRequest } from '../../models/module-feature.models';

type EditorState =
  | { readonly kind: 'module'; readonly mode: 'create' | 'edit'; readonly module: NavigationModuleItem | null }
  | { readonly kind: 'feature'; readonly mode: 'create' | 'edit'; readonly feature: ModuleFeatureItem | null };

@Component({
  selector: 'app-module-feature-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './module-feature-page.html',
})
export class ModuleFeaturePage implements OnInit {
  private readonly api = inject(ModuleFeatureApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly fb = inject(FormBuilder);

  readonly modules = signal<readonly NavigationModuleItem[]>([]);
  readonly selectedModuleId = signal<number | null>(null);
  readonly moduleSearch = signal('');
  readonly featureSearch = signal('');
  readonly editor = signal<EditorState | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly canManage = this.authorization.hasPermission(Permissions.Permission.Manage);

  readonly moduleForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    key: ['', [Validators.required, Validators.maxLength(100)]],
    sortOrder: [10, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  readonly featureForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    key: ['', [Validators.required, Validators.maxLength(100)]],
    route: ['', [Validators.required, Validators.maxLength(256)]],
    iconKey: ['', [Validators.required, Validators.maxLength(100)]],
    parentFeatureId: this.fb.control<number | null>(null),
    sortOrder: [10, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  readonly filteredModules = computed(() => {
    const query = this.moduleSearch().trim().toLowerCase();
    return query
      ? this.modules().filter((item) => item.name.toLowerCase().includes(query) || item.key.toLowerCase().includes(query))
      : this.modules();
  });

  readonly selectedModule = computed(() => this.modules().find((item) => item.id === this.selectedModuleId()) ?? null);
  readonly visibleFeatures = computed(() => {
    const module = this.selectedModule();
    const query = this.featureSearch().trim().toLowerCase();
    if (!module) return [];
    return module.features.filter((item) => !query || item.name.toLowerCase().includes(query) || item.key.toLowerCase().includes(query) || item.route.toLowerCase().includes(query));
  });

  ngOnInit(): void { this.load(); }

  load(preferredModuleId?: number): void {
    this.loading.set(true); this.error.set(null);
    this.api.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (modules) => {
        this.modules.set(modules);
        const current = preferredModuleId ?? this.selectedModuleId();
        this.selectedModuleId.set(modules.some((m) => m.id === current) ? current : modules[0]?.id ?? null);
      },
      error: () => this.error.set('Modules and features could not be loaded. Please try again.'),
    });
  }

  selectModule(id: number): void { this.selectedModuleId.set(id); this.featureSearch.set(''); }
  updateModuleSearch(event: Event): void { this.moduleSearch.set((event.target as HTMLInputElement).value); }
  updateFeatureSearch(event: Event): void { this.featureSearch.set((event.target as HTMLInputElement).value); }

  addModule(): void {
    if (!this.canManage) return;
    this.moduleForm.reset({ name: '', key: '', sortOrder: 10, isActive: true });
    this.saveError.set(null); this.editor.set({ kind: 'module', mode: 'create', module: null });
  }

  editModule(): void {
    if (!this.canManage) return;
    const module = this.selectedModule(); if (!module) return;
    this.moduleForm.reset({ name: module.name, key: module.key, sortOrder: module.sortOrder, isActive: module.isActive });
    this.saveError.set(null); this.editor.set({ kind: 'module', mode: 'edit', module });
  }

  addFeature(): void {
    if (!this.canManage || !this.selectedModule()) return;
    this.featureForm.reset({ name: '', key: '', route: '', iconKey: '', parentFeatureId: null, sortOrder: 10, isActive: true });
    this.saveError.set(null); this.editor.set({ kind: 'feature', mode: 'create', feature: null });
  }

  editFeature(feature: ModuleFeatureItem): void {
    if (!this.canManage) return;
    this.featureForm.reset({ name: feature.name, key: feature.key, route: feature.route, iconKey: feature.iconKey, parentFeatureId: feature.parentFeatureId, sortOrder: feature.sortOrder, isActive: feature.isActive });
    this.saveError.set(null); this.editor.set({ kind: 'feature', mode: 'edit', feature });
  }

  closeEditor(): void { if (!this.saving()) this.editor.set(null); }

  save(): void {
    const state = this.editor();
    if (!state || this.saving() || !this.canManage) return;
    state.kind === 'module' ? this.saveModule(state) : this.saveFeature(state);
  }

  private saveModule(state: Extract<EditorState, { kind: 'module' }>): void {
    this.moduleForm.markAllAsTouched(); if (this.moduleForm.invalid) return;
    const request: NavigationModuleRequest = this.moduleForm.getRawValue();
    const operation = state.mode === 'create' ? this.api.createModule(request) : this.api.updateModule(state.module!.id, request);
    this.executeSave(operation, state.module?.id ?? null);
  }

  private saveFeature(state: Extract<EditorState, { kind: 'feature' }>): void {
    this.featureForm.markAllAsTouched(); if (this.featureForm.invalid) return;
    const moduleId = this.selectedModuleId(); if (moduleId === null) return;
    const request: NavigationFeatureRequest = { moduleId, ...this.featureForm.getRawValue() };
    const operation = state.mode === 'create' ? this.api.createFeature(request) : this.api.updateFeature(state.feature!.id, request);
    this.executeSave(operation, moduleId);
  }

  private executeSave(operation: ReturnType<ModuleFeatureApiService['createModule']>, moduleId: number | null): void {
    this.saving.set(true); this.saveError.set(null);
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (result) => { this.editor.set(null); this.load(moduleId ?? result.id); },
      error: (error: HttpErrorResponse) => this.saveError.set(this.getErrorMessage(error)),
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) return error.error?.title ?? 'This key or route is already in use.';
    if (error.status === 400) return error.error?.title ?? 'Check the entered values and try again.';
    if (error.status === 403) return 'You do not have permission to make this change.';
    return 'The change could not be saved. Please try again.';
  }
}
