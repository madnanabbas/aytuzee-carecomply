import { CLIENT_CREATE_STEPS } from './client-create-options';
import { CLIENT_WIZARD_STEP_TITLES } from '../../models/client-wizard-steps';

describe('CLIENT_CREATE_STEPS', () => {
  it('adds optional Service agreements as Step 11 after Hospitalizations', () => {
    expect(CLIENT_CREATE_STEPS.map((step) => step.title)).toEqual([
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
    expect(CLIENT_CREATE_STEPS).toHaveLength(11);
    expect(CLIENT_CREATE_STEPS.at(-1)).toEqual({
      id: 'service-agreements',
      title: 'Service agreements',
    });
    expect(CLIENT_CREATE_STEPS.at(-2)?.id).toBe('hospitalizations');
    expect(CLIENT_CREATE_STEPS.map((step) => step.title)).not.toContain('Visits');
    expect(CLIENT_CREATE_STEPS.some((step) => step.id === 'review')).toBe(false);
    expect(CLIENT_WIZARD_STEP_TITLES).toHaveLength(10);
    expect(CLIENT_WIZARD_STEP_TITLES).not.toContain('Service agreements');
  });
});
