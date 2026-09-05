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
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
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
  styleUrl: '../../auth-density.css',
})
export class ResetPasswordPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);

  readonly submissionAttempted = signal(false);
  readonly isSubmitting = signal(false);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);
  readonly resetCompleted = signal(false);
  readonly resetFailed = signal(false);

  readonly userId =
    this.route.snapshot.queryParamMap.get('userId') ?? '';

  readonly token =
    this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly resetLinkPresent = computed(
    () =>
      this.userId.trim().length > 0 &&
      this.token.trim().length > 0,
  );

  readonly form = new FormBuilder().nonNullable.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(15),
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

  async submit(): Promise<void> {
    this.submissionAttempted.set(true);

    if (!this.resetLinkPresent()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.resetFailed.set(false);
    try {
      await firstValueFrom(this.authApi.resetPassword({
        userId: this.userId,
        token: this.token,
        newPassword: this.form.controls.password.value,
        confirmPassword: this.form.controls.confirmPassword.value,
      }));
      this.form.reset({ password: '', confirmPassword: '' });
      this.resetCompleted.set(true);
    } catch {
      this.form.reset({ password: '', confirmPassword: '' });
      this.resetFailed.set(true);
    } finally {
      this.isSubmitting.set(false);
    }
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
