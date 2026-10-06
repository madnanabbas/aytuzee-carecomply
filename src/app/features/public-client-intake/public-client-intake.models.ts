export type PublicClientInvitationState =
  'Ready' | 'Used' | 'Invalid' | 'Expired' | 'Unavailable' | 'Completed' | 'SessionExpired';

export interface PublicClientInvitationContext {
  readonly state: PublicClientInvitationState;
  readonly clientDisplayName: string | null;
  readonly expiresAtUtc: string | null;
  readonly hasCreatedClient: boolean;
  readonly creationProgressStep?: number;
}

export type PublicClientIntakeViewState =
  | 'validating'
  | 'ready'
  | 'invalid'
  | 'expired'
  | 'unavailable'
  | 'completed'
  | 'used'
  | 'sessionExpired'
  | 'missing'
  | 'error';

export interface PublicClientIntakeLocation {
  readonly id: string;
  readonly displayName: string;
}

export interface PublicClientIntakeSupervisor {
  readonly id: string;
  readonly displayName: string;
  readonly jobTitle: string;
}

export interface PublicClientIntakeLookupResponse<T> {
  readonly state: PublicClientInvitationState;
  readonly locations?: readonly T[];
  readonly supervisors?: readonly T[];
}

export interface PublicClientIntakeContinuation {
  readonly state: 'InProgress' | 'AlreadyStarted';
  readonly nextStep: number;
  readonly editorVersion: string;
  readonly hasCreatedClient: boolean;
}

export interface PublicClientBasicDetailsRequest {
  readonly identity: {
    readonly firstName: string;
    readonly middleName: string | null;
    readonly lastName: string;
    readonly preferredName: string | null;
    readonly dateOfBirth: string;
    readonly gender: string;
    readonly pmiNumber: string;
    readonly ssn: string | null;
  };
  readonly careSetup: {
    readonly intakeDate: string | null;
    readonly socDate: string;
    readonly referralSource: string | null;
    readonly locationId: string;
    readonly supervisorUserId: string | null;
    readonly evvAuthorizedHoursPerWeek: number | null;
  };
  readonly insuranceProvider: string | null;
  readonly services: readonly { readonly code: string; readonly name: string }[];
}

export interface PublicClientAdditionalInformation {
  readonly programType: string;
  readonly referralDetails: string | null;
  readonly homeCareRating: string | null;
  readonly medicalEquipment: string | null;
  readonly pcaComplexity: string | null;
  readonly demographics: string | null;
  readonly smokes: boolean | null;
  readonly isVeteran: boolean | null;
  readonly hasPets: boolean | null;
  readonly livingArrangement: string | null;
  readonly preferredClinic: string | null;
  readonly preferredHospital: string | null;
  readonly preferredAmbulance: string | null;
  readonly caregiverPreference: string | null;
  readonly nutritionalRequirements: string | null;
  readonly diet: string | null;
  readonly mealSchedule: string | null;
  readonly notes: string | null;
  readonly additionalInformation: string | null;
}

export interface PublicClientAdditionalInformationState {
  readonly additionalInformation: PublicClientAdditionalInformation;
  readonly editorVersion: string;
  readonly creationProgressStep: number;
}

export interface PublicClientAdditionalInformationUpdate {
  readonly additionalInformation: PublicClientAdditionalInformation;
  readonly editorVersion: string;
}

export interface PublicClientStepContinuation {
  readonly editorVersion: string;
  readonly nextStep: number;
}

export interface PublicClientContactInformation {
  readonly email: string | null;
  readonly primaryPhone: string | null;
  readonly secondaryPhone: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly county: string | null;
  readonly country: string | null;
  readonly preferredLanguages: readonly {
    readonly languageCode: string;
    readonly languageName: string;
    readonly isPrimary: boolean;
  }[];
}
export interface PublicClientContactInformationState {
  readonly contactInformation: PublicClientContactInformation;
  readonly editorVersion: string;
  readonly creationProgressStep: number;
}
export interface PublicClientContactInformationUpdate {
  readonly contactInformation: PublicClientContactInformation;
  readonly editorVersion: string;
}

