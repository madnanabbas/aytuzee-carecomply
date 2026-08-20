import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuthenticatedLandingService } from '../../../../core/auth/authenticated-landing.service';
import { MfaAttemptResult } from '../../../../core/auth/auth.models';
import { MfaChallengePageComponent } from './mfa-challenge-page';

describe('MfaChallengePageComponent', () => {
  let fixture: ComponentFixture<MfaChallengePageComponent>;
  let component: MfaChallengePageComponent;
  let element: HTMLElement;
  let session: MfaSessionStub;
  let router: Router;

  beforeEach(async () => {
    session = new MfaSessionStub();
    await TestBed.configureTestingModule({
      imports: [MfaChallengePageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: session },
        { provide: AuthenticatedLandingService, useValue: { firstAllowedPath: () => '/dashboard' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MfaChallengePageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('should render one accessible TOTP input with paste-friendly metadata', () => {
    const input = element.querySelector<HTMLInputElement>('#mfa-code');
    expect(element.textContent).toContain('Verify your identity');
    expect(element.querySelectorAll('input')).toHaveLength(1);
    expect(input?.autocomplete).toBe('one-time-code');
    expect(input?.inputMode).toBe('numeric');
  });

  it('should verify the code and navigate only after session completion', async () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.verificationForm.setValue({ code: '123 456' });

    await component.submit();

    expect(session.verifyMfa).toHaveBeenCalledWith('123 456');
    expect(navigate).toHaveBeenCalledWith('/dashboard');
    expect(component.verificationForm.controls.code.value).toBe('');
  });

  it('should support recovery mode and show a safe invalid-code message', async () => {
    component.switchMode();
    session.result = { status: 'invalid' };
    component.verificationForm.setValue({ code: 'saved-code' });

    await component.submit();
    fixture.detectChanges();

    expect(session.verifyMfaRecoveryCode).toHaveBeenCalledWith('saved-code');
    expect(element.textContent).toContain('invalid or has already been used');
  });
});

class MfaSessionStub {
  result: MfaAttemptResult = { status: 'succeeded' };
  readonly verifyMfa = vi.fn(async (_code: string) => this.result);
  readonly verifyMfaRecoveryCode = vi.fn(async (_code: string) => this.result);
  readonly cancelMfa = vi.fn(async () => undefined);
}
