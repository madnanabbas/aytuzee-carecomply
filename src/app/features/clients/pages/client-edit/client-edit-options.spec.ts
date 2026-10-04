import { CLIENT_EDIT_STEPS } from './client-edit-options';

describe('CLIENT_EDIT_STEPS', () => {
  it('uses the finalized ten-step Client workflow without the legacy Visits item', () => {
    expect(CLIENT_EDIT_STEPS.map((step) => step.title)).toEqual([
      'Basic details',
      'Additional information',
      'Contact information',
      'Primary caregivers',
      'Contacts',
      'Care coordinators',
      'Consultation providers',
      'Doctors',
      'Responsible parties',
      'Hospitalizations',
    ]);
    expect(CLIENT_EDIT_STEPS.map((step) => step.id)).not.toContain('visits');
  });
});
