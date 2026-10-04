import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { ForgotPasswordResponse } from '../../../../core/auth/auth.models';
import { ForgotPasswordPageComponent } from './forgot-password-page';

describe('ForgotPasswordPageComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordPageComponent>;
  let api: AuthApiStub;

  beforeEach(async () => {
    api = new AuthApiStub();
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPageComponent],
      providers: [provideRouter([]), { provide: AuthApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(ForgotPasswordPageComponent);
    fixture.detectChanges();
  });

  it('does not submit an invalid email', async () => {
    fixture.componentInstance.form.controls.email.setValue('invalid');
    await fixture.componentInstance.submit();
    expect(api.requestedEmail).toBeNull();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('prevents duplicate submission and shows the generic accepted state', async () => {
    const response = new Subject<ForgotPasswordResponse>();
    api.response = response;
    fixture.componentInstance.form.controls.email.setValue('person@example.com');

    const first = fixture.componentInstance.submit();
    void fixture.componentInstance.submit();
    expect(api.callCount).toBe(1);
    expect(fixture.componentInstance.isSubmitting()).toBe(true);

    response.next({ message: 'ignored by enumeration-safe UI' });
    response.complete();
    await first;

    expect(fixture.componentInstance.requestSubmitted()).toBe(true);
    expect(fixture.componentInstance.requestFailed()).toBe(false);
  });

  it('shows a generic availability error without account-existence wording', async () => {
    api.response = throwError(() => new Error('network'));
    fixture.componentInstance.form.controls.email.setValue('person@example.com');
    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.requestFailed()).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('Email not found');
  });
});

class AuthApiStub {
  response: Observable<ForgotPasswordResponse> = new Subject<ForgotPasswordResponse>();
  requestedEmail: string | null = null;
  callCount = 0;

  requestPasswordReset(email: string) {
    this.requestedEmail = email;
    this.callCount += 1;
    return this.response;
  }
}
