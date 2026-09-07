import { Permission } from '../authorization/permissions';

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface ForgotPasswordResponse {
  readonly message: string;
}

export interface ResetPasswordRequest {
  readonly userId: string;
  readonly token: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

export interface CurrentUserResponse {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly isPlatformAdministrator: boolean;
  readonly permissions: readonly string[];
}

export interface CurrentUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly isPlatformAdministrator: boolean;
  readonly permissions: readonly Permission[];
}

export interface MfaRequiredResponse {
  readonly status: string;
}

export type MfaContextStatus = 'mfaRequired' | 'mfaEnrollmentRequired';
export type MfaMethod = 'Authenticator' | 'Email';

export interface MfaContextResponse {
  readonly status: string;
  readonly method: string;
  readonly requestToken: string | null;
}

export interface MfaEnrollmentResponse {
  readonly manualSetupKey: string;
  readonly qrCodeDataUrl: string;
}

export interface MfaEnrollmentConfirmedResponse {
  readonly recoveryCodes: readonly string[];
}

export interface CsrfTokenResponse {
  readonly requestToken: string | null;
}

export type AuthSessionStatus = 'initializing' | 'authenticated' | 'anonymous' | 'unavailable';

export type LoginAttemptResult =
  | { readonly status: 'succeeded' }
  | { readonly status: 'invalidCredentials' }
  | { readonly status: 'mfaRequired' }
  | { readonly status: 'mfaEnrollmentRequired' }
  | { readonly status: 'rateLimited' }
  | { readonly status: 'unavailable' };

export type MfaAttemptResult =
  | { readonly status: 'succeeded' }
  | { readonly status: 'invalid' }
  | { readonly status: 'expired' }
  | { readonly status: 'rateLimited' }
  | { readonly status: 'unavailable' };

export type MfaContextResult =
  | { readonly status: MfaContextStatus; readonly method: MfaMethod }
  | { readonly status: 'expired' }
  | { readonly status: 'unavailable' };

export type MfaEnrollmentBeginResult =
  | { readonly status: 'succeeded'; readonly enrollment: MfaEnrollmentResponse }
  | { readonly status: 'expired' }
  | { readonly status: 'unavailable' };

export type MfaEnrollmentConfirmResult =
  | { readonly status: 'succeeded'; readonly recoveryCodes: readonly string[] }
  | Exclude<MfaAttemptResult, { readonly status: 'succeeded' }>;

export type MfaEmailResendResult =
  | { readonly status: 'succeeded' }
  | { readonly status: 'expired' }
  | { readonly status: 'rateLimited' }
  | { readonly status: 'unavailable' };