export interface PublicCaregiverCandidate {
  readonly id: string;
  readonly displayName: string;
  readonly jobTitle: string;
}
export interface PublicCaregiverAssignment {
  readonly assignmentId: string;
  readonly caregiverUserId: string;
  readonly caregiverDisplayName: string;
  readonly jobTitle: string;
  readonly assignmentType: 'Primary' | 'Backup';
  readonly relationship: string;
  readonly livesWithClient: boolean | null;
  readonly assignedServices: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly status: 'Active' | 'Ended';
  readonly clientPreference: boolean;
  readonly notes: string;
  readonly editorVersion: string;
}
export interface PublicCaregiverListState {
  readonly caregivers: readonly PublicCaregiverAssignment[];
  readonly availableServices: readonly string[];
  readonly creationProgressStep: number;
}
export interface SavePublicCaregiverRequest {
  readonly caregiverUserId: string;
  readonly assignmentType: 'Primary' | 'Backup';
  readonly clientPreference: boolean;
  readonly assignedServices: string | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly relationship: string | null;
  readonly livesWithClient: boolean | null;
  readonly notes: string | null;
  readonly editorVersion?: string;
}
export interface PublicClientContact {
  readonly id: string;
  readonly type: 'General' | 'Emergency';
  readonly name: string;
  readonly relationship: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly isActive: boolean;
}
export interface PublicClientContactListState {
  readonly contacts: readonly PublicClientContact[];
  readonly creationProgressStep: number;
}
export interface SavePublicClientContactRequest {
  readonly type: 'General' | 'Emergency';
  readonly name: string;
  readonly relationship: string;
  readonly phone: string;
  readonly email: string | null;
  readonly address: string | null;
  readonly isActive: boolean;
}
export interface PublicCareCoordinator {
  readonly id: string;
  readonly name: string;
  readonly companyName: string;
  readonly phone: string;
  readonly phoneExtension: string;
  readonly fax: string;
  readonly email: string;
  readonly isActive: boolean;
}
export interface PublicCareCoordinatorListState {
  readonly coordinators: readonly PublicCareCoordinator[];
  readonly creationProgressStep: number;
}
export interface SavePublicCareCoordinatorRequest {
  readonly name: string;
  readonly companyName: string | null;
  readonly phone: string | null;
  readonly phoneExtension: string | null;
  readonly fax: string | null;
  readonly email: string | null;
  readonly isActive: boolean;
}
export interface PublicConsultationProvider {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly supportProviderName: string;
  readonly supportProviderPhone: string;
  readonly supportProviderAddress: string;
  readonly isActive: boolean;
}
export interface PublicConsultationProviderListState {
  readonly providers: readonly PublicConsultationProvider[];
  readonly creationProgressStep: number;
}
export interface SavePublicConsultationProviderRequest {
  readonly name: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly supportProviderName: string | null;
  readonly supportProviderPhone: string | null;
  readonly supportProviderAddress: string | null;
  readonly isActive: boolean;
}
export interface PublicPhysician {
  readonly id: string;
  readonly name: string;
  readonly npi: string;
  readonly phone: string;
  readonly fax: string;
  readonly address: string;
  readonly zipCode: string;
  readonly city: string;
  readonly state: string;
  readonly isActive: boolean;
}
export interface PublicPhysicianListState {
  readonly physicians: readonly PublicPhysician[];
  readonly creationProgressStep: number;
}
export interface SavePublicPhysicianRequest {
  readonly name: string;
  readonly npi: string | null;
  readonly phone: string | null;
  readonly fax: string | null;
  readonly address: string | null;
  readonly zipCode: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly isActive: boolean;
}
export interface PublicResponsibleParty {
  readonly id: string;
  readonly name: string;
  readonly relationship: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly livesWithClient: boolean | null;
  readonly hasSpenddown: boolean | null;
  readonly isActive: boolean;
}
export interface PublicResponsiblePartyListState {
  readonly responsibleParties: readonly PublicResponsibleParty[];
  readonly creationProgressStep: number;
}
export interface SavePublicResponsiblePartyRequest {
  readonly name: string;
  readonly relationship: string;
  readonly phone: string;
  readonly email: string | null;
  readonly address: string | null;
  readonly livesWithClient: boolean;
  readonly hasSpenddown: boolean;
  readonly isActive: boolean;
}
export interface PublicHospitalization {
  readonly id: string;
  readonly hospitalName: string;
  readonly admittedAtUtc: string;
  readonly dischargedAtUtc: string | null;
  readonly reason: string;
  readonly diagnosis: string;
  readonly dischargeInstructions: string;
  readonly editorVersion: string;
}
export interface PublicHospitalizationListState {
  readonly hospitalizations: readonly PublicHospitalization[];
  readonly creationProgressStep: number;
}
export interface SavePublicHospitalizationRequest {
  readonly hospitalName: string;
  readonly admittedAtUtc: string;
  readonly dischargedAtUtc: string | null;
  readonly reason: string;
  readonly diagnosis: string | null;
  readonly dischargeInstructions: string | null;
  readonly editorVersion: string | null;
}
export interface PublicClientIntakeCompletion {
  readonly state: 'Completed';
  readonly completedAtUtc: string;
  readonly message: string;
}
