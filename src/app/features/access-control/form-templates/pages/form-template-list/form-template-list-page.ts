import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { FormTemplateUploadComponent } from '../../components/form-template-upload/form-template-upload';
import { FormTemplateApiService } from '../../data-access/form-template-api.service';
import { FormTemplateSummary } from '../../models/form-template.models';

@Component({
  selector: 'app-form-template-list-page',
  standalone: true,
  imports: [DatePipe, RouterLink, FormTemplateUploadComponent],
  templateUrl: './form-template-list-page.html',
})
export class FormTemplateListPageComponent {
  private readonly api = inject(FormTemplateApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly authSession = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly templates = signal<readonly FormTemplateSummary[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly showUpload = signal(false);
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
      .listTemplates()
      .pipe(
        catchError(() => {
          this.loadFailed.set(true);
          return of([] as readonly FormTemplateSummary[]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((templates) => {
        this.templates.set(templates);
        this.loading.set(false);
      });
  }
}
