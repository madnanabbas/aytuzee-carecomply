import {
  ClientAdditionalProfileRequest,
  ClientDetails,
  ClientGenderCode,
  ClientLanguageInput,
  ClientProgramTypeCode,
  ClientServiceInput,
  ClientStatusCode,
  CreateClientRequest,
  LegacyClientWriteRequest,
  UpdateClientRequest,
} from './client-api.models';
import {
  booleanChoice,
  clientGenderCode,
  clientGenderLabel,
  clientProgramCode,
  clientProgramLabel,
  clientStatusCode,
  clientStatusLabel,
  nullableBoolean,
  nullableTrimmed,
} from './client-presentation';

export interface ClientFormModel {
  intakeDate: string;
  socDate: string;
  referralSource: string;
  status: string;
  location: string;
  pmi: string;
  insurance: string;
  services: string[];
  serviceChangeEffectiveDate: string;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  goesBy: string;
  dob: string;
  gender: string;
  dischargeDate: string;
  dischargeReason: string;
  phone1: string;
  phone2: string;
  ssn: string;
  languages: string[];
  street: string;
  apartment: string;
  zip: string;
  city: string;
  county: string;
  state: string;
  country: string;
  safetyMeasure: string;
  specialEquipment: string;
  allergies: string;
  otherServices: string;
  evvHours: string | number;
  supervisor: string;
  onboarding: boolean;
  programType: string;
  notes: string;
  referringClient: boolean;
  referringClientName: string;
  companyName: string;
  companyPhone: string;
  homeCareRatingStatus: string;
  medicalEquipment: string;
  pcaComplexity: string;
  maritalStatus: string;
  ethnicity: string;
  race: string;
  smoking: string;
  veteran: string;
  veteranDetails: string;
  pets: string;
  petsDetails: string;
  livingArrangement: string;
  livingArrangementDetails: string;
  clinicName: string;
  clinicPhone: string;
  clinicFax: string;
  clinicAddress: string;
  hospitalName: string;
  hospitalPhone: string;
  hospitalFax: string;
  hospitalAddress: string;
  ambulanceName: string;
  ambulancePhone: string;
  ambulanceFax: string;
  ambulanceAddress: string;
  nutritionalRequirements: string;
  caregiverPreference: string;
  diet: string[];
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  additionalInformation: string;
}

export function createEmptyClientForm(): ClientFormModel {
  return {
    intakeDate: '', socDate: '', referralSource: '', status: 'Active', location: '', pmi: '', insurance: '', services: [], serviceChangeEffectiveDate: '',
    email: '', firstName: '', middleName: '', lastName: '', goesBy: '', dob: '', gender: '', dischargeDate: '', dischargeReason: '',
    phone1: '', phone2: '', ssn: '', languages: [], street: '', apartment: '', zip: '', city: '', county: '', state: 'Minnesota', country: 'United States',
    safetyMeasure: '', specialEquipment: '', allergies: '', otherServices: '', evvHours: '', supervisor: '', onboarding: true,
    programType: '', notes: '', referringClient: false, referringClientName: '', companyName: '', companyPhone: '', homeCareRatingStatus: '',
    medicalEquipment: '', pcaComplexity: '', maritalStatus: '', ethnicity: '', race: '', smoking: '', veteran: '', veteranDetails: '',
    pets: '', petsDetails: '', livingArrangement: '', livingArrangementDetails: '', clinicName: '', clinicPhone: '', clinicFax: '', clinicAddress: '',
    hospitalName: '', hospitalPhone: '', hospitalFax: '', hospitalAddress: '', ambulanceName: '', ambulancePhone: '', ambulanceFax: '', ambulanceAddress: '',
    nutritionalRequirements: '', caregiverPreference: '', diet: [], breakfastTime: '', lunchTime: '', dinnerTime: '', additionalInformation: '',
  };
}

