import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, GuardResult, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';
import { AuthSessionService } from '../auth/auth-session.service';
import { AuthenticatedLandingService } from '../auth/authenticated-landing.service';
import { MfaContextResult } from '../auth/auth.models';
import { mfaChallengeGuard, mfaEnrollmentGuard } from './mfa-challenge.guard';

describe('MFA route guards', () => {
  let authenticated = false;
  let context: MfaContextResult;
  let router: Router;
  const session = {
    initialize: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: () => authenticated,
    prepareMfaContext: vi.fn(async () => context),
  };

  beforeEach(() => {
    authenticated = false;
    context = { status: 'mfaRequired' };
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: session },
        { provide: AuthenticatedLandingService, useValue: { firstAllowedPath: () => '/dashboard' } },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('should allow only the matching server-managed challenge route', async () => {
    await expect(runGuard(mfaChallengeGuard)).resolves.toBe(true);
    expectUrl(await runGuard(mfaEnrollmentGuard), '/auth/mfa');

    context = { status: 'mfaEnrollmentRequired' };
    await expect(runGuard(mfaEnrollmentGuard)).resolves.toBe(true);
    expectUrl(await runGuard(mfaChallengeGuard), '/auth/mfa/setup');
  });

  it('should return expired state to login and authenticated state to the landing route', async () => {
    context = { status: 'expired' };
    expectUrl(await runGuard(mfaChallengeGuard), '/auth/login');

    authenticated = true;
    expectUrl(await runGuard(mfaChallengeGuard), '/dashboard');
  });

  async function runGuard(guard: typeof mfaChallengeGuard): Promise<GuardResult> {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    return isObservable(result) ? firstValueFrom(result) : Promise.resolve(result);
  }

  function expectUrl(result: GuardResult, expected: string): void {
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(expected);
  }
});
