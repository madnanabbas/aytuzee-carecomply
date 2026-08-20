import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthorizationService } from '../authorization/authorization.service';
import { isPermission } from '../authorization/permissions';
import { AuthApiService } from './auth-api.service';
import {
  AuthSessionStatus,
  CurrentUser,
  CurrentUserResponse,
  LoginAttemptResult,
  LoginCredentials,
  MfaAttemptResult,
  MfaContextResult,
  MfaEnrollmentBeginResult,
  MfaEnrollmentConfirmResult,
} from './auth.models';

const AUTH_REQUEST_TIMEOUT_MS = 10_000;

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly api = inject(AuthApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);
  private readonly statusState = signal<AuthSessionStatus>('initializing');
  private readonly currentUserState = signal<CurrentUser | null>(null);
  private readonly csrfTokenState = signal<string | null>(null);
  private initializationPromise: Promise<void> | undefined;

  readonly status = this.statusState.asReadonly();
  readonly currentUser = this.currentUserState.asReadonly();
  readonly isInitialized = computed(() => this.statusState() !== 'initializing');
  readonly isAuthenticated = computed(() => this.statusState() === 'authenticated');

  initialize(): Promise<void> {
    this.initializationPromise ??= this.initializeCore();
    return this.initializationPromise;
  }

  async login(credentials: LoginCredentials): Promise<LoginAttemptResult> {
    this.clearSession('anonymous');

    try {
      const response = await firstValueFrom(
        this.api.login(credentials).pipe(timeout(AUTH_REQUEST_TIMEOUT_MS)),
      );

      if (response.status === 202) {
        if (response.body?.status === 'mfaRequired') {
          return { status: 'mfaRequired' };
        }

        if (response.body?.status === 'mfaEnrollmentRequired') {
          return { status: 'mfaEnrollmentRequired' };
        }

        return { status: 'unavailable' };
      }

      if (response.status !== 204) {
        return { status: 'unavailable' };
      }

      await this.loadAuthenticatedSession();
      return { status: 'succeeded' };
    } catch (error: unknown) {
      this.clearSession(error instanceof HttpErrorResponse && error.status === 401
        ? 'anonymous'
        : 'unavailable');

      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          return { status: 'invalidCredentials' };
        }

        if (error.status === 429) {
          return { status: 'rateLimited' };
        }
      }

      return { status: 'unavailable' };
    }
  }

  async prepareMfaContext(): Promise<MfaContextResult> {
    this.clearSession('anonymous');

    try {
      const response = await firstValueFrom(
        this.api.getMfaContext().pipe(timeout(AUTH_REQUEST_TIMEOUT_MS)),
      );
      if (
        (response.status !== 'mfaRequired' && response.status !== 'mfaEnrollmentRequired') ||
        typeof response.requestToken !== 'string' ||
        !response.requestToken
      ) {
        return { status: 'unavailable' };
      }

      this.csrfTokenState.set(response.requestToken);
      return { status: response.status };
    } catch (error: unknown) {
      this.csrfTokenState.set(null);
      return error instanceof HttpErrorResponse && error.status === 401
        ? { status: 'expired' }
        : { status: 'unavailable' };
    }
  }

  async beginMfaEnrollment(): Promise<MfaEnrollmentBeginResult> {
    try {
      const enrollment = await firstValueFrom(
        this.api.beginMfaEnrollment().pipe(timeout(AUTH_REQUEST_TIMEOUT_MS)),
      );
      if (
        typeof enrollment.manualSetupKey !== 'string' ||
        !enrollment.manualSetupKey ||
        typeof enrollment.qrCodeDataUrl !== 'string' ||
        !enrollment.qrCodeDataUrl.startsWith('data:image/png;base64,')
      ) {
        return { status: 'unavailable' };
      }

      return { status: 'succeeded', enrollment };
    } catch (error: unknown) {
      return error instanceof HttpErrorResponse && error.status === 401
        ? { status: 'expired' }
        : { status: 'unavailable' };
    }
  }

  async confirmMfaEnrollment(code: string): Promise<MfaEnrollmentConfirmResult> {
    try {
      const response = await firstValueFrom(
        this.api.confirmMfaEnrollment(code).pipe(timeout(AUTH_REQUEST_TIMEOUT_MS)),
      );
      if (
        !Array.isArray(response.recoveryCodes) ||
        response.recoveryCodes.length !== 10 ||
        response.recoveryCodes.some((recoveryCode) =>
          typeof recoveryCode !== 'string' || !recoveryCode)
      ) {
        return { status: 'unavailable' };
      }

      await this.loadAuthenticatedSession();
      return { status: 'succeeded', recoveryCodes: response.recoveryCodes };
    } catch (error: unknown) {
      return this.mapMfaError(error);
    }
  }

  async verifyMfa(code: string): Promise<MfaAttemptResult> {
    return this.completeMfa(() => this.api.verifyMfa(code));
  }

  async verifyMfaRecoveryCode(recoveryCode: string): Promise<MfaAttemptResult> {
    return this.completeMfa(() => this.api.verifyMfaRecoveryCode(recoveryCode));
  }

  async cancelMfa(): Promise<void> {
    try {
      await firstValueFrom(this.api.cancelMfa().pipe(timeout(AUTH_REQUEST_TIMEOUT_MS)));
    } finally {
      this.clearSession('anonymous');
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout().pipe(timeout(AUTH_REQUEST_TIMEOUT_MS)));
    } catch {
      // Local session state must still be cleared when the server session already expired.
    } finally {
      this.clearSession('anonymous');
      await this.router.navigate(['/auth/login']);
    }
  }

  csrfToken(): string | null {
    return this.csrfTokenState();
  }

  handleSessionInvalid(): void {
    this.clearSession('anonymous');
    if (!this.router.url.startsWith('/auth/login')) {
      void this.router.navigate(['/auth/login']);
    }
  }

  handleForbidden(): void {
    if (this.isAuthenticated() && this.router.url !== '/forbidden') {
      void this.router.navigate(['/forbidden']);
    }
  }

  private async initializeCore(): Promise<void> {
    try {
      await this.loadAuthenticatedSession();
    } catch (error: unknown) {
      this.clearSession(error instanceof HttpErrorResponse && error.status === 401
        ? 'anonymous'
        : 'unavailable');
    }
  }

  private async loadAuthenticatedSession(): Promise<void> {
    const response = await firstValueFrom(
      this.api.getCurrentUser().pipe(timeout(AUTH_REQUEST_TIMEOUT_MS)),
    );
    const user = this.parseCurrentUser(response);
    const csrfResponse = await firstValueFrom(
      this.api.getCsrfToken().pipe(timeout(AUTH_REQUEST_TIMEOUT_MS)),
    );

    if (typeof csrfResponse.requestToken !== 'string' || !csrfResponse.requestToken) {
      throw new Error('The authenticated session could not be initialized.');
    }

    this.currentUserState.set(user);
    this.csrfTokenState.set(csrfResponse.requestToken);
    this.authorization.setPermissions(user.permissions);
    this.statusState.set('authenticated');
  }

  private async completeMfa(
    request: () => ReturnType<AuthApiService['verifyMfa']>,
  ): Promise<MfaAttemptResult> {
    try {
      await firstValueFrom(request().pipe(timeout(AUTH_REQUEST_TIMEOUT_MS)));
      await this.loadAuthenticatedSession();
      return { status: 'succeeded' };
    } catch (error: unknown) {
      return this.mapMfaError(error);
    }
  }

  private mapMfaError(
    error: unknown,
  ): Exclude<MfaAttemptResult, { readonly status: 'succeeded' }> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 429) {
        return { status: 'rateLimited' };
      }

      if (error.status === 401) {
        return this.problemType(error) === 'urn:carecomply:problem:mfa-challenge-expired'
          ? { status: 'expired' }
          : { status: 'invalid' };
      }
    }

    return { status: 'unavailable' };
  }

  private problemType(error: HttpErrorResponse): string | null {
    if (typeof error.error !== 'object' || error.error === null || !('type' in error.error)) {
      return null;
    }

    return typeof error.error.type === 'string' ? error.error.type : null;
  }

  private parseCurrentUser(response: CurrentUserResponse): CurrentUser {
    const permissions = Array.isArray(response.permissions)
      ? response.permissions.filter(isPermission)
      : [];

    if (
      typeof response.id !== 'string' ||
      !response.id ||
      typeof response.email !== 'string' ||
      !response.email ||
      typeof response.displayName !== 'string' ||
      !response.displayName ||
      !Array.isArray(response.permissions) ||
      permissions.length !== response.permissions.length
    ) {
      throw new Error('The authenticated session response is invalid.');
    }

    return {
      id: response.id,
      email: response.email,
      displayName: response.displayName,
      permissions,
    };
  }

  private clearSession(status: Exclude<AuthSessionStatus, 'initializing' | 'authenticated'>): void {
    this.currentUserState.set(null);
    this.csrfTokenState.set(null);
    this.authorization.clearPermissions();
    this.statusState.set(status);
  }
}
