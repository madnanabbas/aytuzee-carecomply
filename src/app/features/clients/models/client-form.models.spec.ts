import {
  clientFormToAdditionalInformationRequest,
  clientFormToCreateRequest,
  clientFormToUpdateRequest,
  createEmptyClientForm,
} from './client-form.models';

describe('clientFormToCreateRequest', () => {
  it('maps the Angular form to the nested API create contract', () => {
    const form = createEmptyClientForm();
    Object.assign(form, {
      firstName: ' Marcus ',
      lastName: ' Lee ',
      dob: '1986-02-14',
      gender: 'Male',
      pmi: ' 24591384 ',
      socDate: '2026-09-02',
      status: 'Active',
      programType: '245D',
      services: ['245D'],
      languages: ['English'],
      evvHours: 35,
      country: 'United States',
      notes: 'Care-team note',
      additionalInformation: 'Call before arrival',
    });

    const request = clientFormToCreateRequest(form);

    expect(request.identity).toMatchObject({
      firstName: 'Marcus',
      lastName: 'Lee',
      gender: 'Male',
      pmiNumber: '24591384',
    });
    expect(request.careSetup.socDate).toBe('2026-09-02');
    expect(request.careSetup.evvAuthorizedHoursPerWeek).toBe(35);
    expect(request.initialStatus).toBe('Active');
    expect(request.additionalProfile.programType).toBe('Two45D');
    expect(request.contact.country).toBe('United States');
    expect(request.additionalProfile.notes).toBe('Care-team note');
    expect(request.additionalProfile.additionalInformation).toBe('Call before arrival');
    expect(request.services).toEqual([{ code: '245D', name: '245D' }]);
    expect(request.languages).toEqual([
      { languageCode: 'en', languageName: 'English', isPrimary: true },
    ]);
    expect(request).not.toHaveProperty('firstName');
    expect(request).not.toHaveProperty('status');
  });

  it('maps edits to the nested API update contract with string enums', () => {
    const form = createEmptyClientForm();
    Object.assign(form, {
      firstName: 'Marcus',
      lastName: 'Lee',
      dob: '1986-02-14',
      gender: 'Male',
      pmi: '24591384',
      socDate: '2026-09-02',
      phone1: '(612) 555-0100',
      street: '100 Main Street',
      programType: 'PCA Traditional',
      languages: ['English'],
    });

    const request = clientFormToUpdateRequest(form, 'a'.repeat(64));

    expect(request.identity.firstName).toBe('Marcus');
    expect(request.identity.gender).toBe('Male');
    expect(request.additionalProfile.programType).toBe('PcaTraditional');
    expect(request).not.toHaveProperty('firstName');
    expect(request).not.toHaveProperty('status');
  });

  it('maps the step-two program type to the API enum name', () => {
    const form = createEmptyClientForm();
    form.programType = '245D';

    const request = clientFormToAdditionalInformationRequest(form, 'a'.repeat(64));

    expect(request.additionalProfile.programType).toBe('Two45D');
  });

  it('persists the supervisor employee identifier in create and edit care setup', () => {
    const form = createEmptyClientForm();
    form.supervisor = '7acb8288-5501-4896-bfe2-c4145e2156fa';
    form.locationId = '68bbb854-8746-4cb0-a3cd-a97955175080';
    form.location = 'Bloomington';
    expect(clientFormToCreateRequest(form).careSetup.locationId).toBe(form.locationId);
    expect(clientFormToUpdateRequest(form, 'version').careSetup.locationId).toBe(form.locationId);
    expect(clientFormToCreateRequest(form).careSetup.supervisorUserId).toBe(form.supervisor);
    expect(clientFormToUpdateRequest(form, 'version').careSetup.supervisorUserId).toBe(
      form.supervisor,
    );
    form.supervisor = '';
    expect(clientFormToUpdateRequest(form, 'version').careSetup.supervisorUserId).toBeNull();
  });
});