export function clientDetailsToForm(details: ClientDetails): ClientFormModel {
  const form = createEmptyClientForm();
  const profile = details.additionalProfile;
  const demographics = parseKeyValueText(profile?.demographics ?? '');
  const referralDetails = parseKeyValueText(profile?.referralDetails ?? '');
  const living = parseKeyValueText(profile?.livingArrangement ?? '');
  const mealSchedule = parseKeyValueText(profile?.mealSchedule ?? '');

  Object.assign(form, {
    intakeDate: details.intakeDate ?? '',
    socDate: details.socDate,
    referralSource: details.referralSource ?? '',
    status: clientStatusLabel(details.status),
    location: details.location ?? '',
    pmi: details.pmiNumber,
    insurance: details.insuranceProvider ?? '',
    services: details.services.filter((service) => service.isActive).map((service) => serviceLabel(service.code, service.name)),
    email: details.email ?? '',
    firstName: details.firstName,
    middleName: details.middleName ?? '',
    lastName: details.lastName,
    goesBy: details.preferredName ?? '',
    dob: details.dateOfBirth,
    gender: clientGenderLabel(details.gender),
    dischargeDate: details.dischargeDate ?? '',
    dischargeReason: details.dischargeReason ?? '',
    phone1: details.primaryPhone ?? '',
    phone2: details.secondaryPhone ?? '',
    languages: details.languages.map((language) => language.languageName),
    street: details.addressLine1 ?? '',
    apartment: details.addressLine2 ?? '',
    zip: details.postalCode ?? '',
    city: details.city ?? '',
    county: details.county ?? '',
    state: details.state ?? '',
    country: details.country ?? '',
    safetyMeasure: details.safetyMeasures ?? '',
    specialEquipment: details.specialEquipment ?? '',
    allergies: details.allergies ?? '',
    otherServices: details.otherServices ?? '',
    evvHours: details.evvAuthorizedHoursPerWeek?.toString() ?? '',
    onboarding: details.isOnboarding,
    programType: profile ? clientProgramLabel(profile.programType) : '',
    notes: profile?.notes ?? '',
    referringClient: referralDetails['referringClient'] === 'Yes',
    referringClientName: referralDetails['referringClientName'] ?? '',
    companyName: referralDetails['companyName'] ?? '',
    companyPhone: referralDetails['companyPhone'] ?? '',
    homeCareRatingStatus: profile?.homeCareRating ?? '',
    medicalEquipment: profile?.medicalEquipment ?? '',
    pcaComplexity: profile?.pcaComplexity ?? '',
    maritalStatus: demographics['maritalStatus'] ?? '',
    ethnicity: demographics['ethnicity'] ?? '',
    race: demographics['race'] ?? '',
    veteranDetails: demographics['veteranDetails'] ?? '',
    petsDetails: demographics['petsDetails'] ?? '',
    smoking: booleanChoice(profile?.smokes),
    veteran: booleanChoice(profile?.isVeteran),
    pets: booleanChoice(profile?.hasPets),
    livingArrangement: living['type'] ?? profile?.livingArrangement ?? '',
    livingArrangementDetails: living['details'] ?? '',
    clinicName: profile?.preferredClinic ?? '',
    hospitalName: profile?.preferredHospital ?? '',
    ambulanceName: profile?.preferredAmbulance ?? '',
    nutritionalRequirements: profile?.nutritionalRequirements ?? '',
    caregiverPreference: profile?.caregiverPreference ?? '',
    diet: splitList(profile?.diet ?? ''),
    breakfastTime: mealSchedule['breakfast'] ?? '',
    lunchTime: mealSchedule['lunch'] ?? '',
    dinnerTime: mealSchedule['dinner'] ?? '',
    additionalInformation: profile?.additionalInformation ?? '',
  });

  return form;
}

