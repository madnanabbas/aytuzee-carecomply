import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../core/authorization/authorization.service';
import { Permissions } from '../../../core/authorization/permissions';
import { Payer, PayerService } from './payer.service';

@Component({
  selector: 'app-payer-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './payer-page.html',
  styleUrls: ['../users/user-density.css'],
})
export class PayerPage {
  private readonly api = inject(PayerService);
  private readonly fb = inject(FormBuilder);
  private readonly authorization = inject(AuthorizationService);
  readonly payers = signal<readonly Payer[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editor = signal<Payer | 'new' | null>(null);
  readonly canCreate = computed(() => this.authorization.hasPermission(Permissions.Payer.Create));
  readonly canEdit = computed(() => this.authorization.hasPermission(Permissions.Payer.Edit));
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    isActive: [true],
  });

  constructor() {
    this.load();
  }

  open(payer?: Payer): void {
    this.editor.set(payer ?? 'new');
    this.error.set(null);
    this.form.reset({ name: payer?.name ?? '', isActive: payer?.isActive ?? true });
  }

  close(): void {
    if (!this.saving()) this.editor.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const selected = this.editor();
    if (!selected) return;
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    const request =
      selected === 'new'
        ? this.api.create(value.name.trim())
        : this.api.update(selected, value.name.trim(), value.isActive);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.editor.set(null);
        this.load();
      },
      error: (response) => this.error.set(response.error?.title ?? 'The payer could not be saved.'),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.payers.set(items),
        error: () => this.error.set('Payers could not be loaded.'),
      });
  }
}
