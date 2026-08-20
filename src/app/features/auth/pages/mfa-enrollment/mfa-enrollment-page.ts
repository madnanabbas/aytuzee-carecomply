import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuthenticatedLandingService } from '../../../../core/auth/authenticated-landing.service';
import { MfaEnrollmentResponse } from '../../../../core/auth/auth.models';
import { BrandLogoComponent } from '../../../../shared/components/brand-logo/brand-logo';

@Component({
  selector: 'app-mfa-enrollment-page',
  standalone: true,
  imports: [ReactiveFormsModule, BrandLogoComponent],
  templateUrl: './mfa-enrollment-page.html',
})
export class MfaEnrollmentPageComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly landing = inject(AuthenticatedLandingService);
  private readonly router = inject(Router);

  readonly enrollment = signal<MfaEnrollmentResponse | null>(null);
  readonly recoveryCodes = signal<readonly string[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly submissionAttempted = signal(false);
  readonly codesSaved = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly verificationForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(32)],
    }),
  });

  ngOnInit(): void {
    void this.loadEnrollment();
  }

  async loadEnrollment(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const result = await this.session.beginMfaEnrollment();
    this.isLoading.set(false);

    if (result.status === 'succeeded') {
      this.enrollment.set(result.enrollment);
    } else if (result.status === 'expired') {
      await this.router.navigate(['/auth/login']);
    } else {
      this.errorMessage.set("We couldn't prepare authenticator setup. Please try again.");
    }
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
      const result = await this.session.confirmMfaEnrollment(
        this.verificationForm.controls.code.value,
      );
      switch (result.status) {
        case 'succeeded':
          this.enrollment.set(null);
          this.recoveryCodes.set(result.recoveryCodes);
          break;
        case 'invalid':
          this.errorMessage.set('The verification code is invalid or has expired.');
          break;
        case 'rateLimited':
          this.errorMessage.set('Too many verification attempts. Please wait and try again.');
          break;
        case 'expired':
          await this.router.navigate(['/auth/login']);
          break;
        case 'unavailable':
          this.errorMessage.set("We couldn't enable multi-factor authentication right now.");
          break;
      }
    } finally {
      this.verificationForm.reset();
      this.isSubmitting.set(false);
    }
  }

  setCodesSaved(event: Event): void {
    this.codesSaved.set((event.target as HTMLInputElement).checked);
  }

  async continueToApplication(): Promise<void> {
    if (this.codesSaved()) {
      await this.router.navigateByUrl(this.landing.firstAllowedPath());
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
