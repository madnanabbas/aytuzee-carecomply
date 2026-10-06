import { Component, input } from '@angular/core';

@Component({
  selector: 'app-public-intake-message',
  standalone: true,
  template: `
    <div class="state-panel" [attr.data-testid]="testId()">
      <span class="status-icon" aria-hidden="true">!</span>
      <h1>{{ title() }}</h1>
      <p>{{ message() }}</p>
    </div>
  `,
  styles: `
    .state-panel {
      padding: 1.5rem;
      text-align: center;
    }
    .status-icon {
      display: inline-flex;
      width: 2.5rem;
      height: 2.5rem;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      background: #fff4e5;
      color: #9a5a00;
      font-weight: 700;
    }
    h1 {
      margin: 0.75rem 0 0;
      color: #10233f;
      font-size: 1.25rem;
    }
    p {
      margin: 0.4rem auto 0;
      max-width: 30rem;
      color: #5f6f85;
      font-size: 0.75rem;
      line-height: 1.5;
    }
  `,
})
export class PublicIntakeMessageComponent {
  readonly testId = input.required<string>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
