export const CLIENT_WIZARD_STEP_TITLES = [
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
] as const;

export const AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES = [
  ...CLIENT_WIZARD_STEP_TITLES,
  'Service agreements',
] as const;
