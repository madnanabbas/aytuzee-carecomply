import { CLIENT_EDIT_STEPS } from './client-edit-options';

describe('CLIENT_EDIT_STEPS', () => {
  it('adds Service agreements after Hospitalizations without the legacy Visits item', () => {
    expect(CLIENT_EDIT_STEPS.map((step) => step.title)).toEqual([
      'Basic details',
      'Additional information',
      'Primary contact information',
      'Primary caregivers',
      'Other contacts',
      'Care coordinators',
      'Consultation providers',
      'Doctors',
      'Responsible parties',
      'Hospitalizations',
      'Service agreements',
    ]);
    expect(CLIENT_EDIT_STEPS.at(-2)?.id).toBe('hospitalizations');
    expect(CLIENT_EDIT_STEPS.at(-1)?.id).toBe('service-agreements');
    expect(CLIENT_EDIT_STEPS.map((step) => step.id)).not.toContain('visits');
  });
});
