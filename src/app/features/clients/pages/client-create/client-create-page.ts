import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientCreateStep } from '../../models/client-design.models';

interface ClientDraft {
  intakeDate: string;
  socDate: string;
  referralSource: string;
  status: string;
  location: string;
  pmi: string;
  insurance: string;
  services: string[];
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  goesBy: string;
  dob: string;
  gender: string;
  dischargeDate: string;
  dischargeReason: string;
  phone1: string;
  phone2: string;
  ssn: string;
  languages: string[];
  street: string;
  apartment: string;
  zip: string;
  city: string;
  county: string;
  state: string;
  safetyMeasure: string;
  specialEquipment: string;
  allergies: string;
  otherServices: string;
  evvHours: string;
  supervisor: string;
  onboarding: boolean;

  programType: string;
  notes: string;
  referringClient: boolean;
  referringClientName: string;
  companyName: string;
  companyPhone: string;
  homeCareRatingStatus: string;
  medicalEquipment: string;
  pcaComplexity: string;
  maritalStatus: string;
  ethnicity: string;
  race: string;
  smoking: string;
  veteran: string;
  veteranDetails: string;
  pets: string;
  petsDetails: string;
  livingArrangement: string;
  livingArrangementDetails: string;
  clinicName: string;
  clinicPhone: string;
  clinicFax: string;
  clinicAddress: string;
  hospitalName: string;
  hospitalPhone: string;
  hospitalFax: string;
  hospitalAddress: string;
  ambulanceName: string;
  ambulancePhone: string;
  ambulanceFax: string;
  ambulanceAddress: string;
  nutritionalRequirements: string;
  caregiverPreference: string;
  diet: string[];
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  additionalInformation: string;
}

@Component({
  selector: 'app-client-create-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './client-create-page.html',
})
export class ClientCreatePageComponent {
  readonly steps: readonly ClientCreateStep[] = [
    { id: 'basic', title: 'Basic information' },
    { id: 'additional', title: 'Additional information' },
    { id: 'review', title: 'Review' },
  ];

  readonly stepIndex = signal(0);
  readonly servicesOpen = signal(false);
  readonly languagesOpen = signal(false);

  readonly locationOptions = ['Minneapolis', 'St. Paul', 'Brooklyn Park', 'Bloomington'] as const;
  readonly serviceOptions = ['PCA', 'CFSS', '245D', 'Respite'] as const;
  readonly languageOptions = ['English', 'Spanish', 'Somali', 'Hmong'] as const;
  readonly dietOptions = ['Diabetic', 'Low Fat', 'Low Salt', 'High Fiber', 'Vegetarian', 'Regular', 'Uses Supplements'] as const;

  readonly activeStep = computed(() => this.steps[this.stepIndex()]);
  readonly isFirstStep = computed(() => this.stepIndex() === 0);
  readonly isLastStep = computed(() => this.stepIndex() === this.steps.length - 1);

  readonly draft: ClientDraft = {
    intakeDate: '', socDate: '', referralSource: '', status: 'Active', location: '', pmi: '', insurance: '', services: [],
    email: '', firstName: '', middleName: '', lastName: '', goesBy: '', dob: '', gender: '', dischargeDate: '', dischargeReason: '',
    phone1: '', phone2: '', ssn: '', languages: [], street: '', apartment: '', zip: '', city: '', county: '', state: 'MN',
    safetyMeasure: '', specialEquipment: '', allergies: '', otherServices: '', evvHours: '', supervisor: '', onboarding: true,
    programType: '', notes: '', referringClient: false, referringClientName: '', companyName: '', companyPhone: '', homeCareRatingStatus: '',
    medicalEquipment: '', pcaComplexity: '', maritalStatus: '', ethnicity: '', race: '', smoking: '', veteran: '', veteranDetails: '',
    pets: '', petsDetails: '', livingArrangement: '', livingArrangementDetails: '', clinicName: '', clinicPhone: '', clinicFax: '', clinicAddress: '',
    hospitalName: '', hospitalPhone: '', hospitalFax: '', hospitalAddress: '', ambulanceName: '', ambulancePhone: '', ambulanceFax: '', ambulanceAddress: '',
    nutritionalRequirements: '', caregiverPreference: '', diet: [], breakfastTime: '', lunchTime: '', dinnerTime: '', additionalInformation: '',
  };

  goToStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      this.stepIndex.set(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  next(): void {
    if (!this.isLastStep()) {
      this.goToStep(this.stepIndex() + 1);
    }
  }

  back(): void {
    if (!this.isFirstStep()) {
      this.goToStep(this.stepIndex() - 1);
    }
  }

  ageFromDob(): string {
    if (!this.draft.dob) return 'Calculated automatically';
    const dob = new Date(`${this.draft.dob}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return 'Calculated automatically';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const month = today.getMonth() - dob.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age -= 1;
    return `${age} years`;
  }

  onToggleArray(field: 'services' | 'languages' | 'diet', value: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const current = this.draft[field];
    this.draft[field] = event.target.checked
      ? [...current, value]
      : current.filter((item) => item !== value);
  }

  toggleServicesDropdown(): void {
    this.servicesOpen.update((open) => !open);
    this.languagesOpen.set(false);
  }

  toggleLanguagesDropdown(): void {
    this.languagesOpen.update((open) => !open);
    this.servicesOpen.set(false);
  }

  selectedLabel(values: string[], placeholder: string): string {
    if (!values.length) return placeholder;
    if (values.length <= 2) return values.join(', ');
    return `${values.slice(0, 2).join(', ')} +${values.length - 2}`;
  }

  createClient(): void {
    // Design-only milestone. Backend command will be connected after UX approval.
    this.stepIndex.set(this.steps.length - 1);
  }
}