export function clientFormToCreateRequest(form: ClientFormModel): CreateClientRequest {
  return {
    identity: {
      firstName: form.firstName.trim(),
      middleName: nullableTrimmed(form.middleName),
      lastName: form.lastName.trim(),
      preferredName: nullableTrimmed(form.goesBy),
      dateOfBirth: form.dob,
      gender: clientGenderWireValue(form.gender),
      pmiNumber: form.pmi.trim(),
      ssn: nullableTrimmed(form.ssn),
    },
    contact: {
      insuranceProvider: nullableTrimmed(form.insurance),
      email: nullableTrimmed(form.email),
      primaryPhone: nullableTrimmed(form.phone1),
      secondaryPhone: nullableTrimmed(form.phone2),
      addressLine1: nullableTrimmed(form.street),
      addressLine2: nullableTrimmed(form.apartment),
      city: nullableTrimmed(form.city),
      state: nullableTrimmed(form.state),
      postalCode: nullableTrimmed(form.zip),
      county: nullableTrimmed(form.county),
      country: nullableTrimmed(form.country),
    },
    careSetup: {
      intakeDate: nullableTrimmed(form.intakeDate),
      socDate: form.socDate,
      referralSource: nullableTrimmed(form.referralSource),
      location: nullableTrimmed(form.location),
      isOnboarding: form.onboarding,
      evvAuthorizedHoursPerWeek: parseNullableNumber(form.evvHours),
    },
    safety: {
      safetyMeasures: nullableTrimmed(form.safetyMeasure),
      specialEquipment: nullableTrimmed(form.specialEquipment),
      allergies: nullableTrimmed(form.allergies),
      otherServices: nullableTrimmed(form.otherServices),
    },
    additionalProfile: {
      ...additionalProfile(form),
      programType: clientProgramWireValue(form.programType),
    },
    initialStatus: clientStatusWireValue(form.status),
    dischargeDate: form.status === 'Discharged' ? nullableTrimmed(form.dischargeDate) : null,
    dischargeReason: form.status === 'Discharged' ? nullableTrimmed(form.dischargeReason) : null,
    services: serviceInputs(form).map(({ code, name }) => ({ code, name })),
    languages: languageInputs(form),
  };
}

function clientStatusWireValue(value: string): string {
  return ClientStatusCode[clientStatusCode(value)];
}

function clientGenderWireValue(value: string): string {
  return ClientGenderCode[clientGenderCode(value)];
}

function clientProgramWireValue(value: string): string {
  return ClientProgramTypeCode[clientProgramCode(value)];
}

export function clientFormToUpdateRequest(form: ClientFormModel, editorVersion: string): UpdateClientRequest {
  const core = baseWriteRequest(form);
  const serviceChangeEffectiveDate = nullableTrimmed(form.serviceChangeEffectiveDate);
  const serviceStartDate = serviceChangeEffectiveDate ?? form.socDate;
  return {
    ...core,
    services: core.services.map((service) => ({ ...service, startDate: serviceStartDate })),
    editorVersion,
    serviceChangeEffectiveDate,
  };
}

function baseWriteRequest(form: ClientFormModel): Omit<LegacyClientWriteRequest, 'status' | 'dischargeDate' | 'dischargeReason'> {
  return {
    firstName: form.firstName.trim(),
    middleName: nullableTrimmed(form.middleName),
    lastName: form.lastName.trim(),
    preferredName: nullableTrimmed(form.goesBy),
    dateOfBirth: form.dob,
    gender: clientGenderCode(form.gender),
    pmiNumber: form.pmi.trim(),
    insuranceProvider: nullableTrimmed(form.insurance),
    email: nullableTrimmed(form.email),
    primaryPhone: nullableTrimmed(form.phone1),
    secondaryPhone: nullableTrimmed(form.phone2),
    intakeDate: nullableTrimmed(form.intakeDate),
    socDate: form.socDate,
    referralSource: nullableTrimmed(form.referralSource),
    location: nullableTrimmed(form.location),
    isOnboarding: form.onboarding,
    addressLine1: nullableTrimmed(form.street),
    addressLine2: nullableTrimmed(form.apartment),
    city: nullableTrimmed(form.city),
    state: nullableTrimmed(form.state),
    postalCode: nullableTrimmed(form.zip),
    county: nullableTrimmed(form.county),
    country: nullableTrimmed(form.country),
    evvAuthorizedHoursPerWeek: parseNullableNumber(form.evvHours),
    safetyMeasures: nullableTrimmed(form.safetyMeasure),
    specialEquipment: nullableTrimmed(form.specialEquipment),
    allergies: nullableTrimmed(form.allergies),
    otherServices: nullableTrimmed(form.otherServices),
    additionalProfile: additionalProfile(form),
    services: serviceInputs(form),
    languages: languageInputs(form),
  };
}

