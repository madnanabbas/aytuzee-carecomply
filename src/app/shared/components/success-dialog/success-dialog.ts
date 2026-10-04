import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { LucideCheck } from '@lucide/angular';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [LucideCheck],
  templateUrl: './success-dialog.html',
})
export class SuccessDialogComponent {
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  readonly open = input(false);
  readonly title = input('Saved successfully');
  readonly message = input('Your changes have been saved successfully.');
  readonly confirmLabel = input('OK');
  readonly confirmed = output<void>();

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      queueMicrotask(() => this.confirmButton()?.nativeElement.focus());
    });
  }
}
