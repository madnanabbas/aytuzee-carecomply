import type { ClientDetails } from '../../models/client-api.models';
import type { Permission } from '../../../../core/authorization/permissions';
import {
  clientGenderLabel,
  clientProgramLabel,
  clientStatusLabel,
  formatDateForDisplay,
} from '../../models/client-presentation';

export type ClientViewTab =
  | 'overview'
  | 'primary-caregivers'
  | 'contacts'
  | 'care-coordinators'
  | 'consultation-providers'
  | 'doctors'
  | 'responsible-parties'
  | 'hospitalizations'
  | 'quick-notes'
  | 'todos'
  | 'coverage'
  | 'service-agreements'
  | 'forms'
  | 'documents'
  | 'email-logs'
  | 'employee-services';

export interface ClientTabDefinition {
  readonly id: ClientViewTab;
  readonly label: string;
  readonly viewPermission: Permission;
}

export type ClientDialog =
  'note' | 'hospitalization' | 'document' | 'employee-service' | 'visit' | 'form' | null;

export interface DialogDefinition {
  title: string;
  description: string;
  submitLabel: string;
}

export interface ClientDialogDraft {
  subject: string;
  noteType: string;
  note: string;
  taggedEmployee: string;
  attachment: string;
  hospital: string;
  hospitalizedIn: string;
  inTime: string;
  hospitalizedOut: string;
  outTime: string;
  reason: string;
  documentName: string;
  documentType: string;
  documentFile: string;
  issueDate: string;
  expiryDate: string;
  reviewDate: string;
  employee: string;
  employeeTitle: string;
  employeeService: string;
  assignmentStart: string;
  assignmentEnd: string;
  visitDate: string;
  visitEmployee: string;
  visitService: string;
  visitStart: string;
  visitEnd: string;
  formName: string;
  formCategory: string;
  formDueDate: string;
}

export interface RelatedRecordPreviewRow {
  readonly assignedTo: string;
  readonly attachment: string;
  readonly category: string;
  readonly created: string;
  readonly createdBy: string;
  readonly date: string;
  readonly document: string;
  readonly due: string;
  readonly duration: string;
  readonly email: string;
  readonly employee: string;
  readonly end: string;
  readonly expiry: string;
  readonly file: string;
  readonly form: string;
  readonly hospital: string;
  readonly hours: string;
  readonly inTime: string;
  readonly lastWorked: string;
  readonly livingWithClient: string;
  readonly name: string;
  readonly outTime: string;
  readonly phone: string;
  readonly preference: string;
  readonly priority: string;
  readonly reason: string;
  readonly recipient: string;
  readonly relationship: string;
  readonly sentAt: string;
  readonly sentBy: string;
  readonly service: string;
  readonly size: string;
  readonly start: string;
  readonly status: string;
  readonly subject: string;
  readonly tagged: string;
  readonly task: string;
  readonly title: string;
  readonly type: string;
  readonly updated: string;
}

