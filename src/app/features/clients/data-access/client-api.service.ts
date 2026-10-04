import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';
import {
  ChangeClientStatusRequest,
  ClientMutationResponse,
  ClientDetails,
  ClientDetailsApiResponse,
  ClientListQuery,
  ClientListResponse,
  ClientCreationProgressResponse,
  ClientCreationState,
  ClientCreationStateApiResponse,
  CompleteClientCreationResponse,
  CreateClientGuestInvitationRequest,
  CreateClientGuestInvitationResponse,
  CreateClientRequest,
  CreateClientBasicDetailsRequest,
  CreateClientResponse,
  UpdateClientRequest,
  UpdateClientBasicDetailsRequest,
  UpdateClientAdditionalInformationRequest,
  UpdateClientContactInformationRequest,
  SendClientGuestInvitationResponse,
} from '../models/client-api.models';

@Injectable({ providedIn: 'root' })
export class ClientApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  supervisorCandidates(
    locationId: string,
  ): Observable<readonly { id: string; name: string; jobTitle: string }[]> {
    return this.http.get<readonly { id: string; name: string; jobTitle: string }[]>(
      `${this.clientsUrl()}/supervisor-candidates`,
      { params: new HttpParams().set('locationId', locationId) },
    );
  }

  listClients(query: ClientListQuery): Observable<ClientListResponse> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);

    if (query.search) params = params.set('search', query.search);
    if (query.status !== null) params = params.set('status', query.status);
    if (query.programType !== null) params = params.set('programType', query.programType);
    if (query.service) params = params.set('serviceCode', query.service);
    if (query.location) params = params.set('location', query.location);
    if (query.onboarding !== null) params = params.set('isOnboarding', query.onboarding);

    return this.http.get<ClientListResponse>(this.clientsUrl(), { params });
  }

  getClient(clientId: string): Observable<ClientDetails> {
    return this.http
      .get<ClientDetailsApiResponse>(`${this.clientsUrl()}/${encodeURIComponent(clientId)}`)
      .pipe(map(mapClientDetails));
  }

  revealClientSsn(clientId: string): Observable<{ readonly ssn: string }> {
    return this.http.get<{ readonly ssn: string }>(
      `${this.clientsUrl()}/${encodeURIComponent(clientId)}/ssn`,
    );
  }

  createClient(request: CreateClientRequest): Observable<CreateClientResponse> {
    return this.http.post<CreateClientResponse>(this.clientsUrl(), request);
  }

  createClientBasicDetails(
    request: CreateClientBasicDetailsRequest,
  ): Observable<CreateClientResponse> {
    return this.http.post<CreateClientResponse>(`${this.clientsUrl()}/basic-details`, request);
  }

  updateClientBasicDetails(
    clientId: string,
    request: UpdateClientBasicDetailsRequest,
  ): Observable<ClientMutationResponse> {
    return this.http.put<ClientMutationResponse>(
      `${this.clientsUrl()}/${encodeURIComponent(clientId)}/basic-details`,
      request,
    );
  }

  updateClientAdditionalInformation(
    clientId: string,
    request: UpdateClientAdditionalInformationRequest,
  ): Observable<ClientMutationResponse> {
    return this.http.put<ClientMutationResponse>(
      `${this.clientsUrl()}/${encodeURIComponent(clientId)}/additional-information`,
      request,
    );
  }

  updateClientContactInformation(
    clientId: string,
    request: UpdateClientContactInformationRequest,
  ): Observable<ClientMutationResponse> {
    return this.http.put<ClientMutationResponse>(
      `${this.clientsUrl()}/${encodeURIComponent(clientId)}/contact-information`,
      request,
    );
  }

  completeClientCreation(
    clientId: string,
    editorVersion: string,
  ): Observable<CompleteClientCreationResponse> {
    return this.http.post<CompleteClientCreationResponse>(
      `${this.clientsUrl()}/${encodeURIComponent(clientId)}/complete-creation`,
      { editorVersion },
    );
  }

  getClientCreationState(clientId: string): Observable<ClientCreationState> {
    return this.http
      .get<ClientCreationStateApiResponse>(
        `${this.clientsUrl()}/${encodeURIComponent(clientId)}/creation-state`,
      )
      .pipe(
        map((response) => ({
          id: response.id,
          status: response.status,
          currentStep: response.currentStep,
          editorVersion: response.editorVersion,
          client: mapClientDetails({
            id: response.id,
            editorVersion: response.editorVersion,
            identity: response.identity,
            contact: response.contact,
            careSetup: response.careSetup,
            additionalProfile: response.additionalProfile,
            services: response.services,
            languages: response.languages,
            safety: {
              safetyMeasures: '',
              specialEquipment: '',
              allergies: '',
              otherServices: '',
            },
          }),
        })),
      );
  }

  advanceClientCreationProgress(
    clientId: string,
    step: number,
    editorVersion: string,
  ): Observable<ClientCreationProgressResponse> {
    return this.http.post<ClientCreationProgressResponse>(
      `${this.clientsUrl()}/${encodeURIComponent(clientId)}/creation-progress`,
      { step, editorVersion },
    );
  }

  updateClient(clientId: string, request: UpdateClientRequest): Observable<ClientDetails> {
    return this.http
      .put<ClientDetailsApiResponse>(
        `${this.clientsUrl()}/${encodeURIComponent(clientId)}`,
        request,
      )
      .pipe(map(mapClientDetails));
  }

  changeStatus(clientId: string, request: ChangeClientStatusRequest): Observable<ClientDetails> {
    return this.http
      .put<ClientDetailsApiResponse>(
        `${this.clientsUrl()}/${encodeURIComponent(clientId)}/status`,
        request,
      )
      .pipe(map(mapClientDetails));
  }

  createGuestInvitation(
    request: CreateClientGuestInvitationRequest,
  ): Observable<CreateClientGuestInvitationResponse> {
    return this.http.post<CreateClientGuestInvitationResponse>(
      `${this.clientsUrl()}/guest-invitations`,
      request,
    );
  }

  sendGuestInvitation(
    invitationId: string,
    token: string,
  ): Observable<SendClientGuestInvitationResponse> {
    return this.http.post<SendClientGuestInvitationResponse>(
      `${this.clientsUrl()}/guest-invitations/${encodeURIComponent(invitationId)}/send`,
      { token },
    );
  }

  private clientsUrl(): string {
    return `${this.apiBaseUrl}/clients`;
  }
}

