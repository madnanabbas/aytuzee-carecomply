import { emptyEmployee } from './employee.models';
import { validateEmployeeStep } from './employee-form.validators';

describe('employee form validation', () => {
  function validBasicForm() {
    return {
      ...emptyEmployee(),
      locationIds: ['location-1'],
      firstName: 'Taylor',
      lastName: 'Worker',
      email: 'taylor@example.test',
      jobTitle: 'Caregiver',
      hireDate: '2026-09-01',
      dateOfBirth: '1990-04-12',
      gender: 'Female',
      phone: '(612) 555-0100',
      streetAddress: '100 Main Street',
      ssn: '123456789',
    };
  }

  it.each(['12345678', '1234567890', 'ABC123456', '123-45-6789'])(
    'rejects a non-canonical Employee SSN: %s',
    (ssn) => {
      const errors = validateEmployeeStep({ ...validBasicForm(), ssn }, 0, false);

      expect(errors['ssn']).toBe('SSN must contain exactly 9 digits.');
    },
  );

  it('accepts nine digits and preserves blank SSN semantics for an existing employee', () => {
    expect(validateEmployeeStep(validBasicForm(), 0, false)['ssn']).toBeUndefined();
    expect(validateEmployeeStep({ ...validBasicForm(), ssn: '' }, 0, true)['ssn']).toBeUndefined();
  });

  it('uses the shared US phone rule for required and optional Employee phones', () => {
    const formatted = validateEmployeeStep(validBasicForm(), 0, false);
    expect(formatted['phone']).toBeUndefined();

    const invalid = validateEmployeeStep(
      {
        ...validBasicForm(),
        phone: '+1 (612) 555-0100',
        secondaryPhone: '61255',
      },
      0,
      false,
    );
    expect(invalid['phone']).toBe('Enter a valid 10-digit US phone number.');
    expect(invalid['secondaryPhone']).toBe('Enter a valid 10-digit US phone number.');
    expect(
      validateEmployeeStep({ ...validBasicForm(), secondaryPhone: '' }, 0, false)['secondaryPhone'],
    ).toBeUndefined();
  });

  it('has no EVV or IVR validation dependency', () => {
    const model = validBasicForm();
    model.evvEmail = 'not-an-email';
    model.evvPassword = 'different';
    model.evvPasswordConfirm = 'values';
    model.ivrPin = 'not-a-pin';

    const errors = validateEmployeeStep(model, 0, false);

    expect(errors['evvEmail']).toBeUndefined();
    expect(errors['evvPasswordConfirm']).toBeUndefined();
    expect(errors['ivrPin']).toBeUndefined();
  });
});
