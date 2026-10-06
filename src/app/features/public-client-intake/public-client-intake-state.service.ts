import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PublicClientIntakeApiService } from './public-client-intake-api.service';
import {
  PublicClientBasicDetailsRequest,
  PublicClientAdditionalInformationState,
  PublicClientAdditionalInformationUpdate,
  PublicClientStepContinuation,
  PublicClientContactInformationState,
  PublicClientContactInformationUpdate,
  PublicCaregiverAssignment,
  PublicCaregiverCandidate,
  PublicCaregiverListState,
  SavePublicCaregiverRequest,
  PublicClientContact,
  PublicClientContactListState,
  SavePublicClientContactRequest,
  PublicCareCoordinator,
  PublicCareCoordinatorListState,
  SavePublicCareCoordinatorRequest,
  PublicConsultationProvider,
  PublicConsultationProviderListState,
  SavePublicConsultationProviderRequest,
  PublicPhysician,
  PublicPhysicianListState,
  SavePublicPhysicianRequest,
  PublicResponsibleParty,
  PublicResponsiblePartyListState,
  SavePublicResponsiblePartyRequest,
  PublicHospitalization,
  PublicHospitalizationListState,
  SavePublicHospitalizationRequest,
  PublicClientIntakeCompletion,
  PublicClientIntakeContinuation,
  PublicClientIntakeLocation,
  PublicClientIntakeSupervisor,
  PublicClientInvitationContext,
  PublicClientIntakeViewState,
} from './public-client-intake.models';

export interface PublicIntakeBrowser {
  readonly location: Pick<Location, 'hash' | 'pathname' | 'search'>;
  readonly history: Pick<History, 'state' | 'replaceState'>;
}

export const PUBLIC_INTAKE_BROWSER = new InjectionToken<PublicIntakeBrowser>(
  'PUBLIC_INTAKE_BROWSER',
  { providedIn: 'root', factory: () => window },
);

@Injectable()
export class PublicClientIntakeState {
  private readonly api = inject(PublicClientIntakeApiService);
  private readonly browser = inject(PUBLIC_INTAKE_BROWSER);
  private hasSession = false;
  private sessionMarker: string | null = null;
  private get token(): string | null {
    return this.sessionMarker;
  }

  readonly viewState = signal<PublicClientIntakeViewState>('validating');
  readonly context = signal<PublicClientInvitationContext | null>(null);

  async initialize(): Promise<void> {
    const invitationToken = this.captureAndRemoveFragment();
    this.viewState.set('validating');
    try {
      const context = await firstValueFrom(
        invitationToken ? this.api.redeem(invitationToken) : this.api.session(),
      );
      this.hasSession = context.state === 'Ready';
      this.sessionMarker = this.hasSession ? 'cookie-session' : null;
      this.context.set(context);
      this.viewState.set(mapPublicState(context.state));
    } catch (error: unknown) {
      this.context.set(null);
      this.viewState.set(
        error instanceof HttpErrorResponse && error.status === 400 ? 'invalid' : 'error',
      );
    }
  }

  clear(): void {
    this.hasSession = false;
    this.sessionMarker = null;
    this.context.set(null);
  }

  tokenForTesting(): string | null {
    return null;
  }

  async locations(): Promise<readonly PublicClientIntakeLocation[]> {
    if (!this.hasSession) return [];
    const response = await firstValueFrom(this.api.locations(''));
    return response.state === 'Ready' ? (response.locations ?? []) : [];
  }

  async supervisors(locationId: string): Promise<readonly PublicClientIntakeSupervisor[]> {
    if (!this.hasSession) return [];
    const response = await firstValueFrom(this.api.supervisors('', locationId));
    return response.state === 'Ready' ? (response.supervisors ?? []) : [];
  }

  async createBasicDetails(
    request: PublicClientBasicDetailsRequest,
  ): Promise<PublicClientIntakeContinuation> {
    this.requireSession();
    return firstValueFrom(this.api.createBasicDetails('', request));
  }

