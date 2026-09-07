import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../core/authorization/authorization.service';
import { Permissions } from '../../../core/authorization/permissions';
import { Company, CompanyService } from './company.service';

@Component({ selector: 'app-company-page', standalone: true, imports: [ReactiveFormsModule], templateUrl: './company-page.html', styleUrls: ['../users/user-density.css'] })
export class CompanyPage {
  private readonly api = inject(CompanyService); private readonly fb = inject(FormBuilder); private readonly auth = inject(AuthorizationService);
  readonly companies = signal<readonly Company[]>([]); readonly loading = signal(true); readonly saving = signal(false); readonly error = signal<string | null>(null); readonly editor = signal<Company | 'new' | null>(null);
  readonly canCreate = computed(() => this.auth.hasPermission(Permissions.Company.Create)); readonly canEdit = computed(() => this.auth.hasPermission(Permissions.Company.Edit)); readonly canDelete = computed(() => this.auth.hasPermission(Permissions.Company.Delete));
  readonly form = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(200)]], code: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9-]+$/)]], isActive: [true] });
  constructor() { this.load(); }
  open(company?: Company) { this.editor.set(company ?? 'new'); this.error.set(null); this.form.reset({ name: company?.name ?? '', code: company?.code ?? '', isActive: company?.isActive ?? true }); }
  close() { if (!this.saving()) this.editor.set(null); }
  save() { if (this.form.invalid) { this.form.markAllAsTouched(); return; } const selected = this.editor(); if (!selected) return; this.saving.set(true); const value = this.form.getRawValue(); const request = selected === 'new' ? this.api.create(value) : this.api.update(selected.id, { ...value, editorVersion: selected.editorVersion }); request.pipe(finalize(() => this.saving.set(false))).subscribe({ next: () => { this.editor.set(null); this.load(); }, error: (e) => this.error.set(e.error?.title ?? 'The company could not be saved.') }); }
  remove(company: Company) { if (!confirm(`Delete ${company.name}? Companies with users or clients cannot be deleted.`)) return; this.api.delete(company.id).subscribe({ next: () => this.load(), error: (e) => this.error.set(e.error?.title ?? 'The company could not be deleted.') }); }
  private load() { this.loading.set(true); this.api.list().pipe(finalize(() => this.loading.set(false))).subscribe({ next: x => this.companies.set(x), error: () => this.error.set('Companies could not be loaded.') }); }
}