export interface ClientViewModel {
  readonly id: string;
  readonly fullName: string;
  readonly firstName: string;
  readonly middleName: string;
  readonly lastName: string;
  readonly goesBy: string;
  readonly status: string;
  readonly onboarding: boolean;
  readonly pmi: string;
  readonly dob: string;
  readonly age: string;
  readonly gender: string;
  readonly phone: string;
  readonly secondaryPhone: string;
  readonly email: string;
  readonly address: string;
  readonly county: string;
  readonly intakeDate: string;
  readonly socDate: string;
  readonly referralSource: string;
  readonly program: string;
  readonly services: readonly string[];
  readonly location: string;
  readonly supervisor: string;
  readonly evvHours: string;
  readonly preferredLanguage: string;
  readonly safetyMeasure: string;
  readonly specialEquipment: string;
  readonly allergies: string;
  readonly otherServices: string;
  readonly insurance: string;
  readonly dischargeDate: string;
  readonly dischargeReason: string;
  readonly referringClient: string;
  readonly referringClientName: string;
  readonly referralCompany: string;
  readonly referralCompanyPhone: string;
  readonly homeCareRating: string;
  readonly medicalEquipment: string;
  readonly pcaComplexity: string;
  readonly maritalStatus: string;
  readonly ethnicity: string;
  readonly race: string;
  readonly smoking: string;
  readonly veteran: string;
  readonly pets: string;
  readonly veteranDetails: string;
  readonly petDetails: string;
  readonly livingArrangement: string;
  readonly livingArrangementDetails: string;
  readonly caregiverPreference: string;
  readonly preferredClinic: string;
  readonly preferredHospital: string;
  readonly preferredAmbulance: string;
  readonly nutritionalRequirements: string;
  readonly diet: string;
  readonly breakfastTime: string;
  readonly lunchTime: string;
  readonly dinnerTime: string;
  readonly notes: string;
  readonly additionalInformation: string;
  readonly eligibility: string;
  readonly eligibilityChecked: string;
}

export const EMPTY_CLIENT_VIEW: ClientViewModel = {
  id: '',
  fullName: '',
  firstName: '',
  middleName: '',
  lastName: '',
  goesBy: '—',
  status: '—',
  onboarding: false,
  pmi: '—',
  dob: '—',
  age: '—',
  gender: '—',
  phone: '—',
  secondaryPhone: '—',
  email: '—',
  address: '—',
  county: '—',
  intakeDate: '—',
  socDate: '—',
  referralSource: '—',
  program: '—',
  services: [],
  location: '—',
  supervisor: 'Managed through Employee Services',
  evvHours: '—',
  preferredLanguage: '—',
  safetyMeasure: '—',
  specialEquipment: '—',
  allergies: '—',
  insurance: '—',
  dischargeDate: '—',
  dischargeReason: '—',
  referringClient: '—',
  referringClientName: '—',
  referralCompany: '—',
  referralCompanyPhone: '—',
  homeCareRating: '—',
  medicalEquipment: '—',
  pcaComplexity: '—',
  otherServices: '—',
  maritalStatus: '—',
  ethnicity: '—',
  race: '—',
  smoking: '—',
  veteran: '—',
  pets: '—',
  veteranDetails: '—',
  petDetails: '—',
  livingArrangement: '—',
  livingArrangementDetails: '—',
  caregiverPreference: '—',
  preferredClinic: '—',
  preferredHospital: '—',
  preferredAmbulance: '—',
  nutritionalRequirements: '—',
  diet: '—',
  breakfastTime: '—',
  lunchTime: '—',
  dinnerTime: '—',
  notes: '—',
  additionalInformation: '—',
  eligibility: 'Not assessed',
  eligibilityChecked: '—',
};

