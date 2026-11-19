import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientDocumentApiService } from '../../data-access/client-document-api.service';
import { ClientDocumentsComponent } from './client-documents';

describe('ClientDocumentsComponent', () => {
  let fixture: ComponentFixture<ClientDocumentsComponent>;
  let permissions: Set<string>;
  const api = {
    list: vi.fn(() => of([])),
    get: vi.fn(),
    upload: vi.fn(),
    update: vi.fn(),
    replace: vi.fn(),
    archive: vi.fn(),
    download: vi.fn(),
  };

  beforeEach(async () => {
    permissions = new Set();
    api.list.mockClear();
    await TestBed.configureTestingModule({
      imports: [ClientDocumentsComponent],
      providers: [
        { provide: ClientDocumentApiService, useValue: api },
        {
          provide: AuthorizationService,
          useValue: { hasPermission: (value: string) => permissions.has(value) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClientDocumentsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.detectChanges();
  });

  it('loads the scoped list and renders the empty state', () => {
    expect(api.list).toHaveBeenCalledWith('client-1');
    expect(fixture.nativeElement.textContent).toContain('No client documents have been uploaded.');
  });

  it('shows upload only with ClientDocument.Upload', () => {
    expect(button('Upload document')).toBeUndefined();
    recreateWithUploadPermission();
    expect(button('Upload document')).toBeTruthy();
  });

  it('uses the focused editor with required metadata and accepted file types', () => {
    recreateWithUploadPermission();
    button('Upload document')!.click();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const file = element.querySelector<HTMLInputElement>('input[type=file]');
    expect(file?.accept).toContain('.pdf');
    expect(file?.accept).toContain('.png');
    expect(element.querySelector<HTMLInputElement>('input[name=title]')?.maxLength).toBe(200);
    expect(element.querySelector<HTMLInputElement>('input[name=category]')?.maxLength).toBe(100);
  });

  function button(label: string): HTMLButtonElement | undefined {
    const element = fixture.nativeElement as HTMLElement;
    return Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find(
      (item) => item.textContent?.trim() === label,
    );
  }

  function recreateWithUploadPermission(): void {
    fixture.destroy();
    permissions.add(Permissions.ClientDocument.Upload);
    fixture = TestBed.createComponent(ClientDocumentsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.detectChanges();
  }
});
