import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { PermissionMatrixComponent } from '../../components/permission-matrix/permission-matrix';
import { RoleManagementService } from '../../data-access/role-management.service';

@Component({
  selector: 'app-role-editor-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PermissionMatrixComponent,
  ],
  templateUrl: './role-editor-page.html',
})
export class RoleEditorPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleManagementService);

  readonly roleId = this.route.snapshot.paramMap.get('roleId');

  readonly isCreateMode = computed(() => !this.roleId);

  readonly permissionCatalog =
    this.roleService.getPermissionCatalog();

  readonly selectedPermissionIds =
    signal<ReadonlySet<string>>(new Set());

  readonly saving = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
      ],
    ],
    description: [
      '',
      Validators.maxLength(500),
    ],
  });

  constructor() {
    if (!this.roleId) {
      return;
    }

    const role = this.roleService.getRole(this.roleId);

    if (!role) {
      return;
    }

    this.form.patchValue({
      name: role.name,
      description: role.description,
    });

    this.selectedPermissionIds.set(
      new Set(role.permissionIds),
    );
  }

  updatePermissions(
    permissionIds: ReadonlySet<string>,
  ): void {
    this.selectedPermissionIds.set(permissionIds);
  }

  cancel(): void {
    void this.router.navigate(['/access-control/roles']);
  }

  save(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);

    // API will be added later.
    console.log({
      roleId: this.roleId,
      ...this.form.getRawValue(),
      permissionIds: [
        ...this.selectedPermissionIds(),
      ],
    });

    this.saving.set(false);
  }
}