  async additionalInformation(): Promise<PublicClientAdditionalInformationState> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.additionalInformation(this.token));
  }

  async updateAdditionalInformation(
    request: PublicClientAdditionalInformationUpdate,
  ): Promise<PublicClientStepContinuation> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.updateAdditionalInformation(this.token, request));
  }

  async contactInformation(): Promise<PublicClientContactInformationState> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.contactInformation(this.token));
  }

  async updateContactInformation(
    request: PublicClientContactInformationUpdate,
  ): Promise<PublicClientStepContinuation> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.updateContactInformation(this.token, request));
  }

  async caregiverCandidates(): Promise<readonly PublicCaregiverCandidate[]> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.caregiverCandidates(this.token));
  }
  async caregivers(): Promise<PublicCaregiverListState> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.caregivers(this.token));
  }
  async createCaregiver(request: SavePublicCaregiverRequest): Promise<PublicCaregiverAssignment> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.createCaregiver(this.token, request));
  }
  async updateCaregiver(
    assignmentId: string,
    request: SavePublicCaregiverRequest,
  ): Promise<PublicCaregiverAssignment> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.updateCaregiver(this.token, assignmentId, request));
  }
  async endCaregiver(
    assignmentId: string,
    endDate: string,
    editorVersion: string,
  ): Promise<PublicCaregiverAssignment> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.endCaregiver(this.token, assignmentId, endDate, editorVersion));
  }
  async continueCaregivers(): Promise<PublicClientStepContinuation> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.continueCaregivers(this.token));
  }
  async contacts(): Promise<PublicClientContactListState> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.contacts(this.token));
  }
  async createContact(request: SavePublicClientContactRequest): Promise<PublicClientContact> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.createContact(this.token, request));
  }
  async updateContact(
    contactId: string,
    request: SavePublicClientContactRequest,
  ): Promise<PublicClientContact> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.updateContact(this.token, contactId, request));
  }
  async continueContacts(): Promise<PublicClientStepContinuation> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.continueContacts(this.token));
  }
  async careCoordinators(): Promise<PublicCareCoordinatorListState> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.careCoordinators(this.token));
  }
  async createCareCoordinator(
    request: SavePublicCareCoordinatorRequest,
  ): Promise<PublicCareCoordinator> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.createCareCoordinator(this.token, request));
  }
  async updateCareCoordinator(
    id: string,
    request: SavePublicCareCoordinatorRequest,
  ): Promise<PublicCareCoordinator> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.updateCareCoordinator(this.token, id, request));
  }
  async continueCareCoordinators(): Promise<PublicClientStepContinuation> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.continueCareCoordinators(this.token));
  }
  async consultationProviders(): Promise<PublicConsultationProviderListState> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.consultationProviders(this.token));
  }
  async createConsultationProvider(
    request: SavePublicConsultationProviderRequest,
  ): Promise<PublicConsultationProvider> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.createConsultationProvider(this.token, request));
  }
  async updateConsultationProvider(
    id: string,
    request: SavePublicConsultationProviderRequest,
  ): Promise<PublicConsultationProvider> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.updateConsultationProvider(this.token, id, request));
  }
  async continueConsultationProviders(): Promise<PublicClientStepContinuation> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.continueConsultationProviders(this.token));
  }
  async physicians(): Promise<PublicPhysicianListState> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.physicians(this.token));
  }
  async createPhysician(request: SavePublicPhysicianRequest): Promise<PublicPhysician> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.createPhysician(this.token, request));
  }
  async updatePhysician(id: string, request: SavePublicPhysicianRequest): Promise<PublicPhysician> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.updatePhysician(this.token, id, request));
  }
  async continuePhysicians(): Promise<PublicClientStepContinuation> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.continuePhysicians(this.token));
  }
  async responsibleParties(): Promise<PublicResponsiblePartyListState> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.responsibleParties(this.token));
  }
  async createResponsibleParty(
    request: SavePublicResponsiblePartyRequest,
  ): Promise<PublicResponsibleParty> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.createResponsibleParty(this.token, request));
  }
  async updateResponsibleParty(
    id: string,
    request: SavePublicResponsiblePartyRequest,
  ): Promise<PublicResponsibleParty> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.updateResponsibleParty(this.token, id, request));
  }
  async continueResponsibleParties(): Promise<PublicClientStepContinuation> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.continueResponsibleParties(this.token));
  }
  async hospitalizations(): Promise<PublicHospitalizationListState> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.hospitalizations(this.token));
  }
  async createHospitalization(
    request: SavePublicHospitalizationRequest,
  ): Promise<PublicHospitalization> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.createHospitalization(this.token, request));
  }
  async updateHospitalization(
    id: string,
    request: SavePublicHospitalizationRequest,
  ): Promise<PublicHospitalization> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    return firstValueFrom(this.api.updateHospitalization(this.token, id, request));
  }
  async complete(): Promise<PublicClientIntakeCompletion> {
    if (!this.token) throw new Error('The invitation token is unavailable.');
    const completion = await firstValueFrom(this.api.complete(this.token));
    this.hasSession = false;
    this.sessionMarker = null;
    return completion;
  }

  private captureAndRemoveFragment(): string | null {
    const fragment = this.browser.location.hash.startsWith('#')
      ? this.browser.location.hash.slice(1)
      : this.browser.location.hash;
    const token = new URLSearchParams(fragment).get('token')?.trim() || null;

    if (this.browser.location.hash) {
      this.browser.history.replaceState(
        this.browser.history.state,
        '',
        `${this.browser.location.pathname}${this.browser.location.search}`,
      );
    }
    return token;
  }

  private requireSession(): void {
    if (!this.hasSession) throw new Error('The secure guest session is unavailable.');
  }
}

function mapPublicState(
  state: PublicClientInvitationContext['state'],
): PublicClientIntakeViewState {
  switch (state) {
    case 'Ready':
      return 'ready';
    case 'Expired':
      return 'expired';
    case 'Unavailable':
      return 'unavailable';
    case 'Completed':
      return 'completed';
    case 'Used':
      return 'used';
    case 'SessionExpired':
      return 'sessionExpired';
    default:
      return 'invalid';
  }
}
