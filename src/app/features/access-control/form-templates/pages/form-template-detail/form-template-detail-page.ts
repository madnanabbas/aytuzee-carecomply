import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { FormTemplateFieldListComponent } from '../../components/form-template-field-list/form-template-field-list';
import { FormTemplateUploadComponent } from '../../components/form-template-upload/form-template-upload';
import {
  FormTemplateApiService,
  formTemplateErrorMessage,
} from '../../data-access/form-template-api.service';
import {
  FormTemplate,
  FormTemplateField,
  FormTemplateVersion,
} from '../../models/form-template.models';

@Component({
  selector: 'app-form-template-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, FormTemplateFieldListComponent, FormTemplateUploadComponent],
  templateUrl: './form-template-detail-page.html',
})
export class FormTemplateDetailPageComponent {
  private readonly api = inject(FormTemplateApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly authorization = inject(AuthorizationService);
  private readonly authSession = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly templateId = this.route.snapshot.paramMap.get('templateId') ?? '';
  readonly template = signal<FormTemplate | null>(null);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly showUpload = signal(false);
  readonly selectedVersion = signal<FormTemplateVersion | null>(null);
  readonly fields = signal<readonly FormTemplateField[]>([]);
  readonly fieldsLoading = signal(false);
  readonly fieldsFailed = signal(false);
  readonly retireCandidate = signal<FormTemplateVersion | null>(null);
  readonly operationError = signal<string | null>(null);
  readonly retiring = signal(false);
  readonly canManage = computed(
    () =>
      this.authSession.currentUser()?.isPlatformAdministrator === true &&
      this.authorization.hasPermission(Permissions.FormTemplate.Manage),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api
      .getTemplate(this.templateId)
      .pipe(
        catchError(() => {
          this.loadFailed.set(true);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((template) => {
        this.template.set(template);
        this.loading.set(false);
      });
  }

  viewFields(version: FormTemplateVersion): void {
    this.selectedVersion.set(version);
    this.fields.set([]);
    this.fieldsLoading.set(true);
    this.fieldsFailed.set(false);
    this.api
      .listFields(this.templateId, version.id)
      .pipe(
        catchError(() => {
          this.fieldsFailed.set(true);
          return of([] as readonly FormTemplateField[]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((fields) => {
        this.fields.set(fields);
        this.fieldsLoading.set(false);
      });
  }

  retire(): void {
    const version = this.retireCandidate();
    if (!version || this.retiring()) return;
    this.retiring.set(true);
    this.operationError.set(null);
    this.api
      .retireVersion(this.templateId, version.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.retiring.set(false);
          this.retireCandidate.set(null);
          this.load();
        },
        error: (error: unknown) => {
          this.retiring.set(false);
          this.retireCandidate.set(null);
          this.operationError.set(formTemplateErrorMessage(error));
        },
      });
  }
}
