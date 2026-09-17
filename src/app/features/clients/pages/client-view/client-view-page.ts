import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permission, Permissions } from '../../../../core/authorization/permissions';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientTodoApiService } from '../../data-access/client-todo-api.service';
import { ClientDetails } from '../../models/client-api.models';
import { ClientTodosComponent } from '../../components/client-todos/client-todos';
import { ClientCaregiversComponent } from '../../components/client-caregivers/client-caregivers';
import { ClientResponsiblePartiesComponent } from '../../components/client-responsible-parties/client-responsible-parties';
import { ClientContactsComponent } from '../../components/client-contacts/client-contacts';
import { ClientCareCoordinatorsComponent } from '../../components/client-care-coordinators/client-care-coordinators';
import { ClientClinicalContactsComponent } from '../../components/client-clinical-contacts/client-clinical-contacts';
import { ClientHospitalizationsComponent } from '../../components/client-hospitalizations/client-hospitalizations';
import { clientGenderLabel, clientProgramLabel, clientStatusLabel, formatDateForDisplay } from '../../models/client-presentation';

type ClientViewTab =
  | 'overview'
  | 'quick-notes'
  | 'todos'
  | 'service-agreements'
  | 'pcg'
  | 'contacts'
  | 'care-coordinators'
  | 'consultation-providers'
  | 'physicians'
  | 'responsible-party'
  | 'hospitalization'
  | 'visits'
  | 'forms'
  | 'documents'
  | 'email-logs'
  | 'employee-services';

interface ClientTabDefinition {
  readonly id: ClientViewTab;
  readonly label: string;
  readonly viewPermission: Permission;
}

type ClientDialog =
  | 'note'
  | 'service-agreement'
  | 'hospitalization'
  | 'document'
  | 'employee-service'
  | 'visit'
  | 'form'
  | null;

interface DialogDefinition {
  title: string;
  description: string;
  submitLabel: string;
}

interface RelatedRecordPreviewRow {
  readonly assignedTo: string; readonly attachment: string; readonly category: string;
  readonly created: string; readonly createdBy: string; readonly date: string;
  readonly document: string; readonly due: string; readonly duration: string;
  readonly email: string; readonly employee: string; readonly end: string;
  readonly expiry: string; readonly file: string; readonly form: string;
  readonly hospital: string; readonly hours: string; readonly inTime: string;
  readonly lastWorked: string; readonly livingWithClient: string; readonly name: string;
  readonly outTime: string; readonly phone: string; readonly preference: string;
  readonly priority: string; readonly reason: string; readonly recipient: string;
  readonly relationship: string; readonly sentAt: string; readonly sentBy: string;
  readonly service: string; readonly size: string; readonly start: string;
  readonly status: string; readonly subject: string; readonly tagged: string;
  readonly task: string; readonly title: string; readonly type: string;
  readonly updated: string;
}

interface ClientViewModel {
  readonly id: string;
  readonly fullName: string;
  readonly firstName: string;
  readonly middleName: string;
  readonly lastName: string;
  readonly goesBy: string;
  readonly status: string;
  readonly onboarding: boolean;
  readonly pmi: string;
  readonly dob: string;
  readonly age: string;
  readonly gender: string;
  readonly phone: string;
  readonly secondaryPhone: string;
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
  readonly otherServices: string;
  readonly insurance: string;
  readonly maritalStatus: string;
  readonly ethnicity: string;
  readonly race: string;
  readonly veteranDetails: string;
  readonly petDetails: string;
  readonly livingArrangement: string;
  readonly livingArrangementDetails: string;
  readonly caregiverPreference: string;
  readonly preferredClinic: string;
  readonly preferredHospital: string;
  readonly preferredAmbulance: string;
  readonly nutritionalRequirements: string;
  readonly diet: string;
  readonly breakfastTime: string;
  readonly lunchTime: string;
  readonly dinnerTime: string;
  readonly notes: string;
  readonly additionalInformation: string;
  readonly eligibility: string;
  readonly eligibilityChecked: string;
}

