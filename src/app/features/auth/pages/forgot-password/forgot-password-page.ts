import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCheckCircle2,
  LucideMail,
  LucideSend,
} from '@lucide/angular';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideCheckCircle2,
    LucideMail,
    LucideSend,
  ],
  templateUrl: './forgot-password-page.html',
})
export class ForgotPasswordPageComponent {
  readonly submissionAttempted = signal(false);

  /**
   * Frontend preview only.
   *
   * Later this will only become true after the API accepts the
   * forgot-password request.
   */
  readonly requestSubmitted = signal(false);

  readonly isSubmitting = signal(false);

  readonly form = new FormBuilder().nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(256),
      ],
    ],
  });

  submit(): void {
    this.submissionAttempted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Frontend-only preview.
    // Later:
    // POST /api/auth/forgot-password
    this.requestSubmitted.set(true);
  }

  useAnotherEmail(): void {
    this.form.reset({
      email: '',
    });

    this.submissionAttempted.set(false);
    this.requestSubmitted.set(false);
  }
}