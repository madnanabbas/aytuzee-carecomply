import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, Observable, of, switchMap } from 'rxjs';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { Company, CompanyLookupService } from '../../../../../core/lookups/company-lookup.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { SuccessDialogComponent } from '../../../../../shared/components/success-dialog/success-dialog';
import { PermissionMatrixComponent } from '../../components/permission-matrix/permission-matrix';
import { RoleManagementService } from '../../data-access/role-management.service';
import {
  ModulePermissionGroup,
  RoleEditorError,
  RoleEditorModel,
} from '../../models/role-management.models';
import { RoleDetailsSectionComponent } from './role-details-section';
import {
  mapRoleError,
  normalizeDescription,
  setsEqual,
  sortedPermissionIds,
} from './role-editor.helpers';

@Component({
  selector: 'app-role-editor-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PermissionMatrixComponent,
    SuccessDialogComponent,
    RoleDetailsSectionComponent,
  ],
  templateUrl: './role-editor-page.html',
  styleUrls: ['../../../users/user-density.css'],
})
export class RoleEditorPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleManagementService);
  private readonly authorization = inject(AuthorizationService);
  private readonly session = inject(AuthSessionService);
  private readonly companiesApi = inject(CompanyLookupService);
  readonly isPlatformAdministrator = computed(
    () => this.session.currentUser()?.isPlatformAdministrator === true,
  );
  readonly companies = signal<readonly Company[]>([]);

  readonly roleId = this.route.snapshot.paramMap.get('roleId');
  readonly isCreateMode = computed(() => !this.roleId);
  readonly canManage = computed(() => this.authorization.hasPermission(Permissions.Role.Manage));

  readonly permissionCatalog = signal<readonly ModulePermissionGroup[]>([]);
  readonly selectedPermissionIds = signal<ReadonlySet<number>>(new Set<number>());
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<RoleEditorError | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly completionDialog = signal<{ readonly title: string; readonly message: string } | null>(
    null,
  );

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    companyId: [''],
  });

  private loadedRole: RoleEditorModel | null = null;
  private initialPermissionIds = new Set<number>();

  readonly permissionsChanged = computed(
    () => !setsEqual(this.selectedPermissionIds(), this.initialPermissionIds),
  );

  readonly hasChanges = computed(
    () => this.isCreateMode() || this.form.dirty || this.permissionsChanged(),
  );

  constructor() {
    if (this.isCreateMode() && this.isPlatformAdministrator()) {
      this.form.controls.companyId.addValidators(Validators.required);
      this.companiesApi
        .list()
        .subscribe((companies) => this.companies.set(companies.filter((x) => x.isActive)));
    }
    if (!this.isCreateMode() && !this.canManage()) {
      this.form.disable({ emitEvent: false });
    }

    this.load();
  }

  updatePermissions(permissionIds: ReadonlySet<number>): void {
    if (!this.canManage()) {
      return;
    }

    this.selectedPermissionIds.set(new Set(permissionIds));
    this.successMessage.set(null);
  }

  cancel(): void {
    void this.router.navigate(['/access-control/roles']);
  }

  reload(): void {
    this.load();
  }

  save(): void {
    if (!this.canManage()) {
      return;
    }

    this.form.markAllAsTouched();

    if (this.form.invalid || this.saving()) {
      return;
    }

    this.error.set(null);
    this.successMessage.set(null);
    this.saving.set(true);

    if (this.isCreateMode()) {
      this.createRole();
      return;
    }

    const roleId = this.roleId;
    const loadedRole = this.loadedRole;

    if (!roleId || !loadedRole) {
      this.saving.set(false);
      this.error.set('failed');
      return;
    }

    const generalChanged = this.form.dirty;
    const permissionsChanged = this.permissionsChanged();

    if (!generalChanged && !permissionsChanged) {
      this.saving.set(false);
      return;
    }

    const updateGeneral$: Observable<RoleEditorModel> = generalChanged
      ? this.roleService.updateGeneral(roleId, {
          name: this.form.controls.name.value.trim(),
          description: normalizeDescription(this.form.controls.description.value),
          editorVersion: loadedRole.editorVersion,
        })
      : of(loadedRole);

    updateGeneral$
      .pipe(
        switchMap((roleAfterGeneral) =>
          permissionsChanged
            ? this.roleService.replacePermissions(roleId, {
                permissionIds: sortedPermissionIds(this.selectedPermissionIds()),
                editorVersion: roleAfterGeneral.editorVersion,
              })
            : of(roleAfterGeneral),
        ),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (role) => {
          this.applyRole(role);
          if (permissionsChanged) {
            void this.session.refreshPermissionsAndNavigation().catch(() => {
              this.successMessage.set(
                'Permissions were saved. Refresh the page to update your navigation.',
              );
            });
          }
          this.completionDialog.set({
            title: 'Role updated successfully',
            message: 'The role details and assigned permissions were saved successfully.',
          });
        },
        error: (error: HttpErrorResponse) => this.error.set(mapRoleError(error)),
      });
  }

  confirmCompletion(): void {
    if (!this.completionDialog()) return;
    this.completionDialog.set(null);
    void this.router.navigate(['/access-control/roles']);
  }

  private createRole(): void {
    this.roleService
      .createRole({
        companyId: this.isPlatformAdministrator()
          ? this.form.controls.companyId.value || null
          : null,
        name: this.form.controls.name.value.trim(),
        description: normalizeDescription(this.form.controls.description.value),
        permissionIds: sortedPermissionIds(this.selectedPermissionIds()),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (_role) => {
          this.completionDialog.set({
            title: 'Role created successfully',
            message: 'The new role and its assigned permissions were created successfully.',
          });
        },
        error: (error: HttpErrorResponse) => this.error.set(mapRoleError(error)),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    if (this.isCreateMode()) {
      this.roleService
        .getPermissionCatalog()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (catalog) => {
            this.permissionCatalog.set(catalog);
            this.selectedPermissionIds.set(new Set<number>());
            this.initialPermissionIds = new Set<number>();
          },
          error: (_error: HttpErrorResponse) => this.error.set('failed'),
        });
      return;
    }

    const roleId = this.roleId;
    if (!roleId) {
      this.loading.set(false);
      this.error.set('notFound');
      return;
    }

    forkJoin({
      role: this.roleService.getRole(roleId),
      catalog: this.roleService.getPermissionCatalog(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ role, catalog }) => {
          this.permissionCatalog.set(catalog);
          this.applyRole(role);
        },
        error: (error: HttpErrorResponse) => this.error.set(mapRoleError(error)),
      });
  }

  private applyRole(role: RoleEditorModel): void {
    this.loadedRole = role;
    this.form.reset(
      {
        name: role.name,
        description: role.description,
      },
      { emitEvent: false },
    );

    if (!this.canManage()) {
      this.form.disable({ emitEvent: false });
    }

    this.initialPermissionIds = new Set(role.permissionIds);
    this.selectedPermissionIds.set(new Set(role.permissionIds));
  }
}
