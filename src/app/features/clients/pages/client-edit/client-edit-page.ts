import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type EditSection = 'basic' | 'additional';

@Component({
  selector: 'app-client-edit-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './client-edit-page.html',
})
export class ClientEditPageComponent {
  readonly section = signal<EditSection>('basic');
  readonly saved = signal(false);
  readonly locations = ['Minneapolis', 'St. Paul', 'Brooklyn Park', 'Bloomington'];
  readonly services = ['PCA', 'CFSS', '245D', 'Respite'];
  readonly languages = ['English', 'Spanish', 'Somali', 'Hmong'];
  readonly model = {
    firstName: 'Marcus', middleName: 'James', lastName: 'Lee', goesBy: 'Marc', dob: '1986-02-14', gender: 'Male', pmi: '24591384', insurance: 'Medical Assistance',
    intakeDate: '2026-05-26', socDate: '2026-06-01', referralSource: 'County referral', status: 'Active', location: 'Minneapolis', service: '245D', email: 'marcus.lee@example.test',
    phone1: '(612) 555-0142', phone2: '', language: 'English', street: '1240 Portland Ave', apartment: 'Apt 3B', city: 'Minneapolis', county: 'Hennepin', state: 'MN', zip: '55404',
    safetyMeasure: 'Use side entrance during winter weather.', specialEquipment: 'Walker, shower chair', allergies: 'Penicillin', otherServices: '', evvHours: '32', supervisor: 'Dana Morris', onboarding: false,
    programType: '245D', homeCareRatingStatus: 'Standard', medicalEquipment: 'Walker', pcaComplexity: 'Moderate', maritalStatus: 'Single', ethnicity: '', race: '', smoking: 'No', veteran: 'No', pets: 'No', livingArrangement: 'Independent', caregiverPreference: 'No preference',
    clinicName: 'Hennepin Health Clinic', clinicPhone: '(612) 555-0118', hospitalName: 'Hennepin Healthcare', hospitalPhone: '(612) 555-0100', ambulanceName: '', ambulancePhone: '', nutritionalRequirements: '', notes: '', additionalInformation: '',
  };
  save(): void { this.saved.set(true); window.setTimeout(() => this.saved.set(false), 2500); }
}
