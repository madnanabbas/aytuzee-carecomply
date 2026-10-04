import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { Company, CompanyLookupService } from '../../../../core/lookups/company-lookup.service';
import {
  formatContactPhone,
  isValidContactEmail,
  isValidContactPhone,
} from '../../../../shared/formatting/contact-input-formatting';
import { ClientApiService } from '../../data-access/client-api.service';

const MAXIMUM_CLIENT_NAME_LENGTH = 200;

interface GeneratedInvitation {
  readonly invitationId: string;
  readonly guestLink: string;
  readonly token: string;
  readonly expiresAtUtc: string;
}

@Component({
  selector: 'app-client-guest-invitation-dialog',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './client-guest-invitation-dialog.html',
})
export class ClientGuestInvitationDialogComponent {
  private readonly api = inject(ClientApiService);
  private readonly session = inject(AuthSessionService);
  private readonly companiesApi = inject(CompanyLookupService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private readonly initialControl =
    viewChild.required<ElementRef<HTMLInputElement>>('initialControl');

  readonly closed = output<void>();
  readonly clientName = signal('');
  readonly email = signal('');
  readonly mobileNumber = signal('');
  readonly companyId = signal('');
  readonly companies = signal<readonly Company[]>([]);
  readonly loadingCompanies = signal(false);
  readonly isGenerating = signal(false);
  readonly isSending = signal(false);
  readonly generated = signal<GeneratedInvitation | null>(null);
  readonly sentAtUtc = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly isPlatformAdministrator = this.session.currentUser()?.isPlatformAdministrator === true;

  constructor() {
    if (this.isPlatformAdministrator) this.loadCompanies();
    afterNextRender(() => this.initialControl().nativeElement.focus());
  }

  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      this.dialog().nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((control) => !control.hasAttribute('hidden'));
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  @HostListener('document:keydown.escape')
  close(): void {
    if (this.isGenerating() || this.isSending()) return;
    this.clearSensitiveState();
    this.closed.emit();
  }

  updateMobile(event: Event): void {
    if (!(event.target instanceof HTMLInputElement) || this.generated()) return;
    const formatted = formatContactPhone(event.target.value);
    event.target.value = formatted;
    this.mobileNumber.set(formatted);
  }

  generate(): void {
    if (this.isGenerating() || this.generated()) return;
    this.submitted.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (!this.formIsValid()) return;

    this.isGenerating.set(true);
    const request = {
      clientName: this.clientName().trim(),
      email: this.email().trim(),
      mobileNumber: this.mobileNumber().trim() || null,
      ...(this.isPlatformAdministrator ? { companyId: this.companyId() } : {}),
    };
    this.api
      .createGuestInvitation(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isGenerating.set(false)),
      )
      .subscribe({
        next: (response) => {
          const token = extractGuestInvitationToken(response.guestLink);
          if (!token) {
            this.errorMessage.set('The generated link could not be verified. Please try again.');
            return;
          }
          this.generated.set({ ...response, token });
        },
        error: () => {
          this.errorMessage.set('The G-Link could not be generated. Please try again.');
        },
      });
  }

  async copyLink(): Promise<void> {
    const invitation = this.generated();
    if (!invitation) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      await navigator.clipboard.writeText(invitation.guestLink);
      this.successMessage.set('Link copied');
    } catch {
      this.errorMessage.set('The link could not be copied. Please copy it manually.');
    }
  }

  sendEmail(): void {
    const invitation = this.generated();
    if (!invitation || this.isSending()) return;
    this.isSending.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.api
      .sendGuestInvitation(invitation.invitationId, invitation.token)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSending.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.sentAtUtc.set(response.sentAtUtc);
          this.successMessage.set('Invitation email sent.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.status === 409
              ? 'This invitation is no longer available. Create another G-Link if needed.'
              : 'The invitation email could not be sent. Please try again.',
          );
        },
      });
  }

  createAnother(): void {
    if (this.isGenerating() || this.isSending()) return;
    this.clientName.set('');
    this.email.set('');
    this.mobileNumber.set('');
    this.companyId.set('');
    this.submitted.set(false);
    this.clearSensitiveState();
  }

  clientNameError(): string | null {
    if (!this.submitted()) return null;
    const value = this.clientName().trim();
    if (!value) return 'Client name is required.';
    return value.length > MAXIMUM_CLIENT_NAME_LENGTH
      ? `Client name cannot exceed ${MAXIMUM_CLIENT_NAME_LENGTH} characters.`
      : null;
  }

  emailError(): string | null {
    if (!this.submitted()) return null;
    const value = this.email().trim();
    if (!value) return 'Email is required.';
    return isValidContactEmail(value) ? null : 'Enter a valid email address.';
  }

  mobileError(): string | null {
    if (!this.submitted() || !this.mobileNumber().trim()) return null;
    return isValidContactPhone(this.mobileNumber()) ? null : 'Enter a valid phone number.';
  }

  companyError(): string | null {
    return this.submitted() && this.isPlatformAdministrator && !this.companyId()
      ? 'Company is required.'
      : null;
  }

  private formIsValid(): boolean {
    return !(
      this.clientNameError() ||
      this.emailError() ||
      this.mobileError() ||
      this.companyError()
    );
  }

  private loadCompanies(): void {
    this.loadingCompanies.set(true);
    this.companiesApi
      .list()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Companies could not be loaded. Close this dialog and try again.');
          return of([] as readonly Company[]);
        }),
        finalize(() => this.loadingCompanies.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((companies) =>
        this.companies.set(companies.filter((company) => company.isActive)),
      );
  }

  private clearSensitiveState(): void {
    this.generated.set(null);
    this.sentAtUtc.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}

export function extractGuestInvitationToken(guestLink: string): string | null {
  try {
    const url = new URL(guestLink);
    if (url.search || !url.hash.startsWith('#token=')) return null;
    const token = new URLSearchParams(url.hash.slice(1)).get('token');
    return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
  } catch {
    return null;
  }
}
