import { TestBed } from '@angular/core/testing';
import { FormTemplateApiService } from '../../data-access/form-template-api.service';
import { FormTemplateUploadComponent } from './form-template-upload';

describe('FormTemplateUploadComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: FormTemplateApiService, useValue: {} }],
    });
  });

  it('shows both approved server warnings in plain language without server messages', () => {
    const fixture = TestBed.createComponent(FormTemplateUploadComponent);
    fixture.componentInstance.result.set({
      template: null,
      version: {
        id: 'version-1',
        templateId: 'template-1',
        versionNumber: 1,
        status: 'Draft',
        originalFileName: 'private.pdf',
        contentType: 'application/pdf',
        sizeBytes: 100,
        sha256: 'hash',
        pageCount: 1,
        technology: 'HybridXfaAcroForm',
        effectiveFrom: null,
        effectiveTo: null,
        uploadedAtUtc: '2026-11-09T12:00:00Z',
        fieldCount: 35,
      },
      warnings: [
        { code: 'hybrid-xfa', message: 'raw hybrid parser message' },
        { code: 'adobe-version-check-scripts', message: 'raw script details' },
      ],
    });
    fixture.detectChanges();
    const copy = fixture.nativeElement.textContent as string;
    expect(copy).toContain('Review before publishing');
    expect(copy).toContain('hybrid XFA/AcroForm');
    expect(copy).toContain('Standard Adobe version-check scripts');
    expect(copy).not.toContain('raw hybrid parser message');
    expect(copy).not.toContain('raw script details');
  });

  it('requires category for new templates and omits inherited fields for a new version', () => {
    const newFixture = TestBed.createComponent(FormTemplateUploadComponent);
    newFixture.detectChanges();
    expect(newFixture.nativeElement.querySelector('input[name="category"]')?.required).toBe(true);
    expect(newFixture.nativeElement.querySelector('input[name="category"]')?.maxLength).toBe(100);

    const versionFixture = TestBed.createComponent(FormTemplateUploadComponent);
    versionFixture.componentInstance.mode = 'version';
    versionFixture.detectChanges();
    expect(versionFixture.nativeElement.querySelector('input[name="category"]')).toBeNull();
    expect(versionFixture.nativeElement.textContent).toContain('inherited from the template');
  });
});
