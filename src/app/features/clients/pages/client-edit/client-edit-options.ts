import { AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES } from '../../models/client-wizard-steps';

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
  | 'hospitalizations'
  | 'service-agreements';

export const CLIENT_EDIT_STEPS: readonly {
  readonly id: ClientEditSection;
  readonly title: string;
}[] = [
  { id: 'basic', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[0] },
  { id: 'additional', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[1] },
  { id: 'contact', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[2] },
  { id: 'caregivers', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[3] },
  { id: 'client-contacts', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[4] },
  { id: 'care-coordinators', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[5] },
  { id: 'consultation-providers', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[6] },
  { id: 'doctors', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[7] },
  { id: 'responsible-parties', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[8] },
  { id: 'hospitalizations', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[9] },
  { id: 'service-agreements', title: AUTHENTICATED_CLIENT_WIZARD_STEP_TITLES[10] },
];
