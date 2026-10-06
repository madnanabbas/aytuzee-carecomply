import { TestBed } from '@angular/core/testing';
import { ClientWizardStepperComponent } from './client-wizard-stepper';

describe('ClientWizardStepperComponent', () => {
  const steps = [
    { title: 'Basic details' },
    { title: 'Additional information' },
    { title: 'Contact information' },
  ];

  it('renders canonical numbered circles and semantic active/completed states', async () => {
    await TestBed.configureTestingModule({
      imports: [ClientWizardStepperComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientWizardStepperComponent);
    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('activeIndex', 1);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(
      Array.from(element.querySelectorAll('.client-wizard-step-number')).map((item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['1', '2', '3']);
    expect(element.textContent).not.toMatch(/\b0[123]\b/);
    expect(element.querySelector('li.completed')?.textContent).toContain('Basic details');
    expect(element.querySelector('li[aria-current="step"]')?.textContent).toContain(
      'Additional information',
    );
    expect(element.querySelector('.client-wizard-mobile-step')?.textContent).toContain(
      'Step 2 of 3',
    );
  });

  it('emits selection only when parent navigation is enabled', async () => {
    await TestBed.configureTestingModule({
      imports: [ClientWizardStepperComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientWizardStepperComponent);
    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('activeIndex', 0);
    fixture.componentRef.setInput('interactive', true);
    const selected = vi.fn();
    fixture.componentInstance.stepSelected.subscribe(selected);
    fixture.detectChanges();

    fixture.nativeElement.querySelectorAll('button')[2].click();
    expect(selected).toHaveBeenCalledWith(2);
  });
});