function mapClientDetails(response: ClientDetailsApiResponse): ClientDetails {
  return {
    id: response.id,
    firstName: response.identity.firstName,
    middleName: response.identity.middleName || null,
    lastName: response.identity.lastName,
    preferredName: response.identity.preferredName || null,
    dateOfBirth: response.identity.dateOfBirth,
    gender: response.identity.gender,
    pmiNumber: response.identity.pmiNumber,
    hasSsn: response.identity.hasSsn,
    insuranceProvider: response.contact.insuranceProvider || null,
    email: response.contact.email || null,
    primaryPhone: response.contact.primaryPhone || null,
    secondaryPhone: response.contact.secondaryPhone || null,
    intakeDate: response.careSetup.intakeDate,
    socDate: response.careSetup.socDate,
    referralSource: response.careSetup.referralSource || null,
    status: response.careSetup.status,
    location: response.careSetup.location || null,
    locationId: response.careSetup.locationId ?? '',
    supervisorUserId: response.careSetup.supervisorUserId ?? null,
    isOnboarding: response.careSetup.isOnboarding,
    dischargeDate: response.careSetup.dischargeDate,
    dischargeReason: response.careSetup.dischargeReason || null,
    addressLine1: response.contact.addressLine1 || null,
    addressLine2: response.contact.addressLine2 || null,
    city: response.contact.city || null,
    state: response.contact.state || null,
    postalCode: response.contact.postalCode || null,
    county: response.contact.county || null,
    country: response.contact.country || null,
    evvAuthorizedHoursPerWeek: response.careSetup.evvAuthorizedHoursPerWeek,
    safetyMeasures: response.safety.safetyMeasures || null,
    specialEquipment: response.safety.specialEquipment || null,
    allergies: response.safety.allergies || null,
    otherServices: response.safety.otherServices || null,
    additionalProfile: response.additionalProfile,
    services: response.services,
    languages: response.languages,
    editorVersion: response.editorVersion,
  };
}
