import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientDetails } from '../../models/client-api.models';
import { clientGenderLabel, clientProgramLabel, clientStatusLabel, formatDateForDisplay } from '../../models/client-presentation';

type ClientViewTab =
  | 'overview'
  | 'quick-notes'
  | 'todos'
  | 'service-agreements'
  | 'pcg'
  | 'responsible-party'
  | 'hospitalization'
  | 'visits'
  | 'forms'
  | 'documents'
  | 'email-logs'
  | 'employee-services';

type ClientDialog =
  | 'note'
  | 'todo'
  | 'service-agreement'
  | 'hospitalization'
  | 'document'
  | 'employee-service'
  | 'responsible-party'
  | 'visit'
  | 'form'
  | null;

interface DialogDefinition {
  title: string;
  description: string;
  submitLabel: string;
}

interface ClientViewModel {
  readonly id: string;
  readonly firstName: string;
  readonly middleName: string;
  readonly lastName: string;
  readonly goesBy: string;
  readonly status: string;
  readonly onboarding: boolean;
  readonly pmi: string;
  readonly dob: string;
  readonly age: number | null;
  readonly gender: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly county: string;
  readonly intakeDate: string;
  readonly socDate: string;
  readonly referralSource: string;
  readonly program: string;
  readonly services: readonly string[];
  readonly location: string;
  readonly supervisor: string;
  readonly evvHours: string;
  readonly preferredLanguage: string;
  readonly safetyMeasure: string;
  readonly specialEquipment: string;
  readonly allergies: string;
  readonly insurance: string;
  readonly eligibility: string;
  readonly eligibilityChecked: string;
}

@Component({
  selector: 'app-client-view-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './client-view-page.html',
})
export class ClientViewPageComponent {
  private readonly authorization = inject(AuthorizationService);

  readonly canEditClient = computed(() => this.authorization.hasPermission(Permissions.Client.Edit));
  readonly canUploadDocuments = computed(() => this.authorization.hasPermission(Permissions.ClientDocument.Upload));
  readonly activeTab = signal<ClientViewTab>('overview');
  readonly activeDialog = signal<ClientDialog>(null);