function additionalProfile(form: ClientFormModel): ClientAdditionalProfileRequest {
  return {
    programType: clientProgramCode(form.programType),
    referralDetails: nullableTrimmed(toKeyValueText({
      referringClient: form.referringClient ? 'Yes' : 'No',
      referringClientName: form.referringClientName,
      companyName: form.companyName,
      companyPhone: form.companyPhone,
    })),
    homeCareRating: nullableTrimmed(form.homeCareRatingStatus),
    medicalEquipment: nullableTrimmed(form.medicalEquipment),
    pcaComplexity: nullableTrimmed(form.pcaComplexity),
    demographics: nullableTrimmed(toKeyValueText({
      maritalStatus: form.maritalStatus,
      ethnicity: form.ethnicity,
      race: form.race,
      veteranDetails: form.veteranDetails,
      petsDetails: form.petsDetails,
    })),
    smokes: nullableBoolean(form.smoking),
    isVeteran: nullableBoolean(form.veteran),
    hasPets: nullableBoolean(form.pets),
    livingArrangement: nullableTrimmed(toKeyValueText({ type: form.livingArrangement, details: form.livingArrangementDetails })),
    preferredClinic: nullableTrimmed(form.clinicName),
    preferredHospital: nullableTrimmed(form.hospitalName),
    preferredAmbulance: nullableTrimmed(form.ambulanceName),
    caregiverPreference: nullableTrimmed(form.caregiverPreference),
    nutritionalRequirements: nullableTrimmed(form.nutritionalRequirements),
    diet: nullableTrimmed(form.diet.join(', ')),
    mealSchedule: nullableTrimmed(toKeyValueText({ breakfast: form.breakfastTime, lunch: form.lunchTime, dinner: form.dinnerTime })),
    notes: nullableTrimmed(form.notes),
    additionalInformation: nullableTrimmed(form.additionalInformation),
  };
}

function serviceInputs(form: ClientFormModel): readonly ClientServiceInput[] {
  const startDate = form.socDate;
  return form.services.map((service) => ({
    code: clientServiceCode(service),
    name: service,
    startDate,
  }));
}

function languageInputs(form: ClientFormModel): readonly ClientLanguageInput[] {
  return form.languages.map((language, index) => ({
    languageCode: languageCode(language),
    languageName: language,
    isPrimary: index === 0,
  }));
}

export function clientServiceCode(service: string): string {
  switch (service.trim().toLowerCase()) {
    case 'respite': return 'RESPITE';
    case '245d': return '245D';
    case 'cfss': return 'CFSS';
    case 'pca': return 'PCA';
    default: return service.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 50);
  }
}

function serviceLabel(code: string, name: string): string {
  switch (code.trim().toUpperCase()) {
    case 'PCA': return 'PCA';
    case 'CFSS': return 'CFSS';
    case '245D': return '245D';
    case 'RESPITE': return 'Respite';
    default: return name.trim() || code.trim();
  }
}

function languageCode(language: string): string {
  switch (language.trim().toLowerCase()) {
    case 'english': return 'en';
    case 'spanish': return 'es';
    case 'somali': return 'so';
    case 'hmong': return 'hmn';
    default: return language.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20);
  }
}

function parseNullableNumber(value: string | number): number | null {
  if (typeof value === 'string' && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toKeyValueText(values: Readonly<Record<string, string>>): string {
  return Object.entries(values)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}=${value.trim().replace(/\r?\n/g, ' ')}`)
    .join('\n');
}

function parseKeyValueText(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of value.split(/\r?\n/)) {
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    result[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return result;
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}
