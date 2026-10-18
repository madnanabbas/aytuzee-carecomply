import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { PayerLookupService } from '../../../../core/lookups/payer-lookup.service';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientCoveragesComponent } from './client-coverages';

describe('ClientCoveragesComponent', () => {
  let fixture: ComponentFixture<ClientCoveragesComponent>;
  let component: ClientCoveragesComponent;
  const api = {
    listClientCoverages: vi.fn(() => of([])),
    createClientCoverage: vi.fn((_clientId: string, request: Record<string, unknown>) =>
      of({ id: 'coverage-1', ...request, payerName: 'Northstar', editorVersion: 'v1' }),
    ),
    updateClientCoverage: vi.fn((_clientId: string, id: string, request: Record<string, unknown>) =>
      of({ id, ...request, payerName: 'Northstar' }),
    ),
  };
  const payers = {
    list: vi.fn(() =>
      of([{ id: 'payer-1', name: 'Northstar', isActive: true, editorVersion: 'v1' }]),
    ),
  };
  const granted = new Set<string>([
    Permissions.ClientCoverage.View,
    Permissions.ClientCoverage.Create,
    Permissions.ClientCoverage.Edit,
    Permissions.Payer.View,
  ]);

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [ClientCoveragesComponent],
      providers: [
        { provide: ClientApiService, useValue: api },
        { provide: PayerLookupService, useValue: payers },
        {
          provide: AuthorizationService,
          useValue: { hasPermission: (permission: string) => granted.has(permission) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClientCoveragesComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the current client coverages and active payer master options', () => {
    expect(api.listClientCoverages).toHaveBeenCalledWith('client-1');
    expect(payers.list).toHaveBeenCalledOnce();
    expect(component.payers()[0].name).toBe('Northstar');
  });

  it('creates master payer coverage while preserving member and Medicaid IDs separately', () => {
    component.open();
    Object.assign(component.draft, {
      payerId: 'payer-1',
      memberId: 'MEM-1',
      medicaidId: 'MA-2',
      isVerified: true,
    });
    component.save();
    expect(api.createClientCoverage).toHaveBeenCalledWith(
      'client-1',
      expect.objectContaining({
        payerId: 'payer-1',
        manualPayerName: null,
        memberId: 'MEM-1',
        medicaidId: 'MA-2',
      }),
    );
  });

  it('supports manual payer mode without sending a master payer id', () => {
    component.open();
    component.setManualMode(true);
    component.draft.manualPayerName = 'Manual payer';
    component.save();
    expect(api.createClientCoverage).toHaveBeenCalledWith(
      'client-1',
      expect.objectContaining({
        payerId: null,
        manualPayerName: 'Manual payer',
      }),
    );
  });
});