  private readonly api = inject(ClientApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly clientDetails = signal<ClientDetails | null>(null);

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly createdMessage = signal(history.state?.['clientCreated'] === true);

  get client(): ClientViewModel {
    const details = this.clientDetails();
    return details ? toClientViewModel(details) : EMPTY_CLIENT_VIEW;
  }

  constructor() {
    const clientId = this.route.snapshot.paramMap.get('clientId') ?? '';
    if (!clientId) {
      this.loading.set(false);
      this.loadFailed.set(true);
      return;
    }
    this.loadClient(clientId);
  }

  retry(): void {
    const clientId = this.route.snapshot.paramMap.get('clientId') ?? '';
    if (clientId) this.loadClient(clientId);
  }

  private loadClient(clientId: string): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api.getClient(clientId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (client) => this.clientDetails.set(client),
        error: () => this.loadFailed.set(true),
      });
  }

  readonly tabs: readonly { id: ClientViewTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'quick-notes', label: 'Quick Notes' },
    { id: 'todos', label: 'Todos' },
    { id: 'service-agreements', label: 'Service Agreements' },
    { id: 'pcg', label: 'PCG' },
    { id: 'responsible-party', label: 'Responsible Party' },
    { id: 'hospitalization', label: 'Hospitalization' },
    { id: 'visits', label: 'Visits' },
    { id: 'forms', label: 'Forms' },
    { id: 'documents', label: 'Documents' },
    { id: 'email-logs', label: 'Email Logs' },
    { id: 'employee-services', label: 'Employee Services' },
  ];

  readonly quickNotes = [
    { subject: 'Annual review follow-up', type: 'Case Manager', tagged: 'Dana Morris', createdBy: 'System Administrator', created: '08/30/2026', attachment: '—' },
    { subject: 'Transportation preference updated', type: 'Client Update', tagged: 'Jane Doe', createdBy: 'Dana Morris', created: '08/24/2026', attachment: 'note.pdf' },
  ] as const;

  readonly todos = [
    { task: 'Collect updated annual assessment', assignedTo: 'Dana Morris', due: '09/20/2026', priority: 'High', status: 'Open' },
    { task: 'Confirm service authorization renewal', assignedTo: 'System Administrator', due: '10/02/2026', priority: 'Normal', status: 'In progress' },
  ] as const;

  readonly serviceAgreements = [
    { service: 'Individualized Home Supports', start: '06/01/2026', end: '05/31/2027', hours: '32 / week', status: 'Active', document: 'service-agreement-2026.pdf' },
    { service: 'Respite', start: '07/15/2026', end: '12/31/2026', hours: '8 / month', status: 'Active', document: 'respite-addendum.pdf' },
  ] as const;

  readonly hospitalizations = [
    { hospital: 'Hennepin Healthcare', start: '07/12/2026', inTime: '09:30 AM', end: '07/14/2026', outTime: '02:10 PM', reason: 'Observation' },
  ] as const;

  readonly documents = [
    { name: 'Service Agreement', type: 'Agreement', file: 'service-agreement-2026.pdf', size: '1.4 MB', status: 'Current', expiry: '05/31/2027', createdBy: 'System Administrator', created: '08/28/2026', updated: '08/28/2026' },
    { name: 'Emergency Plan', type: 'Plan', file: 'emergency-plan.pdf', size: '860 KB', status: 'Expiring soon', expiry: '09/15/2026', createdBy: 'Dana Morris', created: '06/15/2026', updated: '06/15/2026' },
    { name: 'Authorization', type: 'Authorization', file: 'authorization.pdf', size: '640 KB', status: 'Current', expiry: '02/06/2027', createdBy: 'System Administrator', created: '06/01/2026', updated: '06/01/2026' },
  ] as const;

  readonly employeeServices = [
    { employee: 'Jane Doe', title: 'PCA', service: 'Individualized Home Supports', start: '06/01/2026', lastWorked: '08/31/2026', status: 'Active' },
    { employee: 'Michael Brown', title: 'Supervisor', service: 'Case Oversight', start: '06/01/2026', lastWorked: '08/29/2026', status: 'Active' },
  ] as const;

  readonly visits = [
    { date: '08/31/2026', employee: 'Jane Doe', service: 'Individualized Home Supports', start: '08:00 AM', end: '12:00 PM', duration: '4h 00m', status: 'Completed' },
    { date: '08/29/2026', employee: 'Jane Doe', service: 'Individualized Home Supports', start: '09:00 AM', end: '01:00 PM', duration: '4h 00m', status: 'Completed' },
  ] as const;

  readonly forms = [
    { form: 'Annual Assessment', category: 'Assessment', status: 'Pending', due: '09/20/2026', updated: '08/30/2026' },
    { form: 'Emergency Contact Verification', category: 'Client', status: 'Complete', due: '—', updated: '08/12/2026' },
  ] as const;

  readonly emailLogs = [
    { subject: 'Upcoming annual review', recipient: 'marcus.lee@example.test', type: 'Reminder', sentBy: 'System', sentAt: '08/30/2026 09:15 AM', status: 'Delivered' },
    { subject: 'Service agreement available', recipient: 'marcus.lee@example.test', type: 'Notification', sentBy: 'System Administrator', sentAt: '08/28/2026 02:42 PM', status: 'Delivered' },
  ] as const;

  readonly responsibleParties = [
    { name: 'Patricia Lee', relationship: 'Mother', phone: '(612) 555-0196', email: 'patricia.lee@example.test', livingWithClient: 'No', status: 'Active' },
  ] as const;

  readonly primaryCaregivers = [
    { name: 'Jane Doe', title: 'PCA', phone: '(612) 555-0133', email: 'jane.doe@example.test', preference: 'Preferred', status: 'Active' },
  ] as const;

  readonly dialogDefinitions: Record<Exclude<ClientDialog, null>, DialogDefinition> = {
    note: { title: 'Add quick note', description: 'Record an internal client note and optionally tag a staff member.', submitLabel: 'Add note' },
    todo: { title: 'Add todo', description: 'Create a client-related action item with an owner and due date.', submitLabel: 'Add todo' },
    'service-agreement': { title: 'Add service agreement', description: 'Record the approved service, effective dates and supporting agreement.', submitLabel: 'Add agreement' },
    hospitalization: { title: 'Add hospitalization', description: 'Record an admission and discharge period for the client.', submitLabel: 'Add hospitalization' },
    document: { title: 'Upload client document', description: 'Add document metadata and select a file for secure upload.', submitLabel: 'Upload document' },
    'employee-service': { title: 'Assign employee / caregiver', description: 'Link an employee to this client and define the service assignment.', submitLabel: 'Assign employee' },
    'responsible-party': { title: 'Add responsible party', description: 'Add an authorized responsible party or representative.', submitLabel: 'Add responsible party' },
    visit: { title: 'Add visit', description: 'Record a client service visit for design review.', submitLabel: 'Add visit' },
    form: { title: 'Add client form', description: 'Create or attach a client-related form record.', submitLabel: 'Add form' },
  };

  readonly draft = {
    subject: '', noteType: '', note: '', taggedEmployee: '', attachment: '',
    task: '', assignedTo: '', dueDate: '', priority: 'Normal',
    service: '', agreementStart: '', agreementEnd: '', authorizedHours: '', agreementFile: '',
    hospital: '', hospitalizedIn: '', inTime: '', hospitalizedOut: '', outTime: '', reason: '',
    documentName: '', documentType: '', documentFile: '', issueDate: '', expiryDate: '', reviewDate: '',
    employee: '', employeeTitle: '', employeeService: '', assignmentStart: '', assignmentEnd: '',
    rpName: '', rpRelationship: '', rpPhone: '', rpEmail: '', rpAddress: '',
    visitDate: '', visitEmployee: '', visitService: '', visitStart: '', visitEnd: '',
    formName: '', formCategory: '', formDueDate: '',
  };

  setTab(tab: ClientViewTab): void {
    this.activeTab.set(tab);
  }

  openDialog(dialog: Exclude<ClientDialog, null>): void {
    this.activeDialog.set(dialog);
  }

  closeDialog(): void {
    this.activeDialog.set(null);
  }

  submitDialog(): void {
    // Design-only milestone. API commands will be wired after backend contracts are approved.
    this.closeDialog();
  }

  dialogDefinition(): DialogDefinition | null {
    const dialog = this.activeDialog();
    return dialog ? this.dialogDefinitions[dialog] : null;
  }

  statusClass(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized.includes('current') || normalized.includes('active') || normalized.includes('complete') || normalized.includes('delivered')) {
      return 'bg-green-50 text-success ring-green-200';
    }
    if (normalized.includes('expiring') || normalized.includes('progress') || normalized.includes('pending')) {
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    }
    if (normalized.includes('missing') || normalized.includes('expired') || normalized.includes('overdue')) {
      return 'bg-red-50 text-danger ring-red-200';
    }
    return 'bg-surface-muted text-text-secondary ring-border';
  }
}


