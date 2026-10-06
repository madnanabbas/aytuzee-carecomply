import {
  isValidContactEmail,
  isValidContactPhone,
} from '../../../shared/formatting/contact-input-formatting';
import { EmployeeFormModel } from './employee.models';

export type EmployeeFieldErrors = Readonly<Record<string, string>>;

export function validateEmployeeStep(
  model: EmployeeFormModel,
  step: number,
  isPersisted: boolean,
): EmployeeFieldErrors {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (!model.hireDate) errors['hireDate'] = 'Hire date is required.';
    if (!model.locationIds.length) errors['locationIds'] = 'Select at least one location.';
    if (!model.firstName.trim()) errors['firstName'] = 'First name is required.';
    if (!model.lastName.trim()) errors['lastName'] = 'Last name is required.';
    if (!model.jobTitle.trim()) errors['jobTitle'] = 'Primary title is required.';
    if (!model.email.trim()) errors['email'] = 'Employee email is required.';
    else if (!isValidContactEmail(model.email)) errors['email'] = 'Enter a valid email address.';
    if (!model.dateOfBirth) errors['dateOfBirth'] = 'Date of birth is required.';
    if (!model.gender) errors['gender'] = 'Select a gender.';
    if (!isValidContactPhone(model.phone, true))
      errors['phone'] = 'Enter a valid 10-digit US phone number.';
    if (!isValidContactPhone(model.secondaryPhone))
      errors['secondaryPhone'] = 'Enter a valid 10-digit US phone number.';
    if (!model.streetAddress.trim()) errors['streetAddress'] = 'Street address is required.';
    if ((!isPersisted || model.ssn) && !/^\d{9}$/.test(model.ssn))
      errors['ssn'] = 'SSN must contain exactly 9 digits.';
    if (model.npi && model.npi.length !== 10) errors['npi'] = 'NPI must contain 10 digits.';
    if (!isValidContactPhone(model.emergencyContactPhone))
      errors['emergencyContactPhone'] = 'Enter a valid 10-digit US phone number.';
  }
  if (step === 1) {
    if (model.hasUsedDifferentName && !model.previousName.trim())
      errors['previousName'] = 'Enter the name previously used.';
    if (model.heightInches !== null && (model.heightInches <= 0 || model.heightInches > 120))
      errors['heightInches'] = 'Enter a height from 1 to 120 inches.';
    if (model.weightPounds !== null && (model.weightPounds <= 0 || model.weightPounds > 1500))
      errors['weightPounds'] = 'Enter a weight from 1 to 1,500 pounds.';
    if (model.hasWorkingHourRestrictions && (!model.availableStartTime || !model.availableEndTime))
      errors['availableStartTime'] = 'Enter both an available start and end time.';
    else if (
      model.availableStartTime &&
      model.availableEndTime &&
      model.availableStartTime >= model.availableEndTime
    )
      errors['availableEndTime'] = 'End time must be after start time.';
    if (!model.canWorkWithSmokers && !model.smokerRestrictionExplanation.trim())
      errors['smokerRestrictionExplanation'] = 'Explain the smoking restriction.';
    if (model.isMilitaryVeteran && !model.militaryServiceExplanation.trim())
      errors['militaryServiceExplanation'] = 'Provide military service details.';
    if (!model.canWorkWithPets && !model.petRestrictionExplanation.trim())
      errors['petRestrictionExplanation'] = 'Explain the pet restriction.';
    if (model.hasOtherJob && !model.otherEmployerName.trim())
      errors['otherEmployerName'] = 'Enter the other employer name.';
  }
  if (step === 4 && !isValidContactPhone(model.payerPhone))
    errors['payerPhone'] = 'Enter a valid 10-digit US phone number.';
  return errors;
}
