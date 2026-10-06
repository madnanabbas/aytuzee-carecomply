import { TestBed } from '@angular/core/testing';
import { ClientWizardSidebarComponent } from './client-wizard-sidebar';

describe('ClientWizardSidebarComponent', () => {
  const steps = [
    'Basic details',
    'Additional information',
    'Contact information',
    'Primary caregivers',
    'Contacts',
    'Care coordinators',
    'Consultation providers',
    'Doctors',
    'Responsible parties',
    'Hospitalizations',
  ].map((title) => ({ title }));

  it('renders the shared Client Setup rail without numbered circles and keeps mobile progress', async () => {
    await TestBed.configureTestingModule({
      imports: [ClientWizardSidebarComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientWizardSidebarComponent);
    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('activeIndex', 2);
    fixture.componentRef.setInput('maximumEnabledIndex', 4);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const sidebar = element.querySelector('.client-wizard-sidebar');
    const active = sidebar?.querySelector('[aria-current="step"]');
    expect(sidebar?.querySelector('.client-vertical-nav-heading')?.textContent?.trim()).toBe(
      'Client setup',
    );
    expect(sidebar?.querySelectorAll('li')).toHaveLength(10);
    expect(sidebar?.querySelector('.client-wizard-sidebar-number')).toBeNull();
    expect(active?.textContent).toContain('Contact information');
    expect(active?.classList).toContain('client-vertical-nav-item');
    expect(active?.classList).toContain('active');
    expect(element.querySelectorAll('.client-wizard-sidebar button:disabled')).toHaveLength(5);
    expect(element.querySelector('.client-wizard-mobile-selector')?.textContent).toContain(
      'Step 3 of 10',
    );
    expect(element.querySelectorAll('.client-wizard-mobile-selector option')).toHaveLength(10);
    expect(element.querySelector('.client-wizard-stepper')).toBeNull();
    expect(element.querySelector('.client-wizard-horizontal-navigation')).toBeNull();
  });

  it('emits only enabled navigation selections', async () => {
    await TestBed.configureTestingModule({
      imports: [ClientWizardSidebarComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientWizardSidebarComponent);
    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('activeIndex', 0);
    fixture.componentRef.setInput('maximumEnabledIndex', 1);
    const selected = vi.fn();
    fixture.componentInstance.stepSelected.subscribe(selected);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[1].click();
    buttons[2].click();

    expect(selected).toHaveBeenCalledOnce();
    expect(selected).toHaveBeenCalledWith(1);
  });
});