@Component({
  selector: 'app-client-view-page',
  standalone: true,
  imports: [FormsModule, RouterLink, ClientTodosComponent, ClientCaregiversComponent, ClientContactsComponent, ClientCareCoordinatorsComponent, ClientClinicalContactsComponent, ClientResponsiblePartiesComponent, ClientHospitalizationsComponent],
  templateUrl: './client-view-page.html',
})
export class ClientViewPageComponent {
  private readonly authorization = inject(AuthorizationService);

  readonly canEditClient = computed(() => this.authorization.hasPermission(Permissions.Client.Edit));
  readonly hasSsn = computed(() => this.clientDetails()?.hasSsn === true);
  readonly canRevealSsn = computed(() => this.hasSsn() && this.authorization.hasPermission(Permissions.Client.RevealSsn));
  readonly canUploadDocuments = computed(() => this.authorization.hasPermission(Permissions.ClientDocument.Upload));
  readonly activeTab = signal<ClientViewTab>('overview');
  readonly activeDialog = signal<ClientDialog>(null);

  private readonly api = inject(ClientApiService);
  private readonly todoApi = inject(ClientTodoApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly clientDetails = signal<ClientDetails | null>(null);

  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly createdMessage = signal(history.state?.['clientCreated'] === true);
  readonly ssn = signal('***-**-****');
  readonly ssnRevealing = signal(false);
  readonly ssnError = signal<string | null>(null);
  readonly openTodoCount = signal<number | null>(null);
  private ssnHideTimer: number | null = null;

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

  revealSsn(): void {
    if (!this.canRevealSsn() || this.ssnRevealing()) return;
    this.ssnRevealing.set(true);
    this.ssnError.set(null);
    this.api.revealClientSsn(this.client.id).pipe(
      finalize(() => this.ssnRevealing.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ ssn }) => {
        this.ssn.set(ssn);
        if (this.ssnHideTimer !== null) window.clearTimeout(this.ssnHideTimer);
        this.ssnHideTimer = window.setTimeout(() => this.hideSsn(), 30_000);
      },
      error: (error: { status?: number }) => {
        if (error.status === 404) {
          this.ssn.set('Not provided');
          this.ssnError.set(null);
          return;
        }
        this.ssnError.set('SSN could not be revealed.');
      },
    });
  }

  hideSsn(): void {
    this.ssn.set('***-**-****');
    if (this.ssnHideTimer !== null) window.clearTimeout(this.ssnHideTimer);
    this.ssnHideTimer = null;
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
        next: (client) => {
          this.clientDetails.set(client);
          this.loadOpenTodoCount(clientId);
        },
        error: () => this.loadFailed.set(true),
      });
  }

  readonly tabs: readonly ClientTabDefinition[] = [
    { id: 'overview', label: 'Overview', viewPermission: Permissions.Client.View },
    { id: 'quick-notes', label: 'Quick notes', viewPermission: Permissions.ClientQuickNote.View },
    { id: 'todos', label: 'To-dos', viewPermission: Permissions.ClientTodo.View },
    { id: 'service-agreements', label: 'Service agreements', viewPermission: Permissions.ClientServiceAgreement.View },
    { id: 'pcg', label: 'Primary caregivers', viewPermission: Permissions.ClientCaregiver.View },
    { id: 'contacts', label: 'Contacts', viewPermission: Permissions.ClientContact.View },
    { id: 'care-coordinators', label: 'Care coordinators', viewPermission: Permissions.ClientCareCoordinator.View },
    { id: 'consultation-providers', label: 'Consultation providers', viewPermission: Permissions.ClientConsultationProvider.View },
    { id: 'physicians', label: 'Doctors', viewPermission: Permissions.ClientPhysician.View },
    { id: 'responsible-party', label: 'Responsible parties', viewPermission: Permissions.ClientResponsibleParty.View },
    { id: 'hospitalization', label: 'Hospitalizations', viewPermission: Permissions.ClientHospitalization.View },
    { id: 'visits', label: 'Visits', viewPermission: Permissions.ClientVisit.View },
    { id: 'forms', label: 'Forms', viewPermission: Permissions.ClientForm.View },
    { id: 'documents', label: 'Documents', viewPermission: Permissions.ClientDocument.View },
    { id: 'email-logs', label: 'Email logs', viewPermission: Permissions.ClientEmailLog.View },
    { id: 'employee-services', label: 'Employee services', viewPermission: Permissions.ClientEmployeeService.View },
  ];
  readonly visibleTabs = computed(() => this.tabs.filter(tab => this.authorization.hasPermission(tab.viewPermission)));

  // Related-record APIs are not available yet. Keep these collections empty so
  // the client screen never represents demonstration data as persisted data.
  readonly quickNotes: readonly RelatedRecordPreviewRow[] = [];
  readonly serviceAgreements: readonly RelatedRecordPreviewRow[] = [];
  readonly hospitalizations: readonly RelatedRecordPreviewRow[] = [];
  readonly documents: readonly RelatedRecordPreviewRow[] = [];
  readonly employeeServices: readonly RelatedRecordPreviewRow[] = [];
  readonly visits: readonly RelatedRecordPreviewRow[] = [];
  readonly forms: readonly RelatedRecordPreviewRow[] = [];
  readonly emailLogs: readonly RelatedRecordPreviewRow[] = [];
  readonly primaryCaregivers: readonly RelatedRecordPreviewRow[] = [];

  readonly dialogDefinitions: Record<Exclude<ClientDialog, null>, DialogDefinition> = {
    note: { title: 'Add quick note', description: 'Record an internal client note and optionally tag a staff member.', submitLabel: 'Add note' },
    'service-agreement': { title: 'Add service agreement', description: 'Record the approved service, effective dates and supporting agreement.', submitLabel: 'Add agreement' },
    hospitalization: { title: 'Add hospitalization', description: 'Record an admission and discharge period for the client.', submitLabel: 'Add hospitalization' },
    document: { title: 'Upload client document', description: 'Add document metadata and select a file for secure upload.', submitLabel: 'Upload document' },
    'employee-service': { title: 'Assign employee / caregiver', description: 'Link an employee to this client and define the service assignment.', submitLabel: 'Assign employee' },
    visit: { title: 'Add visit', description: 'Record a client service visit for design review.', submitLabel: 'Add visit' },
    form: { title: 'Add client form', description: 'Create or attach a client-related form record.', submitLabel: 'Add form' },
  };

  readonly draft = {
    subject: '', noteType: '', note: '', taggedEmployee: '', attachment: '',
    service: '', agreementStart: '', agreementEnd: '', authorizedHours: '', agreementFile: '',
    hospital: '', hospitalizedIn: '', inTime: '', hospitalizedOut: '', outTime: '', reason: '',
    documentName: '', documentType: '', documentFile: '', issueDate: '', expiryDate: '', reviewDate: '',
    employee: '', employeeTitle: '', employeeService: '', assignmentStart: '', assignmentEnd: '',
    visitDate: '', visitEmployee: '', visitService: '', visitStart: '', visitEnd: '',
    formName: '', formCategory: '', formDueDate: '',
  };

  setTab(tab: ClientViewTab): void {
    if (this.visibleTabs().some(({ id }) => id === tab)) this.activeTab.set(tab);
  }

  private loadOpenTodoCount(clientId: string): void {
    if (!this.authorization.hasPermission(Permissions.ClientTodo.View)) {
      this.openTodoCount.set(null);
      return;
    }
    this.todoApi.list(clientId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: todos => this.openTodoCount.set(
          todos.filter(todo => todo.status === 'Open' || todo.status === 'InProgress').length,
        ),
        error: () => this.openTodoCount.set(null),
      });
  }

  hasPermission(permission: Permission): boolean { return this.authorization.hasPermission(permission); }

  readonly permissions = Permissions;

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
  id: '', fullName: '', firstName: '', middleName: '', lastName: '', goesBy: '—', status: '—', onboarding: false, pmi: '—', dob: '—', age: '—', gender: '—',
  phone: '—', secondaryPhone: '—', email: '—', address: '—', county: '—', intakeDate: '—', socDate: '—', referralSource: '—', program: '—', services: [], location: '—',
  supervisor: 'Managed through Employee Services', evvHours: '—', preferredLanguage: '—', safetyMeasure: '—', specialEquipment: '—', allergies: '—', insurance: '—',
  otherServices: '—', maritalStatus: '—', ethnicity: '—', race: '—', veteranDetails: '—', petDetails: '—', livingArrangement: '—', livingArrangementDetails: '—', caregiverPreference: '—', preferredClinic: '—', preferredHospital: '—', preferredAmbulance: '—',
  nutritionalRequirements: '—', diet: '—', breakfastTime: '—', lunchTime: '—', dinnerTime: '—', notes: '—', additionalInformation: '—',
  eligibility: 'Not assessed', eligibilityChecked: '—',
};

