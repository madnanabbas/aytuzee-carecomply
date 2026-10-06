import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuthenticatedLandingService } from '../../../../core/auth/authenticated-landing.service';
import { BrandLogoComponent } from '../../../../shared/components/brand-logo/brand-logo';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [BrandLogoComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: '../../auth-density.css',
})
export class LoginPageComponent {
  private readonly session = inject(AuthSessionService);
  private readonly landing = inject(AuthenticatedLandingService);
  private readonly router = inject(Router);

  readonly passwordVisible = signal(false);
  readonly isSubmitting = signal(false);
  readonly submissionAttempted = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  togglePasswordVisibility(): void {
    this.passwordVisible.update((isVisible) => !isVisible);
  }

  async submit(): Promise<void> {
    this.submissionAttempted.set(true);
    this.errorMessage.set(null);

    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const result = await this.session.login(this.loginForm.getRawValue());

      switch (result.status) {
        case 'succeeded':
          await this.router.navigateByUrl(this.landing.firstAllowedPath());
          break;
        case 'invalidCredentials':
          this.errorMessage.set('Email or password is incorrect.');
          break;
        case 'rateLimited':
          this.errorMessage.set('Too many sign-in attempts. Please wait and try again.');
          break;
        case 'mfaRequired':
          await this.router.navigate(['/auth/mfa']);
          break;
        case 'mfaEnrollmentRequired':
          await this.router.navigate(['/auth/mfa/setup']);
          break;
        case 'unavailable':
          this.errorMessage.set("We couldn't sign you in right now. Please try again.");
          break;
      }
    } finally {
      this.loginForm.controls.password.setValue('');
      this.isSubmitting.set(false);
    }
  }
}
