import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import {
  ClientClinicalContactsApiService,
  ClinicalContact,
} from '../../data-access/client-clinical-contacts-api.service';
import { ClientClinicalContactsComponent } from './client-clinical-contacts';

describe('ClientClinicalContactsComponent', () => {
  const existing: ClinicalContact = {
    id: 'provider-1',
    name: 'Taylor Provider',
    phone: '6125550100',
    email: 'taylor@example.test',
    secondaryName: 'Support Person',
    secondaryPhone: '6125550101',
    secondaryAddress: '10 Main Street',
    npi: '',
    fax: '',
    address: '',
    postalCode: '',
    city: '',
    state: '',
    isActive: true,
  };
  let fixture: ComponentFixture<ClientClinicalContactsComponent>;
  let component: ClientClinicalContactsComponent;
  let api: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let permissions: Set<string>;

  beforeEach(async () => {
    permissions = new Set([
      Permissions.ClientConsultationProvider.View,
      Permissions.ClientConsultationProvider.Create,
      Permissions.ClientConsultationProvider.Edit,
      Permissions.ClientPhysician.View,
      Permissions.ClientPhysician.Create,
      Permissions.ClientPhysician.Edit,
    ]);
    api = {
      list: vi.fn(() => of([existing])),
      create: vi.fn(() => of(existing)),
      update: vi.fn(() => of(existing)),
    };
    await TestBed.configureTestingModule({
      imports: [ClientClinicalContactsComponent],
      providers: [
        { provide: ClientClinicalContactsApiService, useValue: api },
        {
          provide: AuthorizationService,
          useValue: { hasPermission: (permission: string) => permissions.has(permission) },
        },
      ],
    }).compileComponents();
    createFixture('consultation-providers');
  });

  it('renders provider inline fields and existing rows without a dialog', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.textContent).toContain('Consultation provider name');
    expect(element.textContent).toContain('Support provider name');
    expect(element.textContent).toContain(existing.name);
  });

  it('renders the provider empty state in the table', () => {
    component.records.set([]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No consultation providers have been added yet.',
    );
  });

  it('validates before adding a provider', () => {
    component.save();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('creates once without companyId, inserts the row, and resets the form', () => {
    component.records.set([]);
    fillProviderDraft(component);

    component.save();

    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.create).toHaveBeenCalledWith(
      'client-1',
      'consultation-providers',
      expect.not.objectContaining({ companyId: expect.anything() }),
    );
    expect(component.records()).toEqual([existing]);
    expect(component.draft.name).toBe('');
  });

  it('prevents duplicate provider submission while saving', () => {
    const pending = new Subject<ClinicalContact>();
    api.create.mockReturnValue(pending);
    fillProviderDraft(component);

    component.save();
    component.save();

    expect(api.create).toHaveBeenCalledTimes(1);
  });

  it('preserves provider values when save fails', () => {
    api.create.mockReturnValue(throwError(() => new Error('failed')));
    fillProviderDraft(component);

    component.save();

    expect(component.draft.name).toBe(' New Provider ');
    expect(component.error()).toContain('Could not save');
  });

  it('uses the same inline form to update a provider', () => {
    const updated = { ...existing, name: 'Updated Provider' };
    api.update.mockReturnValue(of(updated));
    component.edit(existing);
    component.draft.name = updated.name;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Update provider');

    component.save();

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(component.records()[0].name).toBe(updated.name);
    expect(component.editing()).toBeNull();
    expect(component.draft.name).toBe('');
  });

  it('cancel edit restores provider Add mode without persisting', () => {
    component.edit(existing);
    component.close();

    expect(api.update).not.toHaveBeenCalled();
    expect(component.editing()).toBeNull();
    expect(component.draft.name).toBe('');
  });

  it('blocks navigation while provider data is unfinished', () => {
    component.draft.name = 'Unfinished';

    expect(component.canLeaveStep()).toBe(false);
    expect(component.error()).toContain('Save the consultation provider or cancel');

    component.add();
    expect(component.canLeaveStep()).toBe(true);
  });

  it('honors consultation-provider permissions', () => {
    permissions.clear();
    createFixture('consultation-providers');

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'You do not have permission',
    );
  });

  it('renders Doctors as an inline form without a dialog and uses the physician route', () => {
    createFixture('physicians');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Doctors');
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.textContent).toContain('Physician name');
    expect(element.textContent).toContain('Add doctor');
    expect(api.list).toHaveBeenLastCalledWith('client-1', 'physicians');
  });

  it('validates before adding a physician', () => {
    createFixture('physicians');
    component.save();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('creates a physician once without companyId and resets the form', () => {
    const physician = { ...existing, id: 'physician-1', name: 'Doctor Rivera', npi: '1234567890' };
    api.create.mockReturnValue(of(physician));
    createFixture('physicians');
    component.records.set([]);
    fillPhysicianDraft(component);

    component.save();

    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.create).toHaveBeenCalledWith(
      'client-1',
      'physicians',
      expect.not.objectContaining({ companyId: expect.anything() }),
    );
    expect(component.records()).toEqual([physician]);
    expect(component.draft.name).toBe('');
  });

  it('prevents duplicate physician submission and preserves values on failure', () => {
    const pending = new Subject<ClinicalContact>();
    api.create.mockReturnValue(pending);
    createFixture('physicians');
    fillPhysicianDraft(component);
    component.save();
    component.save();
    expect(api.create).toHaveBeenCalledTimes(1);

    pending.error(new Error('failed'));
    expect(component.draft.name).toBe(' Doctor Rivera ');
    expect(component.error()).toContain('Could not save');
  });

  it('edits a physician in the same form and cancel restores Add mode', () => {
    const physician = { ...existing, id: 'physician-1', name: 'Doctor Rivera', npi: '1234567890' };
    const updated = { ...physician, name: 'Doctor Updated' };
    api.list.mockReturnValue(of([physician]));
    api.update.mockReturnValue(of(updated));
    createFixture('physicians');
    component.edit(physician);
    component.draft.name = updated.name;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Update doctor');

    component.save();

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(component.records()[0].name).toBe(updated.name);
    expect(component.editing()).toBeNull();

    component.edit(updated);
    component.close();
    expect(api.update).toHaveBeenCalledTimes(1);
    expect(component.editing()).toBeNull();
  });

  it('blocks navigation while physician data is unfinished', () => {
    createFixture('physicians');
    component.draft.name = 'Unfinished doctor';

    expect(component.canLeaveStep()).toBe(false);
    expect(component.error()).toContain('Save the doctor or cancel');
  });

  function createFixture(kind: 'consultation-providers' | 'physicians'): void {
    fixture = TestBed.createComponent(ClientClinicalContactsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.componentRef.setInput('kind', kind);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }
});

function fillProviderDraft(component: ClientClinicalContactsComponent): void {
  Object.assign(component.draft, {
    name: ' New Provider ',
    phone: '(612) 555-0199',
    email: ' provider@example.test ',
    secondaryName: ' Support Person ',
    secondaryPhone: '(612) 555-0198',
    secondaryAddress: ' 20 Main Street ',
    isActive: true,
  });
}

function fillPhysicianDraft(component: ClientClinicalContactsComponent): void {
  Object.assign(component.draft, {
    name: ' Doctor Rivera ',
    npi: '1234567890',
    phone: '(612) 555-0199',
    fax: '(612) 555-0198',
    address: ' 20 Main Street ',
    postalCode: '55101',
    city: ' Saint Paul ',
    state: ' MN ',
    isActive: true,
  });
}
