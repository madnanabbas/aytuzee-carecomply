import { clientFormToCreateRequest, createEmptyClientForm } from './client-form.models';

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
    });

    const request = clientFormToCreateRequest(form);

    expect(request.identity).toMatchObject({
      firstName: 'Marcus',
      lastName: 'Lee',
      gender: 'Male',
      pmiNumber: '24591384',
    });
    expect(request.careSetup.socDate).toBe('2026-09-02');
    expect(request.initialStatus).toBe('Active');
    expect(request.additionalProfile.programType).toBe('Two45D');
    expect(request.services).toEqual([{ code: '245D', name: '245D' }]);
    expect(request.languages).toEqual([
      { languageCode: 'en', languageName: 'English', isPrimary: true },
    ]);
    expect(request).not.toHaveProperty('firstName');
    expect(request).not.toHaveProperty('status');
  });
});
