import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuthenticatedLandingService } from '../../../../core/auth/authenticated-landing.service';
import { BrandLogoComponent } from '../../../../shared/components/brand-logo/brand-logo';

@Component({
  selector: 'app-mfa-challenge-page',
  standalone: true,
  imports: [ReactiveFormsModule, BrandLogoComponent],
  templateUrl: './mfa-challenge-page.html',
})
export class MfaChallengePageComponent {
  private readonly session = inject(AuthSessionService);
  private readonly landing = inject(AuthenticatedLandingService);
  private readonly router = inject(Router);

  readonly recoveryMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly submissionAttempted = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly verificationForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(64)],
    }),
  });

  switchMode(): void {
    this.recoveryMode.update((enabled) => !enabled);
    this.verificationForm.reset();
    this.submissionAttempted.set(false);
    this.errorMessage.set(null);
  }

  async submit(): Promise<void> {
    this.submissionAttempted.set(true);
    this.errorMessage.set(null);
    if (this.verificationForm.invalid || this.isSubmitting()) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      const code = this.verificationForm.controls.code.value;
      const result = this.recoveryMode()
        ? await this.session.verifyMfaRecoveryCode(code)
        : await this.session.verifyMfa(code);

      switch (result.status) {
        case 'succeeded':
          await this.router.navigateByUrl(this.landing.firstAllowedPath());
          break;
        case 'invalid':
          this.errorMessage.set(this.recoveryMode()
            ? 'The recovery code is invalid or has already been used.'
            : 'The verification code is invalid or has expired.');
          break;
        case 'rateLimited':
          this.errorMessage.set('Too many verification attempts. Please wait and try again.');
          break;
        case 'expired':
          await this.router.navigate(['/auth/login']);
          break;
        case 'unavailable':
          this.errorMessage.set("We couldn't verify your identity right now. Please try again.");
          break;
      }
    } finally {
      this.verificationForm.reset();
      this.isSubmitting.set(false);
    }
  }

  async backToSignIn(): Promise<void> {
    try {
      await this.session.cancelMfa();
    } finally {
      await this.router.navigate(['/auth/login']);
    }
  }
}
