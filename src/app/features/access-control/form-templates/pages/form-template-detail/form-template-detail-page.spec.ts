import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { AuthorizationService } from '../../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../../core/authorization/permissions';
import { FormTemplateApiService } from '../../data-access/form-template-api.service';
import { FormTemplate } from '../../models/form-template.models';
import { FormTemplateDetailPageComponent } from './form-template-detail-page';

describe('FormTemplateDetailPageComponent', () => {
  const currentUser = signal({ isPlatformAdministrator: true });
  const api = {
    getTemplate: vi.fn(),
    listFields: vi.fn().mockReturnValue(of([])),
    retireVersion: vi.fn().mockReturnValue(of({ template: null, version: null, warnings: [] })),
  };

  beforeEach(() => {
    api.getTemplate.mockReset();
    api.getTemplate.mockReturnValue(of(templateFixture()));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FormTemplateApiService, useValue: api },
        { provide: AuthSessionService, useValue: { currentUser } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'template-1' } } },
        },
      ],
    });
    TestBed.inject(AuthorizationService).setPermissions([
      Permissions.FormTemplate.View,
      Permissions.FormTemplate.Manage,
    ]);
  });

  it('renders the Draft visibility note, labels/icons, and no Publish button', () => {
    const fixture = TestBed.createComponent(FormTemplateDetailPageComponent);
    fixture.detectChanges();
    const copy = fixture.nativeElement.textContent as string;
    expect(copy).toContain('Draft: not visible to staff until published.');
    expect(copy).toContain('Draft');
    expect(copy).toContain('Published');
    expect(copy).not.toContain('Publish button');
    expect(
      [...fixture.nativeElement.querySelectorAll('button')].some(
        (button: HTMLButtonElement) => button.textContent?.trim() === 'Publish',
      ),
    ).toBe(false);
  });

  it('requires confirmation before retiring and calls the exact version', () => {
    const fixture = TestBed.createComponent(FormTemplateDetailPageComponent);
    fixture.detectChanges();
    const published = fixture.componentInstance.template()!.versions[1];
    fixture.componentInstance.retireCandidate.set(published);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(api.retireVersion).not.toHaveBeenCalled();
    fixture.componentInstance.retire();
    expect(api.retireVersion).toHaveBeenCalledWith('template-1', 'version-2');
  });

  it('hides mapping management actions from non-platform users', () => {
    currentUser.set({ isPlatformAdministrator: false });
    const fixture = TestBed.createComponent(FormTemplateDetailPageComponent);
    fixture.detectChanges();
    const copy = fixture.nativeElement.textContent as string;
    expect(copy).not.toContain('Map fields');
    expect(copy).not.toContain('View mappings');
    currentUser.set({ isPlatformAdministrator: true });
  });

  function templateFixture(): FormTemplate {
    const base = {
      templateId: 'template-1',
      originalFileName: 'template.pdf',
      contentType: 'application/pdf',
      sizeBytes: 100,
      sha256: 'hash',
      pageCount: 2,
      technology: 'AcroForm',
      effectiveFrom: null,
      effectiveTo: null,
      uploadedAtUtc: '2026-11-09T12:00:00Z',
      fieldCount: 4,
    } as const;
    return {
      id: 'template-1',
      key: 'dhs',
      name: 'DHS Form',
      description: 'Description',
      category: 'PCA',
      ownerType: 'Platform',
      companyId: null,
      isActive: true,
      createdAtUtc: '2026-11-09T12:00:00Z',
      versions: [
        { ...base, id: 'version-1', versionNumber: 1, status: 'Draft' },
        { ...base, id: 'version-2', versionNumber: 2, status: 'Published' },
      ],
    };
  }
});
