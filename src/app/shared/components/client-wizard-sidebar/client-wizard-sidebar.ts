import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-client-wizard-sidebar',
  standalone: true,
  templateUrl: './client-wizard-sidebar.html',
  styleUrl: './client-wizard-sidebar.css',
})
export class ClientWizardSidebarComponent {
  readonly steps = input.required<readonly { readonly title: string }[]>();
  readonly activeIndex = input.required<number>();
  readonly maximumEnabledIndex = input<number | null>(null);
  readonly ariaLabel = input('Client workflow steps');
  readonly stepSelected = output<number>();

  canSelect(index: number): boolean {
    const maximum = this.maximumEnabledIndex();
    return maximum === null || index <= maximum;
  }

  select(index: number): void {
    if (this.canSelect(index)) this.stepSelected.emit(index);
  }

  selectFromDropdown(event: Event): void {
    this.select(Number((event.target as HTMLSelectElement).value));
  }
}
