import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-client-wizard-stepper',
  standalone: true,
  templateUrl: './client-wizard-stepper.html',
  styleUrl: './client-wizard-stepper.css',
})
export class ClientWizardStepperComponent {
  readonly steps = input.required<readonly { readonly title: string }[]>();
  readonly activeIndex = input.required<number>();
  readonly interactive = input(false);
  readonly ariaLabel = input('Client workflow progress');
  readonly stepSelected = output<number>();

  select(index: number): void {
    if (this.interactive()) this.stepSelected.emit(index);
  }
}
