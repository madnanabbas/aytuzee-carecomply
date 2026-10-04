import { CLIENT_WIZARD_STEP_TITLES } from '../../models/client-wizard-steps';

export type ClientEditSection =
  | 'basic'
  | 'additional'
  | 'contact'
  | 'caregivers'
  | 'client-contacts'
  | 'care-coordinators'
  | 'consultation-providers'
  | 'doctors'
  | 'responsible-parties'
  | 'hospitalizations';

export const CLIENT_EDIT_STEPS: readonly {
  readonly id: ClientEditSection;
  readonly title: string;
}[] = [
  { id: 'basic', title: CLIENT_WIZARD_STEP_TITLES[0] },
  { id: 'additional', title: CLIENT_WIZARD_STEP_TITLES[1] },
  { id: 'contact', title: CLIENT_WIZARD_STEP_TITLES[2] },
  { id: 'caregivers', title: CLIENT_WIZARD_STEP_TITLES[3] },
  { id: 'client-contacts', title: CLIENT_WIZARD_STEP_TITLES[4] },
  { id: 'care-coordinators', title: CLIENT_WIZARD_STEP_TITLES[5] },
  { id: 'consultation-providers', title: CLIENT_WIZARD_STEP_TITLES[6] },
  { id: 'doctors', title: CLIENT_WIZARD_STEP_TITLES[7] },
  { id: 'responsible-parties', title: CLIENT_WIZARD_STEP_TITLES[8] },
  { id: 'hospitalizations', title: CLIENT_WIZARD_STEP_TITLES[9] },
];

export const CLIENT_EDIT_LOCATIONS = [
  'Minneapolis',
  'St. Paul',
  'Brooklyn Park',
  'Bloomington',
] as const;
