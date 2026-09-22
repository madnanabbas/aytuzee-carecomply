export type ClientStatus = 'Active' | 'Inactive' | 'Discharged' | 'Pending';

export interface ClientListItem {
  id: string;
  firstName: string;
  lastName: string;
  goesBy?: string;
  pmi: string;
  dateOfBirth: string;
  phone: string;
  email?: string;
  program: string;
  services: readonly string[];
  location: string;
  socDate: string;
  supervisor: string;
  status: ClientStatus;
  onboarding: boolean;
  attentionCount: number;
}

export interface ClientListFilter {
  search: string;
  status: 'all' | ClientStatus;
  program: 'all' | string;
  location: 'all' | string;
  onboarding: 'all' | 'yes' | 'no';
}

export interface ClientCreateStep {
  id: 'basic' | 'additional' | 'contact' | 'review'
    | 'caregivers' | 'client-contacts' | 'care-coordinators'
    | 'consultation-providers' | 'doctors' | 'responsible-parties'
    | 'hospitalizations' | 'visits';
  title: string;
}
