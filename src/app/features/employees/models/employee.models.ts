export interface EmployeeSummary {
  id: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  jobTitle: string;
  isActive: boolean;
  hireDate: string | null;
  locations: readonly string[];
}
export interface EmployeeListResponse {
  items: readonly EmployeeSummary[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export interface EmployeePreviousAddress {
  street: string;
  postalCode: string;
  city: string;
  county: string;
  state: string;
}
export interface EmployeePayerAffiliation {
  company: string;
  payer: string;
  payerId: string;
  applicationFaxedDate: string;
  affiliationDate: string;
  affiliationEndDate: string;
}
export interface EmployeeBackgroundCheck {
  checkDate: string;
  receivedDate: string;
  licenseType: string;
  studyType: string;
  received: boolean;
}
export interface EmployeeBackgroundInformation {
  checks: EmployeeBackgroundCheck[];
  mantouxGivenDate: string;
  mantouxCheckedDate: string;
  mantouxReceived: boolean;
  medicalTestingDate: string;
  medicalTestingReceived: boolean;
}
export interface EmployeeCourse {
  courseName: string;
  qualifyingPoints: number | null;
  completedOn: string;
  obtainedPoints: number | null;
  notes: string;
}
export interface EmployeeTrainingSkill {
  trainingName: string;
  jobTitle: string;
  qualifyingPoints: number | null;
  completedOn: string;
  expiresOn: string;
  obtainedPoints: number | null;
  notes: string;
  allowedTraining: boolean;
}
export interface EmployeeTrainingInformation {
  courses: EmployeeCourse[];
  trainings: EmployeeTrainingSkill[];
}
export interface EmployeeContact {
  name: string;
  phone: string;
  relationship: string;
}
export interface EmployeeFormModel {
  companyId: string | null;
  locationIds: string[];
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  jobTitle: string;
  secondaryJobTitle: string;
  isActive: boolean;
  hireDate: string;
  startOfServiceDate: string;
  inactiveDate: string;
  dateOfBirth: string;
  gender: string;
  ssn: string;
  hasSsn?: boolean;
  languages: string[];
  hoursPerMonth: number | null;
  umpi: string;
  npi: string;
  licenseId: string;
  driverLicenseExpiresOn: string;
  streetAddress: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  county: string;
  notes: string;
  careProgram: string;
  hasUsedDifferentName: boolean;
  previousName: string;
  heightInches: number | null;
  weightPounds: number | null;
  hairColor: string;
  eyeColor: string;
  birthPlace: string;
  cfssCertificationNumber: string;
  hasWorkingHourRestrictions: boolean;
  availableDays: string[];
  availableStartTime: string;
  availableEndTime: string;
  previousAddresses: EmployeePreviousAddress[];
  maritalStatus: string;
  ethnicity: string;
  qualifications: string[];
  canWorkWithSmokers: boolean;
  smokerRestrictionExplanation: string;
  isUnionMember: boolean;
  isMilitaryVeteran: boolean;
  militaryServiceExplanation: string;
  race: string;
  demographicDescription: string;
  canWorkWithPets: boolean;
  petRestrictionExplanation: string;
  clientTypes: string[];
  hasOtherJob: boolean;
  otherEmployerName: string;
  otherEmploymentDuration: string;
  canDriveForWork: boolean;
  previousWorkExperience: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  emergencyContactAddress: string;
  trainingName: string;
  trainingProvider: string;
  trainingCompletedOn: string;
  trainingExpiresOn: string;
  trainingCertificateNumber: string;
  payerName: string;
  payerMemberId: string;
  payerGroupNumber: string;
  payerPlanName: string;
  payerEffectiveFrom: string;
  payerEffectiveTo: string;
  payerPhone: string;
  allowAggregator: boolean;
  overrideRestriction: boolean;
  evvOnly: boolean;
  restrictDateAndTime: boolean;
  evvEmail: string;
  evvPassword: string;
  evvPasswordConfirm: string;
  hasEvvPassword?: boolean;
  ivrPin: string;
  hasIvrPin?: boolean;
  evvIvrAuthorization: string;
  employeeTier: string;
  tierEffectiveDate: string;
  isOnboarding: boolean;
  allowVisitScreen: boolean;
  allowTravelTime: boolean;
  allowManualEntry: boolean;
  allowOneTimeLogin: boolean;
  insuranceAffiliationRequired?: boolean;
  payerAffiliations?: EmployeePayerAffiliation[];
  backgroundInformation?: EmployeeBackgroundInformation;
  trainingInformation?: EmployeeTrainingInformation;
  contacts?: EmployeeContact[];
}
export type EmployeeDto = EmployeeFormModel & { id: string };
export type SaveEmployeeRequest = Omit<EmployeeFormModel, 'evvPasswordConfirm'> &
  Record<string, unknown>;

export const emptyBackgroundCheck = (): EmployeeBackgroundCheck => ({
  checkDate: '',
  receivedDate: '',
  licenseType: '',
  studyType: '',
  received: false,
});
export const emptyBackgroundInformation = (): EmployeeBackgroundInformation => ({
  checks: [],
  mantouxGivenDate: '',
  mantouxCheckedDate: '',
  mantouxReceived: false,
  medicalTestingDate: '',
  medicalTestingReceived: false,
});
export const emptyCourse = (): EmployeeCourse => ({
  courseName: '',
  qualifyingPoints: null,
  completedOn: '',
  obtainedPoints: null,
  notes: '',
});
export const emptyTraining = (): EmployeeTrainingSkill => ({
  trainingName: '',
  jobTitle: '',
  qualifyingPoints: null,
  completedOn: '',
  expiresOn: '',
  obtainedPoints: null,
  notes: '',
  allowedTraining: false,
});
export const emptyTrainingInformation = (): EmployeeTrainingInformation => ({
  courses: [],
  trainings: [],
});
export const emptyContact = (): EmployeeContact => ({ name: '', phone: '', relationship: '' });
export const emptyEmployee = (): EmployeeFormModel => ({
  companyId: null,
  locationIds: [],
  firstName: '',
  middleName: '',
  lastName: '',
  preferredName: '',
  email: '',
  phone: '',
  secondaryPhone: '',
  jobTitle: '',
  secondaryJobTitle: '',
  isActive: true,
  hireDate: '',
  startOfServiceDate: '',
  inactiveDate: '',
  dateOfBirth: '',
  gender: '',
  ssn: '',
  languages: ['English'],
  hoursPerMonth: null,
  umpi: '',
  npi: '',
  licenseId: '',
  driverLicenseExpiresOn: '',
  streetAddress: '',
  apartment: '',
  city: '',
  state: 'MN',
  postalCode: '',
  county: '',
  notes: '',
  careProgram: 'PCA Traditional',
  hasUsedDifferentName: false,
  previousName: '',
  heightInches: null,
  weightPounds: null,
  hairColor: '',
  eyeColor: '',
  birthPlace: '',
  cfssCertificationNumber: '',
  hasWorkingHourRestrictions: false,
  availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  availableStartTime: '',
  availableEndTime: '',
  previousAddresses: [],
  maritalStatus: '',
  ethnicity: '',
  qualifications: [],
  canWorkWithSmokers: true,
  smokerRestrictionExplanation: '',
  isUnionMember: false,
  isMilitaryVeteran: false,
  militaryServiceExplanation: '',
  race: '',
  demographicDescription: '',
  canWorkWithPets: true,
  petRestrictionExplanation: '',
  clientTypes: [],
  hasOtherJob: false,
  otherEmployerName: '',
  otherEmploymentDuration: '',
  canDriveForWork: false,
  previousWorkExperience: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  emergencyContactEmail: '',
  emergencyContactAddress: '',
  trainingName: '',
  trainingProvider: '',
  trainingCompletedOn: '',
  trainingExpiresOn: '',
  trainingCertificateNumber: '',
  payerName: '',
  payerMemberId: '',
  payerGroupNumber: '',
  payerPlanName: '',
  payerEffectiveFrom: '',
  payerEffectiveTo: '',
  payerPhone: '',
  allowAggregator: false,
  overrideRestriction: false,
  evvOnly: false,
  restrictDateAndTime: false,
  evvEmail: '',
  evvPassword: '',
  evvPasswordConfirm: '',
  ivrPin: '',
  evvIvrAuthorization: '',
  employeeTier: '',
  tierEffectiveDate: '',
  isOnboarding: false,
  allowVisitScreen: false,
  allowTravelTime: false,
  allowManualEntry: false,
  allowOneTimeLogin: false,
  insuranceAffiliationRequired: false,
  payerAffiliations: [],
  backgroundInformation: emptyBackgroundInformation(),
  trainingInformation: emptyTrainingInformation(),
  contacts: [],
});