function toClientViewModel(details: ClientDetails): ClientViewModel {
  const profile = details.additionalProfile;
  const demographics = parseStoredFields(profile?.demographics);
  const living = parseStoredFields(profile?.livingArrangement);
  const meals = parseStoredFields(profile?.mealSchedule);
  const address = [details.addressLine1, details.addressLine2, details.city, details.state, details.postalCode, details.country]
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
    fullName: [details.firstName, details.middleName, details.lastName].map((part) => part?.trim()).filter(Boolean).join(' '),
    firstName: details.firstName,
    middleName: details.middleName ?? '',
    lastName: details.lastName,
    goesBy: displayValue(details.preferredName),
    status: clientStatusLabel(details.status),
    onboarding: details.isOnboarding,
    pmi: details.pmiNumber,
    dob: formatDateForDisplay(details.dateOfBirth),
    age: calculateAge(details.dateOfBirth)?.toString() ?? '—',
    gender: clientGenderLabel(details.gender),
    phone: displayValue(details.primaryPhone),
    secondaryPhone: displayValue(details.secondaryPhone),
    email: displayValue(details.email),
    address,
    county: displayValue(details.county),
    intakeDate: formatDateForDisplay(details.intakeDate),
    socDate: formatDateForDisplay(details.socDate),
    referralSource: displayValue(details.referralSource),
    program,
    services: services.length ? services : ['—'],
    location: displayValue(details.location),
    supervisor: 'Managed through Employee Services',
    evvHours: details.evvAuthorizedHoursPerWeek === null ? '—' : `${details.evvAuthorizedHoursPerWeek} hrs / week`,
    preferredLanguage,
    safetyMeasure: displayValue(details.safetyMeasures),
    specialEquipment: displayValue(details.specialEquipment),
    allergies: displayValue(details.allergies),
    otherServices: displayValue(details.otherServices),
    insurance: displayValue(details.insuranceProvider),
    maritalStatus: displayValue(demographics['maritalStatus']),
    ethnicity: displayValue(demographics['ethnicity']),
    race: displayValue(demographics['race']),
    veteranDetails: displayValue(demographics['veteranDetails']),
    petDetails: displayValue(demographics['petsDetails']),
    livingArrangement: displayValue(living['type']),
    livingArrangementDetails: displayValue(living['details']),
    caregiverPreference: displayValue(profile?.caregiverPreference),
    preferredClinic: displayValue(profile?.preferredClinic),
    preferredHospital: displayValue(profile?.preferredHospital),
    preferredAmbulance: displayValue(profile?.preferredAmbulance),
    nutritionalRequirements: displayValue(profile?.nutritionalRequirements),
    diet: displayValue(profile?.diet),
    breakfastTime: displayValue(meals['breakfast']),
    lunchTime: displayValue(meals['lunch']),
    dinnerTime: displayValue(meals['dinner']),
    notes: displayValue(profile?.notes),
    additionalInformation: displayValue(profile?.additionalInformation),
    eligibility: 'Not assessed',
    eligibilityChecked: '—',
  };
}

function displayValue(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized ? normalized : '—';
}

function parseStoredFields(value: string | null | undefined): Readonly<Record<string, string>> {
  const fields: Record<string, string> = {};
  for (const line of value?.split(/\r?\n/) ?? []) {
    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return fields;
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
