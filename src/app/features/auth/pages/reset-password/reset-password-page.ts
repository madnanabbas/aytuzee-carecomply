import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import {
  LucideArrowLeft,
  LucideCheck,
  LucideCheckCircle2,
  LucideEye,
  LucideEyeOff,
  LucideKeyRound,
  LucideLockKeyhole,
} from '@lucide/angular';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordsMismatch: true };
};

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideCheck,
    LucideCheckCircle2,
    LucideEye,
    LucideEyeOff,
    LucideKeyRound,
    LucideLockKeyhole,
  ],
  templateUrl: './reset-password-page.html',
})
export class ResetPasswordPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly submissionAttempted = signal(false);
  readonly isSubmitting = signal(false);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  /**
   * Frontend preview only.
   *
   * Later set only after the API successfully resets the password.
   */
  readonly resetCompleted = signal(false);

  readonly email =
    this.route.snapshot.queryParamMap.get('email') ?? '';

  readonly token =
    this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly resetLinkPresent = computed(
    () =>
      this.email.trim().length > 0 &&
      this.token.trim().length > 0,
  );

  readonly form = new FormBuilder().nonNullable.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(128),
        ],
      ],

      confirmPassword: [
        '',
        Validators.required,
      ],
    },
    {
      validators: passwordsMatchValidator,
    },
  );

  submit(): void {
    this.submissionAttempted.set(true);

    if (!this.resetLinkPresent()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Frontend-only preview.
    //
    // Later send:
    // {
    //   email: this.email,
    //   token: this.token,
    //   newPassword: this.form.controls.password.value
    // }
    //
    // Backend must validate the reset token.

    this.resetCompleted.set(true);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(
      (visible) => !visible,
    );
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update(
      (visible) => !visible,
    );
  }
}