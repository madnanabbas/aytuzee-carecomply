import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FormTemplateApiService } from '../../data-access/form-template-api.service';
import { FormTemplateMappingSet } from '../../models/form-template.models';
import { FormTemplateMappingPageComponent } from './form-template-mapping-page';

describe('FormTemplateMappingPageComponent', () => {
  const api = {
    getMappings: vi.fn(),
    getBindingCatalog: vi.fn(),
    saveMappings: vi.fn(),
    preview: vi.fn(),
    getContent: vi.fn(),
    publish: vi.fn(),
  };

  beforeEach(() => {
    api.getMappings.mockReturnValue(of(mappingFixture()));
    api.getBindingCatalog.mockReturnValue(
      of({
        groups: [
          {
            label: 'Client',
            items: [
              { key: 'client.firstName', label: 'First name', allowedPdfFieldTypes: ['Text'] },
            ],
          },
        ],
      }),
    );
    api.saveMappings.mockReturnValue(of(mappingFixture()));
    api.publish.mockReturnValue(of({ ...mappingFixture(), status: 'Published' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FormTemplateApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'templateId' ? 'template-1' : 'version-1'),
              },
            },
          },
        },
      ],
    });
  });

  it('renders every mapping and clearly marks advisory suggestions', () => {
    const fixture = TestBed.createComponent(FormTemplateMappingPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Client Signature');
    expect(fixture.nativeElement.textContent).toContain('Suggested: Signature');
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('requires explicit warning acknowledgement before publishing', () => {
    const fixture = TestBed.createComponent(FormTemplateMappingPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.showPublish.set(true);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(dialog.textContent).toContain('Review before publishing');
    const publish = [...dialog.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Publish version',
    ) as HTMLButtonElement;
    expect(publish.disabled).toBe(true);
  });

  it('shows published mappings read-only and hides save and publish actions', () => {
    api.getMappings.mockReturnValueOnce(of({ ...mappingFixture(), status: 'Published' }));
    const fixture = TestBed.createComponent(FormTemplateMappingPageComponent);
    fixture.detectChanges();
    const copy = fixture.nativeElement.textContent as string;
    expect(copy).toContain('published version is read-only');
    expect(copy).not.toContain('Save mappings');
    expect(copy).not.toContain('Publish version');
  });

  function mappingFixture(): FormTemplateMappingSet {
    return {
      templateId: 'template-1',
      templateKey: 'dhs-6893f',
      versionId: 'version-1',
      versionNumber: 1,
      status: 'Draft',
      requiresWarningAcknowledgement: true,
      isReviewed: false,
      rowVersion: 'AQID',
      mappings: [
        {
          id: 'field-1',
          pdfFieldName: 'FirstName',
          pdfFieldType: 'Text',
          fieldPurpose: 'Manual',
          bindingKey: null,
          suggestedPurpose: null,
        },
        {
          id: 'field-2',
          pdfFieldName: 'Client Signature',
          pdfFieldType: 'Text',
          fieldPurpose: 'Manual',
          bindingKey: null,
          suggestedPurpose: 'Signature',
        },
      ],
    };
  }
});
