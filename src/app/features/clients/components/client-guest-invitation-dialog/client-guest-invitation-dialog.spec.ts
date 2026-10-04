import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { CompanyLookupService } from '../../../../core/lookups/company-lookup.service';
import { ClientApiService } from '../../data-access/client-api.service';
import {
  ClientGuestInvitationDialogComponent,
  extractGuestInvitationToken,
} from './client-guest-invitation-dialog';

describe('ClientGuestInvitationDialogComponent', () => {
  const token = 'a'.repeat(43);
  const guestLink = `https://carecomply.example.test/client-intake#token=${token}`;
  const api = {
    createGuestInvitation: vi.fn(),
    sendGuestInvitation: vi.fn(),
    createClient: vi.fn(),
    createClientBasicDetails: vi.fn(),
  };
  const companies = { list: vi.fn() };

  function setup(platformAdministrator = false) {
    api.createGuestInvitation.mockReset();
    api.sendGuestInvitation.mockReset();
    api.createClient.mockReset();
    api.createClientBasicDetails.mockReset();
    companies.list.mockReset();
    companies.list.mockReturnValue(
      of([
        {
          id: 'company-1',
          name: 'Global Star Care',
          code: 'GSC',
          isActive: true,
          userCount: 1,
          clientCount: 0,
          editorVersion: 'v1',
        },
      ]),
    );
    api.createGuestInvitation.mockReturnValue(
      of({ invitationId: 'invitation-1', guestLink, expiresAtUtc: '2026-10-07T12:00:00Z' }),
    );
    api.sendGuestInvitation.mockReturnValue(
      of({
        invitationId: 'invitation-1',
        sentAtUtc: '2026-09-30T12:00:00Z',
        expiresAtUtc: '2026-10-07T12:00:00Z',
      }),
    );
    TestBed.configureTestingModule({
      imports: [ClientGuestInvitationDialogComponent],
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: CompanyLookupService, useValue: companies },
        {
          provide: AuthSessionService,
          useValue: { currentUser: () => ({ isPlatformAdministrator: platformAdministrator }) },
        },
      ],
    });
    const fixture = TestBed.createComponent(ClientGuestInvitationDialogComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  function validForm(component: ClientGuestInvitationDialogComponent): void {
    component.clientName.set('  Jamie Client  ');
    component.email.set('  jamie@example.test  ');
    component.mobileNumber.set('(612) 555-0100');
  }

  it('validates required name/email and the shared email/phone rules', () => {
    const { component } = setup();
    component.generate();
    expect(component.clientNameError()).toBe('Client name is required.');
    expect(component.emailError()).toBe('Email is required.');
    expect(api.createGuestInvitation).not.toHaveBeenCalled();

    component.clientName.set('Jamie');
    component.email.set('invalid');
    component.mobileNumber.set('612');
    expect(component.emailError()).toBe('Enter a valid email address.');
    expect(component.mobileError()).toBe('Enter a valid phone number.');

    component.mobileNumber.set('');
    expect(component.mobileError()).toBeNull();
  });

  it('focuses each editable control with one click and keeps typed values', () => {
    const { fixture, component } = setup(true);
    const closed = vi.fn();
    component.closed.subscribe(closed);
    const element = fixture.nativeElement as HTMLElement;
    const controls = [
      element.querySelector<HTMLInputElement>('input[type="text"]'),
      element.querySelector<HTMLInputElement>('input[type="email"]'),
      element.querySelector<HTMLInputElement>('input[type="tel"]'),
      element.querySelector<HTMLSelectElement>('select'),
    ];

    for (const control of controls) {
      expect(control?.disabled).toBe(false);
      control?.click();
      control?.focus();
      expect(document.activeElement).toBe(control);
      expect(closed).not.toHaveBeenCalled();
    }

    const name = controls[0] as HTMLInputElement;
    name.value = 'Mouse focused client';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.clientName()).toBe('Mouse focused client');
  });

  it('generates once for a company user without CompanyId and keeps state only in memory', () => {
    const storageSet = vi.spyOn(Storage.prototype, 'setItem');
    const { component, fixture } = setup();
    validForm(component);
    component.generate();
    fixture.detectChanges();

    expect(api.createGuestInvitation).toHaveBeenCalledOnce();
    expect(api.createGuestInvitation).toHaveBeenCalledWith({
      clientName: 'Jamie Client',
      email: 'jamie@example.test',
      mobileNumber: '(612) 555-0100',
    });
    expect(component.generated()?.invitationId).toBe('invitation-1');
    expect(component.generated()?.token).toBe(token);
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#generated-g-link',
    );
    expect(link?.readOnly).toBe(true);
    expect(link?.value).toBe(guestLink);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Expires');
    expect(storageSet).not.toHaveBeenCalled();
    expect(api.createClient).not.toHaveBeenCalled();
    expect(api.createClientBasicDetails).not.toHaveBeenCalled();
    storageSet.mockRestore();
  });

  it('requires a safe selected company only for platform administrators', () => {
    const { component } = setup(true);
    validForm(component);
    component.generate();
    expect(component.companyError()).toBe('Company is required.');
    expect(api.createGuestInvitation).not.toHaveBeenCalled();
    component.companyId.set('company-1');
    component.generate();
    expect(api.createGuestInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'company-1' }),
    );
    expect(companies.list).toHaveBeenCalledOnce();
  });

  it('blocks duplicate generation while the request is active', () => {
    const pending = new Subject<never>();
    api.createGuestInvitation.mockReturnValue(pending);
    const { component } = setup();
    api.createGuestInvitation.mockReturnValue(pending);
    validForm(component);
    component.generate();
    component.generate();
    expect(api.createGuestInvitation).toHaveBeenCalledOnce();
  });

  it('preserves editable form values and creates no generated state on failure', () => {
    const { component } = setup();
    api.createGuestInvitation.mockReturnValue(throwError(() => new Error('unavailable')));
    validForm(component);
    component.generate();
    expect(component.generated()).toBeNull();
    expect(component.clientName()).toContain('Jamie');
    expect(component.errorMessage()).toContain('could not be generated');
  });

  it('copies the exact link and handles clipboard failure without logging it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { component } = setup();
    validForm(component);
    component.generate();
    await component.copyLink();
    expect(writeText).toHaveBeenCalledWith(guestLink);
    expect(component.successMessage()).toBe('Link copied');
    expect(consoleLog).not.toHaveBeenCalled();

    writeText.mockRejectedValueOnce(new Error('denied'));
    await component.copyLink();
    expect(component.errorMessage()).toContain('could not be copied');
    consoleLog.mockRestore();
  });

  it('sends and resends the same raw token without link or recipient fields', () => {
    const { component } = setup();
    validForm(component);
    component.generate();
    component.sendEmail();
    component.sendEmail();
    expect(api.sendGuestInvitation).toHaveBeenCalledTimes(2);
    expect(api.sendGuestInvitation).toHaveBeenNthCalledWith(1, 'invitation-1', token);
    expect(api.sendGuestInvitation).toHaveBeenNthCalledWith(2, 'invitation-1', token);
    expect(component.generated()?.guestLink).toBe(guestLink);
    expect(component.sentAtUtc()).toBe('2026-09-30T12:00:00Z');
    expect(api.createGuestInvitation).toHaveBeenCalledOnce();
  });

  it('blocks duplicate send and preserves generated state after a send failure', () => {
    const { component } = setup();
    validForm(component);
    component.generate();
    const pending = new Subject<never>();
    api.sendGuestInvitation.mockReturnValue(pending);
    component.sendEmail();
    component.sendEmail();
    expect(api.sendGuestInvitation).toHaveBeenCalledOnce();
    pending.error(new HttpErrorResponse({ status: 503 }));
    expect(component.generated()?.token).toBe(token);
    expect(component.errorMessage()).toContain('could not be sent');
  });

  it('locks generated inputs and clears transient state on reset and close without revoking', () => {
    const { component, fixture } = setup();
    const closed = vi.fn();
    component.closed.subscribe(closed);
    validForm(component);
    component.generate();
    fixture.detectChanges();
    const fields = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="text"]:not(#generated-g-link), input[type="email"], input[type="tel"]',
      ),
    ];
    expect(fields.every((field) => field.readOnly)).toBe(true);
    component.createAnother();
    expect(component.generated()).toBeNull();
    expect(component.clientName()).toBe('');
    expect(api.sendGuestInvitation).not.toHaveBeenCalled();

    validForm(component);
    component.generate();
    component.close();
    expect(component.generated()).toBeNull();
    expect(closed).toHaveBeenCalledOnce();
  });
});

describe('extractGuestInvitationToken', () => {
  it('accepts only the token fragment from a trusted generated URL shape', () => {
    const token = 'z'.repeat(43);
    expect(extractGuestInvitationToken(`https://example.test/client-intake#token=${token}`)).toBe(
      token,
    );
    expect(
      extractGuestInvitationToken(`https://example.test/client-intake?token=${token}`),
    ).toBeNull();
    expect(extractGuestInvitationToken('not-a-url')).toBeNull();
  });
});
