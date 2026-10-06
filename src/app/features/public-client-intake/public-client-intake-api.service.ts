import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
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
  PublicClientIntakeLookupResponse,
  PublicClientIntakeSupervisor,
  PublicClientInvitationContext,
} from './public-client-intake.models';

export const CLIENT_INTAKE_TOKEN_HEADER = 'X-Client-Intake-Token';
export const CLIENT_INTAKE_CSRF_HEADER = 'X-Client-Intake-XSRF';
export const CLIENT_INTAKE_CSRF_COOKIE = 'CareComply.GuestIntake.XSRF';

@Injectable({ providedIn: 'root' })
export class PublicClientIntakeApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  redeem(token: string): Observable<PublicClientInvitationContext> {
    return this.http.post<PublicClientInvitationContext>(
      `${this.apiBaseUrl}/public/client-intake/redeem`,
      null,
      { headers: new HttpHeaders().set(CLIENT_INTAKE_TOKEN_HEADER, token) },
    );
  }

  session(): Observable<PublicClientInvitationContext> {
    return this.http.get<PublicClientInvitationContext>(
      `${this.apiBaseUrl}/public/client-intake/session`,
    );
  }

  locations(
    token: string,
  ): Observable<PublicClientIntakeLookupResponse<PublicClientIntakeLocation>> {
    return this.http.get<PublicClientIntakeLookupResponse<PublicClientIntakeLocation>>(
      `${this.apiBaseUrl}/public/client-intake/locations`,
      { headers: this.tokenHeaders(token) },
    );
  }

  supervisors(
    token: string,
    locationId: string,
  ): Observable<PublicClientIntakeLookupResponse<PublicClientIntakeSupervisor>> {
    return this.http.get<PublicClientIntakeLookupResponse<PublicClientIntakeSupervisor>>(
      `${this.apiBaseUrl}/public/client-intake/supervisors`,
      { headers: this.tokenHeaders(token), params: { locationId } },
    );
  }

  createBasicDetails(
    token: string,
    request: PublicClientBasicDetailsRequest,
  ): Observable<PublicClientIntakeContinuation> {
    return this.http.post<PublicClientIntakeContinuation>(
      `${this.apiBaseUrl}/public/client-intake/basic-details`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }

  additionalInformation(token: string): Observable<PublicClientAdditionalInformationState> {
    return this.http.get<PublicClientAdditionalInformationState>(
      `${this.apiBaseUrl}/public/client-intake/additional-information`,
      { headers: this.tokenHeaders(token) },
    );
  }

  updateAdditionalInformation(
    token: string,
    request: PublicClientAdditionalInformationUpdate,
  ): Observable<PublicClientStepContinuation> {
    return this.http.put<PublicClientStepContinuation>(
      `${this.apiBaseUrl}/public/client-intake/additional-information`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }

  contactInformation(token: string): Observable<PublicClientContactInformationState> {
    return this.http.get<PublicClientContactInformationState>(
      `${this.apiBaseUrl}/public/client-intake/contact-information`,
      { headers: this.tokenHeaders(token) },
    );
  }

  updateContactInformation(
    token: string,
    request: PublicClientContactInformationUpdate,
  ): Observable<PublicClientStepContinuation> {
    return this.http.put<PublicClientStepContinuation>(
      `${this.apiBaseUrl}/public/client-intake/contact-information`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }

  caregiverCandidates(token: string): Observable<readonly PublicCaregiverCandidate[]> {
    return this.http.get<readonly PublicCaregiverCandidate[]>(
      `${this.apiBaseUrl}/public/client-intake/caregiver-candidates`,
      { headers: this.tokenHeaders(token) },
    );
  }
  caregivers(token: string): Observable<PublicCaregiverListState> {
    return this.http.get<PublicCaregiverListState>(
      `${this.apiBaseUrl}/public/client-intake/caregivers`,
      { headers: this.tokenHeaders(token) },
    );
  }
  createCaregiver(
    token: string,
    request: SavePublicCaregiverRequest,
  ): Observable<PublicCaregiverAssignment> {
    return this.http.post<PublicCaregiverAssignment>(
      `${this.apiBaseUrl}/public/client-intake/caregivers`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  updateCaregiver(
    token: string,
    assignmentId: string,
    request: SavePublicCaregiverRequest,
  ): Observable<PublicCaregiverAssignment> {
    return this.http.put<PublicCaregiverAssignment>(
      `${this.apiBaseUrl}/public/client-intake/caregivers/${encodeURIComponent(assignmentId)}`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  endCaregiver(
    token: string,
    assignmentId: string,
    endDate: string,
    editorVersion: string,
  ): Observable<PublicCaregiverAssignment> {
    return this.http.post<PublicCaregiverAssignment>(
      `${this.apiBaseUrl}/public/client-intake/caregivers/${encodeURIComponent(assignmentId)}/end`,
      { endDate, editorVersion },
      { headers: this.tokenHeaders(token) },
    );
  }
  continueCaregivers(token: string): Observable<PublicClientStepContinuation> {
    return this.http.post<PublicClientStepContinuation>(
      `${this.apiBaseUrl}/public/client-intake/caregivers/continue`,
      {},
      { headers: this.tokenHeaders(token) },
    );
  }
  contacts(token: string): Observable<PublicClientContactListState> {
    return this.http.get<PublicClientContactListState>(
      `${this.apiBaseUrl}/public/client-intake/contacts`,
      { headers: this.tokenHeaders(token) },
    );
  }
  createContact(
    token: string,
    request: SavePublicClientContactRequest,
  ): Observable<PublicClientContact> {
    return this.http.post<PublicClientContact>(
      `${this.apiBaseUrl}/public/client-intake/contacts`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  updateContact(
    token: string,
    contactId: string,
    request: SavePublicClientContactRequest,
  ): Observable<PublicClientContact> {
    return this.http.put<PublicClientContact>(
      `${this.apiBaseUrl}/public/client-intake/contacts/${encodeURIComponent(contactId)}`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  continueContacts(token: string): Observable<PublicClientStepContinuation> {
    return this.http.post<PublicClientStepContinuation>(
      `${this.apiBaseUrl}/public/client-intake/contacts/continue`,
      {},
      { headers: this.tokenHeaders(token) },
    );
  }
  careCoordinators(token: string): Observable<PublicCareCoordinatorListState> {
    return this.http.get<PublicCareCoordinatorListState>(
      `${this.apiBaseUrl}/public/client-intake/care-coordinators`,
      { headers: this.tokenHeaders(token) },
    );
  }
  createCareCoordinator(
    token: string,
    request: SavePublicCareCoordinatorRequest,
  ): Observable<PublicCareCoordinator> {
    return this.http.post<PublicCareCoordinator>(
      `${this.apiBaseUrl}/public/client-intake/care-coordinators`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  updateCareCoordinator(
    token: string,
    id: string,
    request: SavePublicCareCoordinatorRequest,
  ): Observable<PublicCareCoordinator> {
    return this.http.put<PublicCareCoordinator>(
      `${this.apiBaseUrl}/public/client-intake/care-coordinators/${encodeURIComponent(id)}`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  continueCareCoordinators(token: string): Observable<PublicClientStepContinuation> {
    return this.http.post<PublicClientStepContinuation>(
      `${this.apiBaseUrl}/public/client-intake/care-coordinators/continue`,
      {},
      { headers: this.tokenHeaders(token) },
    );
  }
  consultationProviders(token: string): Observable<PublicConsultationProviderListState> {
    return this.http.get<PublicConsultationProviderListState>(
      `${this.apiBaseUrl}/public/client-intake/consultation-providers`,
      { headers: this.tokenHeaders(token) },
    );
  }
  createConsultationProvider(
    token: string,
    request: SavePublicConsultationProviderRequest,
  ): Observable<PublicConsultationProvider> {
    return this.http.post<PublicConsultationProvider>(
      `${this.apiBaseUrl}/public/client-intake/consultation-providers`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  updateConsultationProvider(
    token: string,
    id: string,
    request: SavePublicConsultationProviderRequest,
  ): Observable<PublicConsultationProvider> {
    return this.http.put<PublicConsultationProvider>(
      `${this.apiBaseUrl}/public/client-intake/consultation-providers/${encodeURIComponent(id)}`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  continueConsultationProviders(token: string): Observable<PublicClientStepContinuation> {
    return this.http.post<PublicClientStepContinuation>(
      `${this.apiBaseUrl}/public/client-intake/consultation-providers/continue`,
      {},
      { headers: this.tokenHeaders(token) },
    );
  }
  physicians(token: string): Observable<PublicPhysicianListState> {
    return this.http.get<PublicPhysicianListState>(
      `${this.apiBaseUrl}/public/client-intake/physicians`,
      { headers: this.tokenHeaders(token) },
    );
  }
  createPhysician(token: string, request: SavePublicPhysicianRequest): Observable<PublicPhysician> {
    return this.http.post<PublicPhysician>(
      `${this.apiBaseUrl}/public/client-intake/physicians`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  updatePhysician(
    token: string,
    id: string,
    request: SavePublicPhysicianRequest,
  ): Observable<PublicPhysician> {
    return this.http.put<PublicPhysician>(
      `${this.apiBaseUrl}/public/client-intake/physicians/${encodeURIComponent(id)}`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  continuePhysicians(token: string): Observable<PublicClientStepContinuation> {
    return this.http.post<PublicClientStepContinuation>(
      `${this.apiBaseUrl}/public/client-intake/physicians/continue`,
      {},
      { headers: this.tokenHeaders(token) },
    );
  }
  responsibleParties(token: string): Observable<PublicResponsiblePartyListState> {
    return this.http.get<PublicResponsiblePartyListState>(
      `${this.apiBaseUrl}/public/client-intake/responsible-parties`,
      { headers: this.tokenHeaders(token) },
    );
  }
  createResponsibleParty(
    token: string,
    request: SavePublicResponsiblePartyRequest,
  ): Observable<PublicResponsibleParty> {
    return this.http.post<PublicResponsibleParty>(
      `${this.apiBaseUrl}/public/client-intake/responsible-parties`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  updateResponsibleParty(
    token: string,
    id: string,
    request: SavePublicResponsiblePartyRequest,
  ): Observable<PublicResponsibleParty> {
    return this.http.put<PublicResponsibleParty>(
      `${this.apiBaseUrl}/public/client-intake/responsible-parties/${encodeURIComponent(id)}`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  continueResponsibleParties(token: string): Observable<PublicClientStepContinuation> {
    return this.http.post<PublicClientStepContinuation>(
      `${this.apiBaseUrl}/public/client-intake/responsible-parties/continue`,
      {},
      { headers: this.tokenHeaders(token) },
    );
  }
  hospitalizations(token: string): Observable<PublicHospitalizationListState> {
    return this.http.get<PublicHospitalizationListState>(
      `${this.apiBaseUrl}/public/client-intake/hospitalizations`,
      { headers: this.tokenHeaders(token) },
    );
  }
  createHospitalization(
    token: string,
    request: SavePublicHospitalizationRequest,
  ): Observable<PublicHospitalization> {
    return this.http.post<PublicHospitalization>(
      `${this.apiBaseUrl}/public/client-intake/hospitalizations`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  updateHospitalization(
    token: string,
    id: string,
    request: SavePublicHospitalizationRequest,
  ): Observable<PublicHospitalization> {
    return this.http.put<PublicHospitalization>(
      `${this.apiBaseUrl}/public/client-intake/hospitalizations/${encodeURIComponent(id)}`,
      request,
      { headers: this.tokenHeaders(token) },
    );
  }
  complete(token: string): Observable<PublicClientIntakeCompletion> {
    return this.http.post<PublicClientIntakeCompletion>(
      `${this.apiBaseUrl}/public/client-intake/complete`,
      null,
      { headers: this.tokenHeaders(token) },
    );
  }

  private tokenHeaders(_discardedInvitationToken: string): HttpHeaders {
    const csrfToken = document.cookie
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${CLIENT_INTAKE_CSRF_COOKIE}=`))
      ?.slice(CLIENT_INTAKE_CSRF_COOKIE.length + 1);
    return csrfToken
      ? new HttpHeaders().set(CLIENT_INTAKE_CSRF_HEADER, decodeURIComponent(csrfToken))
      : new HttpHeaders();
  }
}
