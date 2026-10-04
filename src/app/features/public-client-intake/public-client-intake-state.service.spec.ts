import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PublicClientIntakeApiService } from './public-client-intake-api.service';
import {
  PUBLIC_INTAKE_BROWSER,
  PublicClientIntakeState,
  PublicIntakeBrowser,
} from './public-client-intake-state.service';

describe('PublicClientIntakeState', () => {
  it('captures the fragment in memory, removes it immediately, and validates', async () => {
    const replaceState = vi.fn();
    const api = {
      redeem: vi.fn().mockReturnValue(
        of({
          state: 'Ready',
          clientDisplayName: 'Guest Client',
          expiresAtUtc: '2026-10-01T00:00:00Z',
          hasCreatedClient: false,
        }),
      ),
    };
    const token = 'abc';
    const browser: PublicIntakeBrowser = {
      location: { hash: `#token=${token}`, pathname: '/client-intake', search: '' },
      history: { state: null, replaceState },
    };
    TestBed.configureTestingModule({
      providers: [
        PublicClientIntakeState,
        { provide: PublicClientIntakeApiService, useValue: api },
        { provide: PUBLIC_INTAKE_BROWSER, useValue: browser },
      ],
    });

    const state = TestBed.inject(PublicClientIntakeState);
    await state.initialize();

    expect(replaceState).toHaveBeenCalledWith(null, '', '/client-intake');
    expect(api.redeem).toHaveBeenCalledWith(token);
    expect(state.tokenForTesting()).toBeNull();
    expect(state.viewState()).toBe('ready');
    expect(replaceState.mock.calls[0][2]).not.toContain('token');
  });

  it('restores a cookie session without API-token or browser persistence', async () => {
    const api = {
      redeem: vi.fn(),
      session: vi.fn().mockReturnValue(
        of({
          state: 'Ready',
          clientDisplayName: 'Returning Guest',
          expiresAtUtc: '2026-10-01T00:00:00Z',
          hasCreatedClient: true,
          creationProgressStep: 7,
        }),
      ),
    };
    const browser: PublicIntakeBrowser = {
      location: { hash: '', pathname: '/client-intake', search: '' },
      history: { state: null, replaceState: vi.fn() },
    };
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage, 'setItem');
    TestBed.configureTestingModule({
      providers: [
        PublicClientIntakeState,
        { provide: PublicClientIntakeApiService, useValue: api },
        { provide: PUBLIC_INTAKE_BROWSER, useValue: browser },
      ],
    });

    const state = TestBed.inject(PublicClientIntakeState);
    await state.initialize();

    expect(state.viewState()).toBe('ready');
    expect(api.redeem).not.toHaveBeenCalled();
    expect(api.session).toHaveBeenCalledOnce();
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
  });
});
