import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { ResetPasswordRequest } from '../../../../core/auth/auth.models';
import { ResetPasswordPageComponent } from './reset-password-page';

describe('ResetPasswordPageComponent', () => {
  it('rejects a link without the opaque user id and token', async () => {
    const { component } = await createComponent({});
    expect(component.resetLinkPresent()).toBe(false);
  });

  it('enforces the 15-character policy and matching confirmation', async () => {
    const { component } = await createComponent(validQuery);
    component.form.setValue({ password: 'too-short', confirmPassword: 'different' });
    await component.submit();
    expect(component.form.invalid).toBe(true);
  });

  it('submits opaque link data, prevents duplicates, and clears passwords on success', async () => {
    const response = new Subject<void>();
    const { component, api } = await createComponent(validQuery, response);
    component.form.setValue({ password: validPassword, confirmPassword: validPassword });

    const first = component.submit();
    void component.submit();
    expect(api.callCount).toBe(1);
    expect(api.request?.token).toBe('opaque-token');

    response.next();
    response.complete();
    await first;

    expect(component.resetCompleted()).toBe(true);
    expect(component.form.controls.password.value).toBe('');
    expect(component.form.controls.confirmPassword.value).toBe('');
  });

  it('maps invalid or expired tokens to a generic error and clears passwords', async () => {
    const { component } = await createComponent(
      validQuery,
      throwError(() => new Error('bad request')),
    );
    component.form.setValue({ password: validPassword, confirmPassword: validPassword });
    await component.submit();

    expect(component.resetFailed()).toBe(true);
    expect(component.form.controls.password.value).toBe('');
  });
});

const validQuery = {
  userId: 'f2cdf03e-bd6b-4e8c-a42e-6fbd62ffad71',
  token: 'opaque-token',
};
const validPassword = 'fifteen-characters';

async function createComponent(
  query: Record<string, string>,
  response: Observable<void> = new Subject<void>(),
): Promise<{
  component: ResetPasswordPageComponent;
  fixture: ComponentFixture<ResetPasswordPageComponent>;
  api: AuthApiStub;
}> {
  TestBed.resetTestingModule();
  const api = new AuthApiStub(response);
  await TestBed.configureTestingModule({
    imports: [ResetPasswordPageComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
      },
      { provide: AuthApiService, useValue: api },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ResetPasswordPageComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, fixture, api };
}

class AuthApiStub {
  request: ResetPasswordRequest | null = null;
  callCount = 0;

  constructor(private readonly response: Observable<void>) {}

  resetPassword(request: ResetPasswordRequest) {
    this.request = request;
    this.callCount += 1;
    return this.response;
  }
}
