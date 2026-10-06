import { CLIENT_CREATE_STEPS } from './client-create-options';

describe('CLIENT_CREATE_STEPS', () => {
  it('defines the exact ten-step workflow with Hospitalizations last and no Visits or Review', () => {
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
    ]);
    expect(CLIENT_CREATE_STEPS).toHaveLength(10);
    expect(CLIENT_CREATE_STEPS.at(-1)).toEqual({
      id: 'hospitalizations',
      title: 'Hospitalizations',
    });
    expect(CLIENT_CREATE_STEPS.map((step) => step.title)).not.toContain('Visits');
    expect(CLIENT_CREATE_STEPS.some((step) => step.id === 'review')).toBe(false);
  });
});
