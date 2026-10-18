import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientServiceAgreement } from '../../models/client-service-agreement.models';
import { ClientServiceAgreementsComponent } from './client-service-agreements';

describe('ClientServiceAgreementsComponent', () => {
  let fixture: ComponentFixture<ClientServiceAgreementsComponent>;
  let component: ClientServiceAgreementsComponent;
  let permissions: Set<string>;
  let api: Record<
    | 'listClientServiceAgreements'
    | 'getClientServiceAgreement'
    | 'createClientServiceAgreement'
    | 'updateClientServiceAgreement'
    | 'listClientCoverages',
    ReturnType<typeof vi.fn>
  >;

  beforeEach(async () => {
    permissions = new Set([
      Permissions.ClientServiceAgreement.View,
      Permissions.ClientServiceAgreement.Create,
      Permissions.ClientServiceAgreement.Edit,
    ]);
    api = {
      listClientServiceAgreements: vi.fn(() => of([agreement()])),
      getClientServiceAgreement: vi.fn(() => of(agreement())),
      createClientServiceAgreement: vi.fn(() => of(agreement())),
      updateClientServiceAgreement: vi.fn(() => of(agreement())),
      listClientCoverages: vi.fn(() => of([])),
    };
    await TestBed.configureTestingModule({
      imports: [ClientServiceAgreementsComponent],
      providers: [
        { provide: ClientApiService, useValue: api },
        {
          provide: AuthorizationService,
          useValue: { hasPermission: (permission: string) => permissions.has(permission) },
        },
      ],
    }).compileComponents();
    createFixture();
  });

  it('loads agreements only with View permission', () => {
    expect(api.listClientServiceAgreements).toHaveBeenCalledWith('client-1');
    permissions.clear();
    createFixture();
    expect(api.listClientServiceAgreements).toHaveBeenCalledTimes(1);
    expect(text()).toContain('You do not have permission to view service agreements.');
  });

  it('renders the authorized empty state', () => {
    component.items.set([]);
    fixture.detectChanges();
    expect(text()).toContain('No service agreements have been added yet.');
  });

  it('renders one agreement row with grouped service names', () => {
    expect(fixture.nativeElement.querySelectorAll('tbody > tr').length).toBe(1);
    expect(text()).toContain('Personal Care, Respite');
  });

  it('renders Status and Priority in separate columns', () => {
    api.listClientServiceAgreements.mockReturnValue(
      of([{ ...agreement(), status: 'Draft', priority: 'Normal' }]),
    );
    createFixture();
    const headers = [...fixture.nativeElement.querySelectorAll('thead th')].map(
      (cell: HTMLElement) => cell.textContent?.trim(),
    );
    const cells = [...fixture.nativeElement.querySelectorAll('tbody > tr:first-child > td')];
    const status = cells[headers.indexOf('Status')] as HTMLElement;
    const priority = cells[headers.indexOf('Priority')] as HTMLElement;

    expect(status.textContent?.trim()).toBe('Draft');
    expect(priority.textContent?.trim()).toBe('Normal');

    component.items.set([{ ...agreement(), status: 'Draft', priority: null }]);
    fixture.detectChanges();
    const nullPriorityCells = [
      ...fixture.nativeElement.querySelectorAll('tbody > tr:first-child > td'),
    ];
    expect(
      (nullPriorityCells[headers.indexOf('Priority')] as HTMLElement).textContent?.trim(),
    ).toBe('—');
  });

  it('uses one friendly unit-type mapping in summaries and details', () => {
    const source = agreement();
    const unitTypes = [
      'FifteenMinutes',
      'Hour',
      'Visit',
      'Day',
      'PerDiem',
      'ServiceUnit',
      'DollarAmount',
    ] as const;
    const item = {
      ...source,
      lines: unitTypes.map((unitType, index) => ({
        ...source.lines[0],
        id: `line-${index}`,
        unitType,
        authorizedUnits: index === 0 ? 12 : null,
      })),
    };
    api.listClientServiceAgreements.mockReturnValue(of([item]));
    createFixture();
    expect(text()).toContain('12 (15 Minutes)');

    component.toggleDetails(item.id);
    fixture.detectChanges();
    for (const label of [
      '15 Minutes',
      'Hour',
      'Visit',
      'Day',
      'Per Diem',
      'Service Unit',
      'Dollar Amount',
    ]) {
      expect(text()).toContain(label);
    }
  });

  it('does not sum unlike authorized unit types', () => {
    expect(text()).toContain('Multiple unit types');
    expect(text()).not.toContain('15 Hours');
  });

  it('controls Add and Edit actions independently by permission', () => {
    permissions.delete(Permissions.ClientServiceAgreement.Create);
    permissions.delete(Permissions.ClientServiceAgreement.Edit);
    createFixture();
    expect(button('Add service agreement')).toBeUndefined();
    expect(button('Edit')).toBeUndefined();
  });

  it('creates an agreement with header data and multiple service lines', () => {
    button('Add service agreement')?.click();
    fixture.detectChanges();
    fillHeader();
    fillLine(component.lines()[0], 'PCA', 'Personal Care');
    component.addLine();
    fillLine(component.lines()[1], 'RESP', 'Respite');
    component.save();
    const request = api.createClientServiceAgreement.mock.calls[0][1];
    expect(request.agreementNumber).toBe(' AGR-100 '.trim());
    expect(request.lines).toHaveLength(2);
    expect(request.lines[1].id).toBeUndefined();
    expect(request.lines[0].startDate).toBe('2026-10-01');
  });

  it('creates a valid agreement without diagnosis, priority, notes, or dummy selection', () => {
    component.startCreate();
    component.setAgreementStartDate('2026-10-01');
    const line = component.lines()[0];
    fillLine(line, 'PCA', 'Personal Care');
    component.draft.priority = '';
    component.draft.notes = '';
    component.draft.isDummy = false;
    line.diagnoses = [];
    fixture.detectChanges();

    expect(component.valid()).toBe(true);
    expect(button('Create agreement')?.disabled).toBe(false);
    component.save();

    const request = api.createClientServiceAgreement.mock.calls[0][1];
    expect(request.priority).toBeNull();
    expect(request.notes).toBeNull();
    expect(request.isDummy).toBe(false);
    expect(request.lines[0].diagnoses).toEqual([]);
    expect(request.lines[0].startDate).toBe('2026-10-01');
  });

  it('loads current client coverages and hydrates payer and member values', () => {
    permissions.add(Permissions.ClientCoverage.View);
    api.listClientCoverages.mockReturnValue(
      of([
        {
          id: 'coverage-1',
          payerId: 'payer-1',
          payerName: 'Northstar',
          manualPayerName: null,
          memberId: 'MEM-1',
          medicaidId: 'MA-1',
          effectiveFrom: null,
          effectiveTo: null,
          isVerified: true,
          isPrimary: true,
          editorVersion: 'coverage-version',
        },
      ]),
    );
    createFixture();
    component.startCreate();
    expect(api.listClientCoverages).toHaveBeenCalledWith('client-1');
    expect(component.draft.clientCoverageId).toBe('coverage-1');
    expect(component.draft.payerId).toBe('payer-1');
    expect(component.draft.payerName).toBe('Northstar');
    expect(component.draft.insuredMemberId).toBe('MEM-1');
  });

  it('supports controlled manual payer mode', () => {
    component.startCreate();
    component.selectCoverage('__manual__');
    component.draft.payerName = 'Manual payer';
    fillHeader();
    fillLine(component.lines()[0], 'PCA', 'Personal Care');
    component.save();
    const request = api.createClientServiceAgreement.mock.calls[0][1];
    expect(request.clientCoverageId).toBeNull();
    expect(request.payerId).toBeNull();
    expect(request.payerName).toBe('Manual payer');
  });

  it('loads edit details and sends editorVersion while preserving persisted line IDs', () => {
    component.startEdit(agreement());
    component.save();
    expect(api.getClientServiceAgreement).toHaveBeenCalledWith('client-1', 'agreement-1');
    const request = api.updateClientServiceAgreement.mock.calls[0][2];
    expect(request.editorVersion).toBe('version-1');
    expect(request.lines.map((line: { id?: string }) => line.id)).toEqual(['line-1', 'line-2']);
    expect(request.lines[0].diagnoses[0].id).toBe('diagnosis-1');
  });

  it('supports one primary diagnosis and multiple additional diagnoses', () => {
    component.startCreate();
    fillHeader();
    const line = component.lines()[0];
    fillLine(line, 'PCA', 'Personal Care');
    component.addDiagnosis(line);
    component.addDiagnosis(line);
    component.selectPrimaryDiagnosis(line, 0);
    line.diagnoses[0].diagnosisText = 'Primary';
    line.diagnoses[1].diagnosisText = 'Additional';
    component.save();

    const diagnoses = api.createClientServiceAgreement.mock.calls[0][1].lines[0].diagnoses;
    expect(diagnoses).toHaveLength(2);
    expect(
      diagnoses.filter((diagnosis: { isPrimary: boolean }) => diagnosis.isPrimary),
    ).toHaveLength(1);
  });

  it('submits new edit lines without an ID', () => {
    component.startEdit(agreement());
    component.addLine();
    fillLine(component.lines()[2], 'NEW', 'New service');
    component.save();
    expect(api.updateClientServiceAgreement.mock.calls[0][2].lines[2].id).toBeUndefined();
  });

  it('never offers removal for persisted lines but removes unsaved lines', () => {
    component.startEdit(agreement());
    component.removeLine(0);
    expect(component.lines()).toHaveLength(2);
    component.addLine();
    component.removeLine(2);
    expect(component.lines()).toHaveLength(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.remove-line').length).toBe(0);
  });

  it('shows backend calculations in details without fabricating used or remaining values', () => {
    component.toggleDetails('agreement-1');
    fixture.detectChanges();
    expect(text()).toContain('Planned hours/week');
    expect(text()).toContain('$1,000.00');
    expect(text()).not.toContain('Used units');
    expect(text()).not.toContain('Remaining units');
    expect(text()).not.toContain('Used value');
    expect(text()).not.toContain('Remaining value');
  });

  it('keeps the editor open and shows the standard conflict guidance on 409', () => {
    api.updateClientServiceAgreement.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );
    component.startEdit(agreement());
    component.save();
    expect(component.editorOpen()).toBe(true);
    expect(component.error()).toContain('Reload or reopen');
  });

  it('displays overlap warnings in the agreement list and line details', () => {
    const item = agreement([overlapWarning]);
    api.listClientServiceAgreements.mockReturnValue(of([item]));
    createFixture();
    expect(text()).toContain('Review overlap');

    component.toggleDetails(item.id);
    fixture.detectChanges();
    expect(text()).toContain('Overlapping active authorization');
    expect(text()).toContain('Confirm that the authorization periods are intentional.');
    expect(text()).not.toContain(overlapWarning.overlappingAgreementId);
  });

  it('shows a returned overlap warning without blocking a successful save', () => {
    api.createClientServiceAgreement.mockReturnValue(of(agreement([overlapWarning])));
    component.startCreate();
    fillHeader();
    fillLine(component.lines()[0], 'PCA', 'Personal Care');

    component.save();
    fixture.detectChanges();

    expect(api.createClientServiceAgreement).toHaveBeenCalledOnce();
    expect(component.editorOpen()).toBe(false);
    expect(component.saveWarnings()).toEqual([overlapWarning]);
    expect(text()).toContain('Another active authorization for this service overlaps');
  });

  it('prevents duplicate saves while a request is pending', () => {
    const pending = new Subject<ClientServiceAgreement>();
    api.createClientServiceAgreement.mockReturnValue(pending);
    component.startCreate();
    fillHeader();
    fillLine(component.lines()[0], 'PCA', 'Personal Care');
    component.save();
    component.save();
    expect(api.createClientServiceAgreement).toHaveBeenCalledTimes(1);
  });

  it('validates date order and line values before submission', () => {
    component.startCreate();
    fillHeader();
    component.draft.endDate = '2026-09-30';
    fillLine(component.lines()[0], 'PCA', 'Personal Care');
    expect(component.valid()).toBe(false);
    component.draft.endDate = '2026-12-31';
    component.lines()[0].minutesPerUnit = 0;
    expect(component.valid()).toBe(false);
    component.lines()[0].minutesPerUnit = 15;
    component.lines()[0].endDate = '2026-09-30';
    component.lines()[0].rateEffectiveFrom = '2026-11-01';
    component.lines()[0].rateEffectiveTo = '2026-10-31';
    fixture.detectChanges();
    expect(text()).toContain('End date cannot be before start date.');
    expect(text()).toContain('Rate effective-to date cannot be before the effective-from date.');
    expect(api.createClientServiceAgreement).not.toHaveBeenCalled();
  });

  it('contains no fake signed-file input or upload behavior', () => {
    component.startCreate();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
    expect(text()).not.toContain('Signed agreement');
    expect(text()).not.toContain('Community Check');
  });

  function createFixture(): void {
    fixture = TestBed.createComponent(ClientServiceAgreementsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
  function button(label: string): HTMLButtonElement | undefined {
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.trim() === label,
    ) as HTMLButtonElement | undefined;
  }

  function fillHeader(): void {
    component.draft.agreementNumber = ' AGR-100 ';
    component.draft.startDate = '2026-10-01';
    component.draft.endDate = '2026-12-31';
  }
});

function fillLine(
  line: ReturnType<ClientServiceAgreementsComponent['lines']>[number],
  code: string,
  name: string,
): void {
  line.serviceCode = code;
  line.serviceName = name;
  line.unitType = 'Hour';
  line.minutesPerUnit = 60;
  line.authorizedUnits = 10;
  line.ratePerUnit = 100;
  line.startDate = '2026-10-01';
}

const overlapWarning = {
  code: 'SERVICE_LINE_OVERLAP' as const,
  serviceCode: 'PCA',
  serviceLineId: 'line-1',
  overlappingAgreementId: 'agreement-2',
  overlappingLineId: 'line-3',
  overlapStartDate: '2026-10-15',
  overlapEndDate: '2026-10-31',
};

function agreement(warnings: ClientServiceAgreement['warnings'] = []): ClientServiceAgreement {
  return {
    id: 'agreement-1',
    agreementNumber: 'AGR-100',
    payerName: 'County',
    insuredMemberId: 'MEM-1',
    priorAuthorizationNumber: 'PA-1',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 'Active',
    priority: 'High',
    isDummy: false,
    notes: null,
    editorVersion: 'version-1',
    warnings,
    lines: [
      {
        id: 'line-1',
        serviceCode: 'PCA',
        serviceName: 'Personal Care',
        unitType: 'Hour',
        minutesPerUnit: 60,
        authorizedUnits: 10,
        ratePerUnit: 100,
        startDate: '2026-10-01',
        endDate: null,
        rateEffectiveFrom: '2026-10-01',
        rateEffectiveTo: '2026-12-31',
        authorizedBudgetAmount: 1200,
        plannedHoursPerVisit: 2,
        plannedVisitsPerWeek: 3,
        diagnoses: [
          { id: 'diagnosis-1', diagnosisText: 'Diagnosis', icdCode: 'Z00', isPrimary: true },
        ],
        estimatedBudget: 1000,
        plannedHoursPerWeek: 6,
        plannedUnitsPerWeek: 6,
      },
      {
        id: 'line-2',
        serviceCode: 'RESP',
        serviceName: 'Respite',
        unitType: 'Visit',
        minutesPerUnit: null,
        authorizedUnits: 5,
        ratePerUnit: 50,
        startDate: '2026-10-01',
        endDate: null,
        rateEffectiveFrom: null,
        rateEffectiveTo: null,
        authorizedBudgetAmount: null,
        plannedHoursPerVisit: null,
        plannedVisitsPerWeek: null,
        diagnoses: [],
        estimatedBudget: 250,
        plannedHoursPerWeek: null,
        plannedUnitsPerWeek: null,
      },
    ],
  };
}
