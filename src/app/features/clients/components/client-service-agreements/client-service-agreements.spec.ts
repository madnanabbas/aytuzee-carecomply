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
    | 'updateClientServiceAgreement',
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
  });

  it('loads edit details and sends editorVersion while preserving persisted line IDs', () => {
    component.startEdit(agreement());
    component.save();
    expect(api.getClientServiceAgreement).toHaveBeenCalledWith('client-1', 'agreement-1');
    const request = api.updateClientServiceAgreement.mock.calls[0][2];
    expect(request.editorVersion).toBe('version-1');
    expect(request.lines.map((line: { id?: string }) => line.id)).toEqual(['line-1', 'line-2']);
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
    expect(api.createClientServiceAgreement).not.toHaveBeenCalled();
  });

  it('contains no fake signed-file input or upload behavior', () => {
    component.startCreate();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
    expect(text()).not.toContain('Signed agreement');
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
  line.unitType = 'Hours';
  line.minutesPerUnit = 60;
  line.authorizedUnits = 10;
  line.ratePerUnit = 100;
}

function agreement(): ClientServiceAgreement {
  return {
    id: 'agreement-1',
    agreementNumber: 'AGR-100',
    payerName: 'County',
    insuredMemberId: 'MEM-1',
    priorAuthorizationNumber: 'PA-1',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 'Active',
    notes: null,
    editorVersion: 'version-1',
    lines: [
      {
        id: 'line-1',
        serviceCode: 'PCA',
        serviceName: 'Personal Care',
        unitType: 'Hours',
        minutesPerUnit: 60,
        authorizedUnits: 10,
        ratePerUnit: 100,
        plannedHoursPerVisit: 2,
        plannedVisitsPerWeek: 3,
        primaryDiagnosisText: 'Diagnosis',
        icdCode: 'Z00',
        estimatedBudget: 1000,
        plannedHoursPerWeek: 6,
        plannedUnitsPerWeek: 6,
      },
      {
        id: 'line-2',
        serviceCode: 'RESP',
        serviceName: 'Respite',
        unitType: 'Visits',
        minutesPerUnit: null,
        authorizedUnits: 5,
        ratePerUnit: 50,
        plannedHoursPerVisit: null,
        plannedVisitsPerWeek: null,
        primaryDiagnosisText: null,
        icdCode: null,
        estimatedBudget: 250,
        plannedHoursPerWeek: null,
        plannedUnitsPerWeek: null,
      },
    ],
  };
}