const EMPTY_CLIENT_VIEW: ClientViewModel = {
  id: '', firstName: '', middleName: '', lastName: '', goesBy: '', status: '—', onboarding: false, pmi: '—', dob: '—', age: null, gender: '—',
  phone: '—', email: '—', address: '—', county: '—', intakeDate: '—', socDate: '—', referralSource: '—', program: '—', services: [], location: '—',
  supervisor: 'Managed through Employee Services', evvHours: '—', preferredLanguage: '—', safetyMeasure: '—', specialEquipment: '—', allergies: '—', insurance: '—',
  eligibility: 'Not assessed', eligibilityChecked: '—',
};

function toClientViewModel(details: ClientDetails): ClientViewModel {
  const address = [details.addressLine1, details.addressLine2, details.city, details.state, details.postalCode]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)
    .join(', ') || '—';
  const preferredLanguage = details.languages.find((language) => language.isPrimary)?.languageName
    ?? details.languages[0]?.languageName
    ?? '—';
  const services = details.services.filter((service) => service.isActive).map((service) => service.name);
  const program = details.additionalProfile ? clientProgramLabel(details.additionalProfile.programType) : '—';
  return {
    id: details.id,
    firstName: details.firstName,
    middleName: details.middleName ?? '',
    lastName: details.lastName,
    goesBy: details.preferredName ?? '',
    status: clientStatusLabel(details.status),
    onboarding: details.isOnboarding,
    pmi: details.pmiNumber,
    dob: formatDateForDisplay(details.dateOfBirth),
    age: calculateAge(details.dateOfBirth),
    gender: clientGenderLabel(details.gender),
    phone: details.primaryPhone ?? '—',
    email: details.email ?? '—',
    address,
    county: details.county ?? '—',
    intakeDate: formatDateForDisplay(details.intakeDate),
    socDate: formatDateForDisplay(details.socDate),
    referralSource: details.referralSource ?? '—',
    program,
    services: services.length ? services : ['—'],
    location: details.location ?? '—',
    supervisor: 'Managed through Employee Services',
    evvHours: details.evvAuthorizedHoursPerWeek === null ? '—' : `${details.evvAuthorizedHoursPerWeek} hrs / week`,
    preferredLanguage,
    safetyMeasure: details.safetyMeasures ?? '—',
    specialEquipment: details.specialEquipment ?? '—',
    allergies: details.allergies ?? '—',
    insurance: details.insuranceProvider ?? '—',
    eligibility: 'Not assessed',
    eligibilityChecked: '—',
  };
}

function calculateAge(dateOfBirth: string): number | null {
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const month = today.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age -= 1;
  return Math.max(0, age);
}
