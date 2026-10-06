import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permission, Permissions } from '../../../../core/authorization/permissions';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientTodoApiService } from '../../data-access/client-todo-api.service';
import { ClientDetails } from '../../models/client-api.models';
import { ClientTodosComponent } from '../../components/client-todos/client-todos';
import {
  ClientDialog,
  ClientTabDefinition,
  ClientViewModel,
  ClientViewTab,
  DialogDefinition,
  EMPTY_CLIENT_VIEW,
  RelatedRecordPreviewRow,
  toClientViewModel,
} from './client-view.models';
import { ClientViewOverviewComponent } from './client-view-overview';
import { ClientViewDialogComponent } from './client-view-dialog';
import { ClientIntakeProfileComponent } from './client-intake-profile';

@Component({
  selector: 'app-client-view-page',
  standalone: true,
  imports: [
    RouterLink,
    ClientTodosComponent,
    ClientViewOverviewComponent,
    ClientViewDialogComponent,
    ClientIntakeProfileComponent,
  ],
  templateUrl: './client-view-page.html',
  styleUrl: './client-view-page.css',
})
export class ClientViewPageComponent {
  private readonly authorization = inject(AuthorizationService);

  readonly canEditClient = computed(() =>
    this.authorization.hasPermission(Permissions.Client.Edit),
  );
  readonly hasSsn = computed(() => this.clientDetails()?.hasSsn === true);
  readonly canRevealSsn = computed(
    () => this.hasSsn() && this.authorization.hasPermission(Permissions.Client.RevealSsn),
  );
  readonly canUploadDocuments = computed(() =>
    this.authorization.hasPermission(Permissions.ClientDocument.Upload),
  );
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
    this.api
      .revealClientSsn(this.client.id)
      .pipe(
        finalize(() => this.ssnRevealing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
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
    this.api
      .getClient(clientId)
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

  private readonly profileTabs: readonly ClientTabDefinition[] = [
    { id: 'overview', label: 'Overview', viewPermission: Permissions.Client.View },
    {
      id: 'primary-caregivers',
      label: 'Primary caregivers',
      viewPermission: Permissions.Client.View,
    },
    { id: 'contacts', label: 'Contacts', viewPermission: Permissions.Client.View },
    {
      id: 'care-coordinators',
      label: 'Care coordinators',
      viewPermission: Permissions.Client.View,
    },
    {
      id: 'consultation-providers',
      label: 'Consultation providers',
      viewPermission: Permissions.Client.View,
    },
    { id: 'doctors', label: 'Doctors', viewPermission: Permissions.Client.View },
    {
      id: 'responsible-parties',
      label: 'Responsible parties',
      viewPermission: Permissions.Client.View,
    },
    {
      id: 'hospitalizations',
      label: 'Hospitalizations',
      viewPermission: Permissions.Client.View,
    },
  ];

  private readonly operationTabs: readonly ClientTabDefinition[] = [
    { id: 'quick-notes', label: 'Quick notes', viewPermission: Permissions.ClientQuickNote.View },
    { id: 'todos', label: 'To-dos', viewPermission: Permissions.ClientTodo.View },
    {
      id: 'service-agreements',
      label: 'Service agreements',
      viewPermission: Permissions.ClientServiceAgreement.View,
    },
    { id: 'forms', label: 'Forms', viewPermission: Permissions.ClientForm.View },
    { id: 'documents', label: 'Documents', viewPermission: Permissions.ClientDocument.View },
    { id: 'email-logs', label: 'Email logs', viewPermission: Permissions.ClientEmailLog.View },
    {
      id: 'employee-services',
      label: 'Employee services',
      viewPermission: Permissions.ClientEmployeeService.View,
    },
  ];

  readonly navigationGroups = computed(() => [
    { label: 'Client profile', items: this.profileTabs },
    {
      label: 'Operations',
      items: this.operationTabs.filter((tab) =>
        this.authorization.hasPermission(tab.viewPermission),
      ),
    },
  ]);

  readonly navigationItems = computed(() =>
    this.navigationGroups().flatMap((group) => group.items),
  );

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
    note: {
      title: 'Add quick note',
      description: 'Record an internal client note and optionally tag a staff member.',
      submitLabel: 'Add note',
    },
    'service-agreement': {
      title: 'Add service agreement',
      description: 'Record the approved service, effective dates and supporting agreement.',
      submitLabel: 'Add agreement',
    },
    hospitalization: {
      title: 'Add hospitalization',
      description: 'Record an admission and discharge period for the client.',
      submitLabel: 'Add hospitalization',
    },
    document: {
      title: 'Upload client document',
      description: 'Add document metadata and select a file for secure upload.',
      submitLabel: 'Upload document',
    },
    'employee-service': {
      title: 'Assign employee / caregiver',
      description: 'Link an employee to this client and define the service assignment.',
      submitLabel: 'Assign employee',
    },
    visit: {
      title: 'Add visit',
      description: 'Record a client service visit for design review.',
      submitLabel: 'Add visit',
    },
    form: {
      title: 'Add client form',
      description: 'Create or attach a client-related form record.',
      submitLabel: 'Add form',
    },
  };

  readonly draft = {
    subject: '',
    noteType: '',
    note: '',
    taggedEmployee: '',
    attachment: '',
    service: '',
    agreementStart: '',
    agreementEnd: '',
    authorizedHours: '',
    agreementFile: '',
    hospital: '',
    hospitalizedIn: '',
    inTime: '',
    hospitalizedOut: '',
    outTime: '',
    reason: '',
    documentName: '',
    documentType: '',
    documentFile: '',
    issueDate: '',
    expiryDate: '',
    reviewDate: '',
    employee: '',
    employeeTitle: '',
    employeeService: '',
    assignmentStart: '',
    assignmentEnd: '',
    visitDate: '',
    visitEmployee: '',
    visitService: '',
    visitStart: '',
    visitEnd: '',
    formName: '',
    formCategory: '',
    formDueDate: '',
  };

  setTab(tab: ClientViewTab): void {
    if (this.navigationItems().some(({ id }) => id === tab)) this.activeTab.set(tab);
  }

  selectTab(event: Event): void {
    this.setTab((event.target as HTMLSelectElement).value as ClientViewTab);
  }

  private loadOpenTodoCount(clientId: string): void {
    if (!this.authorization.hasPermission(Permissions.ClientTodo.View)) {
      this.openTodoCount.set(null);
      return;
    }
    this.todoApi
      .list(clientId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (todos) =>
          this.openTodoCount.set(
            todos.filter((todo) => todo.status === 'Open' || todo.status === 'InProgress').length,
          ),
        error: () => this.openTodoCount.set(null),
      });
  }

  hasPermission(permission: Permission): boolean {
    return this.authorization.hasPermission(permission);
  }

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
    if (
      normalized.includes('current') ||
      normalized.includes('active') ||
      normalized.includes('complete') ||
      normalized.includes('delivered')
    ) {
      return 'bg-green-50 text-success ring-green-200';
    }
    if (
      normalized.includes('expiring') ||
      normalized.includes('progress') ||
      normalized.includes('pending')
    ) {
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    }
    if (
      normalized.includes('missing') ||
      normalized.includes('expired') ||
      normalized.includes('overdue')
    ) {
      return 'bg-red-50 text-danger ring-red-200';
    }
    return 'bg-surface-muted text-text-secondary ring-border';
  }
}