export function toClientViewModel(details: ClientDetails): ClientViewModel {
  const profile = details.additionalProfile;
  const referral = parseStoredFields(profile?.referralDetails);
  const demographics = parseStoredFields(profile?.demographics);
  const living = parseStoredFields(profile?.livingArrangement);
  const meals = parseStoredFields(profile?.mealSchedule);
  const address =
    [
      details.addressLine1,
      details.addressLine2,
      details.city,
      details.state,
      details.postalCode,
      details.country,
    ]
      .map((value) => value?.trim() ?? '')
      .filter(Boolean)
      .join(', ') || '—';
  const preferredLanguage =
    details.languages.find((language) => language.isPrimary)?.languageName ??
    details.languages[0]?.languageName ??
    '—';
  const services = details.services
    .filter((service) => service.isActive)
    .map((service) => service.name);
  const program = details.additionalProfile
    ? clientProgramLabel(details.additionalProfile.programType)
    : '—';
  return {
    id: details.id,
    fullName: [details.firstName, details.middleName, details.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' '),
    firstName: details.firstName,
    middleName: details.middleName ?? '',
    lastName: details.lastName,
    goesBy: displayValue(details.preferredName),
    status: clientStatusLabel(details.status),
    onboarding: details.isOnboarding,
    pmi: details.pmiNumber,
    dob: formatDateForDisplay(details.dateOfBirth),
    age: calculateAge(details.dateOfBirth)?.toString() ?? '—',
    gender: clientGenderLabel(details.gender),
    phone: displayValue(details.primaryPhone),
    secondaryPhone: displayValue(details.secondaryPhone),
    email: displayValue(details.email),
    address,
    county: displayValue(details.county),
    intakeDate: formatDateForDisplay(details.intakeDate),
    socDate: formatDateForDisplay(details.socDate),
    referralSource: displayValue(details.referralSource),
    program,
    services: services.length ? services : ['—'],
    location: displayValue(details.location),
    supervisor: details.supervisorUserId
      ? displayValue(details.supervisorName)
      : 'Managed through Employee Services',
    evvHours:
      details.evvAuthorizedHoursPerWeek === null
        ? '—'
        : `${details.evvAuthorizedHoursPerWeek} hrs / week`,
    preferredLanguage,
    safetyMeasure: displayValue(details.safetyMeasures),
    specialEquipment: displayValue(details.specialEquipment),
    allergies: displayValue(details.allergies),
    otherServices: displayValue(details.otherServices),
    insurance: displayValue(details.insuranceProvider),
    dischargeDate: formatDateForDisplay(details.dischargeDate),
    dischargeReason: displayValue(details.dischargeReason),
    referringClient: displayBoolean(referral['referringClient']),
    referringClientName: displayValue(referral['referringClientName']),
    referralCompany: displayValue(referral['companyName']),
    referralCompanyPhone: displayValue(referral['companyPhone']),
    homeCareRating: displayValue(profile?.homeCareRating),
    medicalEquipment: displayValue(profile?.medicalEquipment),
    pcaComplexity: displayValue(profile?.pcaComplexity),
    maritalStatus: displayValue(demographics['maritalStatus']),
    ethnicity: displayValue(demographics['ethnicity']),
    race: displayValue(demographics['race']),
    smoking: displayBoolean(profile?.smokes),
    veteran: displayBoolean(profile?.isVeteran),
    pets: displayBoolean(profile?.hasPets),
    veteranDetails: displayValue(demographics['veteranDetails']),
    petDetails: displayValue(demographics['petsDetails']),
    livingArrangement: displayValue(living['type']),
    livingArrangementDetails: displayValue(living['details']),
    caregiverPreference: displayValue(profile?.caregiverPreference),
    preferredClinic: displayValue(profile?.preferredClinic),
    preferredHospital: displayValue(profile?.preferredHospital),
    preferredAmbulance: displayValue(profile?.preferredAmbulance),
    nutritionalRequirements: displayValue(profile?.nutritionalRequirements),
    diet: displayValue(profile?.diet),
    breakfastTime: displayValue(meals['breakfast']),
    lunchTime: displayValue(meals['lunch']),
    dinnerTime: displayValue(meals['dinner']),
    notes: displayValue(profile?.notes),
    additionalInformation: displayValue(profile?.additionalInformation),
    eligibility: 'Not assessed',
    eligibilityChecked: '—',
  };
}

function displayValue(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized ? normalized : '—';
}

function displayBoolean(value: boolean | string | null | undefined): string {
  if (value === true || value === 'Yes') return 'Yes';
  if (value === false || value === 'No') return 'No';
  return '—';
}

function parseStoredFields(value: string | null | undefined): Readonly<Record<string, string>> {
  const fields: Record<string, string> = {};
  for (const line of value?.split(/\r?\n/) ?? []) {
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return fields;
}

function calculateAge(dateOfBirth: string): number | null {
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const month = today.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age -= 1;
  return Math.max(0, age);
}
