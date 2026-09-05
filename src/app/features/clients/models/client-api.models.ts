export enum ClientStatusCode {
  Pending = 1,
  Active = 2,
  OnHold = 3,
  Discharged = 4,
  Inactive = 5,
}

export enum ClientGenderCode {
  Unknown = 0,
  Female = 1,
  Male = 2,
  NonBinary = 3,
  Other = 4,
  PreferNotToSay = 5,
}

export enum ClientProgramTypeCode {
  None = 0,
  PcaTraditional = 1,
  PcaChoice = 2,
  Two45D = 3,
  CfssAgency = 4,
  CfssBudget = 5,
}

export type SortDirection = 'asc' | 'desc';
export type ClientSortField = 'name' | 'pmi' | 'socDate' | 'status' | 'location';

export interface ClientServiceInput {
  readonly code: string;
  readonly name: string;
  readonly startDate: string;
}

export interface ClientLanguageInput {
  readonly languageCode: string;
  readonly languageName: string;
  readonly isPrimary: boolean;
}

export interface ClientAdditionalProfileRequest {
  readonly programType: ClientProgramTypeCode;
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

export interface CreateClientRequest {
  readonly identity: {
    readonly firstName: string;
    readonly middleName: string | null;
    readonly lastName: string;
    readonly preferredName: string | null;
    readonly dateOfBirth: string;
    readonly gender: string;
    readonly pmiNumber: string;
    readonly ssn?: string | null;
  };
  readonly contact: {
    readonly insuranceProvider: string | null;
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
  };
  readonly careSetup: {
    readonly intakeDate: string | null;
    readonly socDate: string;
    readonly referralSource: string | null;
    readonly location: string | null;
    readonly isOnboarding: boolean;
    readonly evvAuthorizedHoursPerWeek: number | null;
  };
  readonly safety: {
    readonly safetyMeasures: string | null;
    readonly specialEquipment: string | null;
    readonly allergies: string | null;
    readonly otherServices: string | null;
  };
  readonly additionalProfile: Omit<ClientAdditionalProfileRequest, 'programType'> & {
    readonly programType: string;
  };
  readonly initialStatus: string;
  readonly dischargeDate: string | null;
  readonly dischargeReason: string | null;
  readonly services: readonly Pick<ClientServiceInput, 'code' | 'name'>[];
  readonly languages: readonly ClientLanguageInput[];
}

export interface LegacyClientWriteRequest {
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  readonly preferredName: string | null;
  readonly dateOfBirth: string;
  readonly gender: ClientGenderCode;
  readonly pmiNumber: string;
  readonly insuranceProvider: string | null;
  readonly email: string | null;
  readonly primaryPhone: string | null;
  readonly secondaryPhone: string | null;
  readonly intakeDate: string | null;
  readonly socDate: string;
  readonly referralSource: string | null;
  readonly status: ClientStatusCode;
  readonly location: string | null;
  readonly isOnboarding: boolean;
  readonly dischargeDate: string | null;
  readonly dischargeReason: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly county: string | null;
  readonly country: string | null;
  readonly evvAuthorizedHoursPerWeek: number | null;
  readonly safetyMeasures: string | null;
  readonly specialEquipment: string | null;
  readonly allergies: string | null;
  readonly otherServices: string | null;
  readonly additionalProfile: ClientAdditionalProfileRequest;
  readonly services: readonly ClientServiceInput[];
  readonly languages: readonly ClientLanguageInput[];
}

export interface CreateClientResponse {
  readonly id: string;
  readonly editorVersion?: string;
}

export interface UpdateClientRequest extends Omit<CreateClientRequest, 'initialStatus' | 'dischargeDate' | 'dischargeReason'> {
  readonly editorVersion: string;
  readonly serviceChangeEffectiveDate: string | null;
}

export interface ChangeClientStatusRequest {
  readonly status: ClientStatusCode;
  readonly dischargeDate: string | null;
  readonly dischargeReason: string | null;
  readonly editorVersion: string;
}

export interface ClientServiceDetails {
  readonly id?: string;
  readonly code: string;
  readonly name: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly isActive: boolean;
}

export interface ClientLanguageDetails {
  readonly languageCode: string;
  readonly languageName: string;
  readonly isPrimary: boolean;
}

export interface ClientAdditionalProfileDetails {
  readonly programType: ClientProgramTypeCode | string;
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

export interface ClientDetails {
  readonly id: string;
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  readonly preferredName: string | null;
  readonly dateOfBirth: string;
  readonly gender: ClientGenderCode | string;
  readonly pmiNumber: string;
  readonly hasSsn: boolean;
  readonly insuranceProvider: string | null;
  readonly email: string | null;
  readonly primaryPhone: string | null;
  readonly secondaryPhone: string | null;
  readonly intakeDate: string | null;
  readonly socDate: string;
  readonly referralSource: string | null;
  readonly status: ClientStatusCode | string;
  readonly location: string | null;
  readonly isOnboarding: boolean;
  readonly dischargeDate: string | null;
  readonly dischargeReason: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly county: string | null;
  readonly country: string | null;
  readonly evvAuthorizedHoursPerWeek: number | null;
  readonly safetyMeasures: string | null;
  readonly specialEquipment: string | null;
  readonly allergies: string | null;
  readonly otherServices: string | null;
  readonly additionalProfile: ClientAdditionalProfileDetails | null;
  readonly services: readonly ClientServiceDetails[];
  readonly languages: readonly ClientLanguageDetails[];
  readonly editorVersion: string;
}

export interface ClientListApiItem {
  readonly id: string;
  readonly displayName: string;
  readonly preferredName: string | null;
  readonly pmiNumber: string;
  readonly dateOfBirth: string;
  readonly gender: ClientGenderCode | string;
  readonly programType: ClientProgramTypeCode | string;
  readonly services: readonly ClientServiceDetails[];
  readonly location: string | null;
  readonly socDate: string;
  readonly status: ClientStatusCode | string;
  readonly isOnboarding: boolean;
  readonly updatedAtUtc: string;
}

export interface ClientDetailsApiResponse {
  readonly id: string;
  readonly identity: {
    readonly firstName: string;
    readonly middleName: string;
    readonly lastName: string;
    readonly preferredName: string;
    readonly dateOfBirth: string;
    readonly gender: string;
    readonly pmiNumber: string;
    readonly hasSsn: boolean;
  };
  readonly contact: {
    readonly insuranceProvider: string;
    readonly email: string;
    readonly primaryPhone: string;
    readonly secondaryPhone: string;
    readonly addressLine1: string;
    readonly addressLine2: string;
    readonly city: string;
    readonly state: string;
    readonly postalCode: string;
    readonly county: string;
    readonly country: string;
  };
  readonly careSetup: {
    readonly intakeDate: string | null;
    readonly socDate: string;
    readonly referralSource: string;
    readonly status: string;
    readonly location: string;
    readonly isOnboarding: boolean;
    readonly evvAuthorizedHoursPerWeek: number | null;
    readonly dischargeDate: string | null;
    readonly dischargeReason: string;
  };
  readonly safety: {
    readonly safetyMeasures: string;
    readonly specialEquipment: string;
    readonly allergies: string;
    readonly otherServices: string;
  };
  readonly additionalProfile: ClientAdditionalProfileDetails;
  readonly services: readonly ClientServiceDetails[];
  readonly languages: readonly ClientLanguageDetails[];
  readonly editorVersion: string;
}

export interface ClientListResponse {
  readonly items: readonly ClientListApiItem[];
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly activeCount?: number;
  readonly onboardingCount?: number;
  readonly availableLocations?: readonly string[];
}

export interface ClientListQuery {
  readonly search: string;
  readonly status: ClientStatusCode | null;
  readonly programType: ClientProgramTypeCode | null;
  readonly service: string;
  readonly location: string;
  readonly onboarding: boolean | null;
  readonly sortBy: ClientSortField;
  readonly sortDirection: SortDirection;
  readonly pageNumber: number;
  readonly pageSize: number;
}

export interface ClientProblemDetails {
  readonly type?: string;
  readonly title?: string;
  readonly detail?: string;
  readonly status?: number;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}

export const DEFAULT_CLIENT_LIST_QUERY: ClientListQuery = {
  search: '',
  status: null,
  programType: null,
  service: '',
  location: '',
  onboarding: null,
  sortBy: 'name',
  sortDirection: 'asc',
  pageNumber: 1,
  pageSize: 25,
};
