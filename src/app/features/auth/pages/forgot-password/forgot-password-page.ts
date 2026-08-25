import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
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
  private readonly authApi = inject(AuthApiService);

  readonly submissionAttempted = signal(false);
  readonly requestSubmitted = signal(false);
  readonly isSubmitting = signal(false);
  readonly requestFailed = signal(false);

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

  async submit(): Promise<void> {
    this.submissionAttempted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.requestFailed.set(false);
    try {
      await firstValueFrom(
        this.authApi.requestPasswordReset(this.form.controls.email.value),
      );
      this.requestSubmitted.set(true);
    } catch {
      this.requestFailed.set(true);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  useAnotherEmail(): void {
    this.form.reset({
      email: '',
    });

    this.submissionAttempted.set(false);
    this.requestSubmitted.set(false);
    this.requestFailed.set(false);
  }
}
