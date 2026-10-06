import {
  EmployeeDto,
  EmployeeFormModel,
  SaveEmployeeRequest,
  emptyBackgroundInformation,
  emptyEmployee,
  emptyTrainingInformation,
} from './employee.models';

const nullableDates = [
  'hireDate',
  'startOfServiceDate',
  'inactiveDate',
  'dateOfBirth',
  'driverLicenseExpiresOn',
  'trainingCompletedOn',
  'trainingExpiresOn',
  'payerEffectiveFrom',
  'payerEffectiveTo',
  'tierEffectiveDate',
] as const;

export function employeeDtoToForm(value: EmployeeDto): EmployeeFormModel {
  const form = { ...emptyEmployee(), ...value };
  for (const key of nullableDates) form[key] = form[key] ?? '';
  form.availableStartTime = form.availableStartTime?.slice(0, 5) ?? '';
  form.availableEndTime = form.availableEndTime?.slice(0, 5) ?? '';
  form.previousAddresses = form.previousAddresses ?? [];
  form.contacts = value.contacts ?? [];
  const background = value.backgroundInformation ?? emptyBackgroundInformation();
  form.backgroundInformation = {
    ...background,
    checks: (background.checks ?? []).map((check) => ({
      ...check,
      checkDate: check.checkDate ?? '',
      receivedDate: check.receivedDate ?? '',
    })),
    mantouxGivenDate: background.mantouxGivenDate ?? '',
    mantouxCheckedDate: background.mantouxCheckedDate ?? '',
    medicalTestingDate: background.medicalTestingDate ?? '',
  };
  const training = value.trainingInformation ?? emptyTrainingInformation();
  form.trainingInformation = {
    courses: (training.courses ?? []).map((item) => ({
      ...item,
      completedOn: item.completedOn ?? '',
    })),
    trainings: (training.trainings ?? []).map((item) => ({
      ...item,
      completedOn: item.completedOn ?? '',
      expiresOn: item.expiresOn ?? '',
    })),
  };
  form.ssn = '';
  form.evvPassword = '';
  form.evvPasswordConfirm = '';
  form.ivrPin = '';
  return form;
}

export function employeeFormToRequest(value: EmployeeFormModel): SaveEmployeeRequest {
  const {
    allowAggregator: _allowAggregator,
    overrideRestriction: _overrideRestriction,
    evvOnly: _evvOnly,
    restrictDateAndTime: _restrictDateAndTime,
    evvEmail: _evvEmail,
    evvPassword: _evvPassword,
    evvPasswordConfirm: _evvPasswordConfirm,
    hasEvvPassword: _hasEvvPassword,
    ivrPin: _ivrPin,
    hasIvrPin: _hasIvrPin,
    evvIvrAuthorization: _evvIvrAuthorization,
    ...request
  } = value;
  const body: Record<string, unknown> = { ...request };
  for (const key of nullableDates) body[key] = value[key] || null;
  body['availableStartTime'] = value.availableStartTime || null;
  body['availableEndTime'] = value.availableEndTime || null;
  body['payerAffiliations'] = (value.payerAffiliations ?? []).map((item) => ({
    ...item,
    applicationFaxedDate: item.applicationFaxedDate || null,
    affiliationDate: item.affiliationDate || null,
    affiliationEndDate: item.affiliationEndDate || null,
  }));
  const background = value.backgroundInformation;
  body['backgroundInformation'] = background
    ? {
        ...background,
        mantouxGivenDate: background.mantouxGivenDate || null,
        mantouxCheckedDate: background.mantouxCheckedDate || null,
        medicalTestingDate: background.medicalTestingDate || null,
        checks: background.checks.map((item) => ({
          ...item,
          checkDate: item.checkDate || null,
          receivedDate: item.receivedDate || null,
        })),
      }
    : null;
  const training = value.trainingInformation;
  body['trainingInformation'] = training
    ? {
        courses: training.courses.map((item) => ({
          ...item,
          completedOn: item.completedOn || null,
        })),
        trainings: training.trainings.map((item) => ({
          ...item,
          completedOn: item.completedOn || null,
          expiresOn: item.expiresOn || null,
        })),
      }
    : null;
  return body as SaveEmployeeRequest;
}
