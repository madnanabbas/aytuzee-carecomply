import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuthenticatedLandingService } from '../../../../core/auth/authenticated-landing.service';
import { MfaEnrollmentConfirmResult } from '../../../../core/auth/auth.models';
import { MfaEnrollmentPageComponent } from './mfa-enrollment-page';

describe('MfaEnrollmentPageComponent', () => {
  let fixture: ComponentFixture<MfaEnrollmentPageComponent>;
  let component: MfaEnrollmentPageComponent;
  let element: HTMLElement;
  let session: EnrollmentSessionStub;
  let router: Router;

  beforeEach(async () => {
    session = new EnrollmentSessionStub();
    await TestBed.configureTestingModule({
      imports: [MfaEnrollmentPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: session },
        { provide: AuthenticatedLandingService, useValue: { firstAllowedPath: () => '/dashboard' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MfaEnrollmentPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('should render the server QR, manual key, and one accessible code input', () => {
    const image = element.querySelector<HTMLImageElement>('img[alt="Authenticator setup QR code"]');
    const input = element.querySelector<HTMLInputElement>('#setup-code');

    expect(image?.src).toContain('data:image/png;base64,');
    expect(element.textContent).toContain('ABCD EFGH');
    expect(input?.autocomplete).toBe('one-time-code');
    expect(input?.inputMode).toBe('numeric');
  });

  it('should confirm enrollment and display ten one-time recovery codes', async () => {
    component.verificationForm.setValue({ code: '123456' });

    await component.submit();
    fixture.detectChanges();

    expect(session.confirmMfaEnrollment).toHaveBeenCalledWith('123456');
    expect(element.querySelectorAll('ul[aria-label="Recovery codes"] li')).toHaveLength(10);
    expect(element.textContent).toContain('will not be shown again');
  });

  it('should require acknowledgement before continuing', async () => {
    component.verificationForm.setValue({ code: '123456' });
    await component.submit();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await component.continueToApplication();
    expect(navigate).not.toHaveBeenCalled();

    component.codesSaved.set(true);
    await component.continueToApplication();
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });
});

class EnrollmentSessionStub {
  confirmResult: MfaEnrollmentConfirmResult = {
    status: 'succeeded',
    recoveryCodes: Array.from({ length: 10 }, (_, index) => `recovery-${index}`),
  };
  readonly beginMfaEnrollment = vi.fn(async () => ({
    status: 'succeeded' as const,
    enrollment: {
      manualSetupKey: 'ABCD EFGH',
      qrCodeDataUrl: 'data:image/png;base64,AA==',
    },
  }));
  readonly confirmMfaEnrollment = vi.fn(async (_code: string) => this.confirmResult);
  readonly cancelMfa = vi.fn(async () => undefined);
}
