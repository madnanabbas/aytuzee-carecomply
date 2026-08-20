import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';
import { AuthSessionService } from '../auth/auth-session.service';
import { AuthenticatedLandingService } from '../auth/authenticated-landing.service';
import { anonymousOnlyGuard, authGuard } from './auth.guard';

describe('authentication route guards', () => {
  let authenticated: boolean;
  let router: Router;
  const session = {
    initialize: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: () => authenticated,
  };

  beforeEach(() => {
    authenticated = false;
    session.initialize.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: session },
        {
          provide: AuthenticatedLandingService,
          useValue: { firstAllowedPath: () => '/employees' },
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('should redirect an anonymous protected route to login', async () => {
    expectUrl(await runGuard(authGuard), '/auth/login');
    expect(session.initialize).toHaveBeenCalledOnce();
  });

  it('should allow an authenticated protected route', async () => {
    authenticated = true;

    await expect(runGuard(authGuard)).resolves.toBe(true);
  });

  it('should keep anonymous users on the login route', async () => {
    await expect(runGuard(anonymousOnlyGuard)).resolves.toBe(true);
  });

  it('should redirect an authenticated login visit to the configured landing route', async () => {
    authenticated = true;

    expectUrl(await runGuard(anonymousOnlyGuard), '/employees');
  });

  async function runGuard(guard: typeof authGuard): Promise<GuardResult> {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    return isObservable(result) ? firstValueFrom(result) : Promise.resolve(result);
  }

  function expectUrl(result: GuardResult, expectedUrl: string): void {
    expect(result).toBeInstanceOf(UrlTree);
    if (!(result instanceof UrlTree)) {
      throw new Error('Expected the guard to return a UrlTree.');
    }

    expect(router.serializeUrl(result)).toBe(expectedUrl);
  }
});
