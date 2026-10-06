import { employeeDtoToForm, employeeFormToRequest } from './employee-form.mapper';
import { EmployeeDto, emptyEmployee } from './employee.models';

describe('employee form mapper', () => {
  it('maps an API DTO into an editable form and clears sensitive values', () => {
    const dto: EmployeeDto = {
      ...emptyEmployee(),
      id: 'employee-1',
      hireDate: null as unknown as string,
      availableStartTime: '08:30:00',
      ssn: 'server-secret',
      evvPassword: 'server-secret',
      ivrPin: '1234',
      contacts: [{ name: 'Sam', phone: '(612) 555-0100', relationship: 'Sibling' }],
    };

    const form = employeeDtoToForm(dto);

    expect(form.hireDate).toBe('');
    expect(form.availableStartTime).toBe('08:30');
    expect(form.contacts).toEqual(dto.contacts);
    expect(form.ssn).toBe('');
    expect(form.evvPassword).toBe('');
    expect(form.ivrPin).toBe('');
  });

  it('maps form dates and nested dates to the transport contract', () => {
    const form = emptyEmployee();
    form.evvPasswordConfirm = 'never-send';
    form.payerAffiliations = [
      {
        company: 'Acme',
        payer: 'Plan',
        payerId: 'P1',
        applicationFaxedDate: '',
        affiliationDate: '',
        affiliationEndDate: '',
      },
    ];
    form.backgroundInformation = {
      checks: [
        {
          checkDate: '',
          receivedDate: '',
          licenseType: 'State identification',
          studyType: 'Criminal background study',
          received: false,
        },
      ],
      mantouxGivenDate: '',
      mantouxCheckedDate: '',
      mantouxReceived: false,
      medicalTestingDate: '',
      medicalTestingReceived: false,
    };

    const request = employeeFormToRequest(form);

    expect(request['hireDate']).toBeNull();
    expect(request['allowAggregator']).toBeUndefined();
    expect(request['overrideRestriction']).toBeUndefined();
    expect(request['evvOnly']).toBeUndefined();
    expect(request['restrictDateAndTime']).toBeUndefined();
    expect(request['evvEmail']).toBeUndefined();
    expect(request['evvPassword']).toBeUndefined();
    expect(request['evvPasswordConfirm']).toBeUndefined();
    expect(request['ivrPin']).toBeUndefined();
    expect(request['evvIvrAuthorization']).toBeUndefined();
    expect(request.ssn).toBe('');
    expect(request.payerAffiliations?.[0].affiliationDate).toBeNull();
    expect(request.backgroundInformation?.checks[0].checkDate).toBeNull();
  });
});
