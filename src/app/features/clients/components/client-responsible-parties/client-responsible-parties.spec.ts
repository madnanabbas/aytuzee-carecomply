import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import {
  ClientResponsiblePartyApiService,
  ResponsibleParty,
} from '../../data-access/client-responsible-party-api.service';
import { ClientResponsiblePartiesComponent } from './client-responsible-parties';

describe('ClientResponsiblePartiesComponent', () => {
  const existing: ResponsibleParty = {
    id: 'party-1',
    name: 'Jordan Northstar',
    relationship: 'Guardian',
    phone: '6125550100',
    email: 'jordan@example.test',
    address: '10 Main Street',
    livesWithClient: true,
    hasSpenddown: false,
    isActive: true,
  };
  let fixture: ComponentFixture<ClientResponsiblePartiesComponent>;
  let component: ClientResponsiblePartiesComponent;
  let api: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let permissions: Set<string>;

  beforeEach(async () => {
    permissions = new Set([
      Permissions.ClientResponsibleParty.View,
      Permissions.ClientResponsibleParty.Create,
      Permissions.ClientResponsibleParty.Edit,
    ]);
    api = {
      list: vi.fn(() => of([existing])),
      create: vi.fn(() => of(existing)),
      update: vi.fn(() => of(existing)),
    };
    await TestBed.configureTestingModule({
      imports: [ClientResponsiblePartiesComponent],
      providers: [
        { provide: ClientResponsiblePartyApiService, useValue: api },
        {
          provide: AuthorizationService,
          useValue: { hasPermission: (permission: string) => permissions.has(permission) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClientResponsiblePartiesComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders inline fields and existing rows without a dialog', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.textContent).toContain('Full name');
    expect(element.textContent).toContain('Spenddown responsibility');
    expect(element.textContent).toContain(existing.name);
  });

  it('renders the compact table empty state', () => {
    component.parties.set([]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No responsible parties have been added yet.',
    );
  });

  it('validates before adding', () => {
    component.save();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('creates once without companyId, inserts the row, and resets', () => {
    component.parties.set([]);
    fillDraft(component);
    component.save();

    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.create).toHaveBeenCalledWith(
      'client-1',
      expect.not.objectContaining({ companyId: expect.anything() }),
    );
    expect(component.parties()).toEqual([existing]);
    expect(component.draft.name).toBe('');
    expect(component.editing()).toBeNull();
  });

  it('prevents duplicate submission while saving', () => {
    const pending = new Subject<ResponsibleParty>();
    api.create.mockReturnValue(pending);
    fillDraft(component);
    component.save();
    component.save();
    expect(api.create).toHaveBeenCalledTimes(1);
  });

  it('preserves values when create fails', () => {
    api.create.mockReturnValue(throwError(() => new Error('failed')));
    fillDraft(component);
    component.save();
    expect(component.draft.name).toBe(' New Responsible Party ');
    expect(component.error()).toContain('Could not save');
  });

  it('uses the same form for edit and returns to Add mode after update', () => {
    const updated = { ...existing, name: 'Updated Party' };
    api.update.mockReturnValue(of(updated));
    component.edit(existing);
    component.draft.name = updated.name;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Update responsible party',
    );

    component.save();

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(component.parties()[0].name).toBe(updated.name);
    expect(component.editing()).toBeNull();
  });

  it('cancel edit restores Add mode without persisting', () => {
    component.edit(existing);
    component.close();
    expect(api.update).not.toHaveBeenCalled();
    expect(component.editing()).toBeNull();
    expect(component.draft.name).toBe('');
  });

  it('blocks navigation while responsible-party data is unfinished', () => {
    component.draft.name = 'Unfinished';
    expect(component.canLeaveStep()).toBe(false);
    expect(component.error()).toContain('Save the responsible party or cancel');
    component.add();
    expect(component.canLeaveStep()).toBe(true);
  });

  it('honors view and mutation permissions', () => {
    permissions.clear();
    fixture = TestBed.createComponent(ClientResponsiblePartiesComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'You do not have permission',
    );
    expect(api.list).toHaveBeenCalledTimes(1);
  });
});

function fillDraft(component: ClientResponsiblePartiesComponent): void {
  Object.assign(component.draft, {
    name: ' New Responsible Party ',
    relationship: 'Guardian',
    phone: '(612) 555-0199',
    email: ' party@example.test ',
    address: ' 20 Main Street ',
    livesWithClient: true,
    hasSpenddown: false,
    isActive: true,
  });
}
