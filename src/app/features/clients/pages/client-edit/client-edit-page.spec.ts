import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { NEVER } from 'rxjs';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientEditPageComponent } from './client-edit-page';

describe('ClientEditPageComponent wizard navigation', () => {
  it('renders the canonical vertical sidebar and keeps the right-side form and footer', async () => {
    await TestBed.configureTestingModule({
      imports: [ClientEditPageComponent],
      providers: [
        provideRouter([]),
        { provide: ClientApiService, useValue: { getClient: () => NEVER } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: 'client-1' }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientEditPageComponent);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-client-wizard-sidebar')).toBeTruthy();
    expect(element.querySelector('app-client-wizard-stepper')).toBeNull();
    expect(element.querySelectorAll('.client-wizard-sidebar li')).toHaveLength(10);
    expect(element.querySelector('[aria-current="step"]')?.textContent).toContain('Basic details');
    expect(element.textContent).toContain('Client identity');
    expect(element.textContent).toContain('Save changes');
  });

  it('keeps direct step selection and maps Contact information to its existing fields', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: { getClient: () => NEVER } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: 'client-1' }) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new ClientEditPageComponent());
    expect(page.section()).toBe('basic');

    page.selectSection(2);

    expect(page.section()).toBe('contact');
    expect(page.activeStepIndex()).toBe(2);
  });
});
