import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { FormTemplateApiService } from '../../data-access/form-template-api.service';
import { FormTemplateSummary } from '../../models/form-template.models';
import { FormTemplateListPageComponent } from './form-template-list-page';

describe('FormTemplateListPageComponent', () => {
  let response: Subject<readonly FormTemplateSummary[]>;
  const api = { listTemplates: vi.fn() };
  const currentUser = signal({ isPlatformAdministrator: false });

  beforeEach(() => {
    response = new Subject();
    api.listTemplates.mockReset();
    api.listTemplates.mockReturnValue(response);
    currentUser.set({ isPlatformAdministrator: false });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FormTemplateApiService, useValue: api },
        { provide: AuthSessionService, useValue: { currentUser } },
      ],
    });
    TestBed.inject(AuthorizationService).setPermissions([Permissions.FormTemplate.View]);
  });

  it('renders loading, empty, populated and safe error states', () => {
    const fixture = TestBed.createComponent(FormTemplateListPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading form templates');
    response.next([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No form templates');

    response = new Subject();
    api.listTemplates.mockReturnValue(response);
    fixture.componentInstance.load();
    response.error(new Error('raw server detail'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Form templates could not be loaded');
    expect(fixture.nativeElement.textContent).not.toContain('raw server detail');
  });

  it('labels the latest version timestamp as Last uploaded and never renders Publish', () => {
    const fixture = TestBed.createComponent(FormTemplateListPageComponent);
    fixture.detectChanges();
    response.next([
      {
        id: 'template-1',
        key: 'dhs',
        name: 'DHS Form',
        category: 'PCA',
        ownerType: 'Platform',
        companyId: null,
        isActive: true,
        versionCount: 1,
        latestVersionNumber: 1,
        latestVersionStatus: 'Draft',
        latestVersionUploadedAtUtc: '2026-11-09T12:00:00Z',
      },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Last uploaded');
    expect(fixture.nativeElement.textContent).toContain('DHS Form');
    expect(fixture.nativeElement.textContent).not.toContain('Publish');
  });

  it('shows manage actions only with Manage permission and platform administration', () => {
    const fixture = TestBed.createComponent(FormTemplateListPageComponent);
    fixture.detectChanges();
    response.next([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Upload template');

    currentUser.set({ isPlatformAdministrator: true });
    TestBed.inject(AuthorizationService).setPermissions([
      Permissions.FormTemplate.View,
      Permissions.FormTemplate.Manage,
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Upload template');
  });
});
