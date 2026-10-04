import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientHospitalizationApiService } from '../../data-access/client-hospitalization-api.service';
import { ClientHospitalization } from '../../models/client-hospitalization.models';
import { ClientHospitalizationsComponent } from './client-hospitalizations';

describe('ClientHospitalizationsComponent', () => {
  const existing: ClientHospitalization = {
    id: 'hospitalization-1',
    hospitalName: 'Hennepin Healthcare',
    admittedAtUtc: '2026-09-20T10:00:00Z',
    dischargedAtUtc: null,
    reason: 'Observation',
    diagnosis: 'Stable',
    dischargeInstructions: 'Follow up with primary care',
    status: 'Admitted',
    editorVersion: 'a'.repeat(64),
  };
  let fixture: ComponentFixture<ClientHospitalizationsComponent>;
  let component: ClientHospitalizationsComponent;
  let api: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let permissions: Set<string>;

  beforeEach(async () => {
    permissions = new Set([
      Permissions.ClientHospitalization.View,
      Permissions.ClientHospitalization.Create,
      Permissions.ClientHospitalization.Edit,
    ]);
    api = {
      list: vi.fn(() => of([existing])),
      create: vi.fn(() => of(existing)),
      update: vi.fn(() => of(existing)),
    };
    await TestBed.configureTestingModule({
      imports: [ClientHospitalizationsComponent],
      providers: [
        { provide: ClientHospitalizationApiService, useValue: api },
        {
          provide: AuthorizationService,
          useValue: { hasPermission: (permission: string) => permissions.has(permission) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClientHospitalizationsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders all inline fields and existing rows without a modal or dialog', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.querySelector('.fixed.inset-0')).toBeNull();
    expect(element.textContent).toContain('Hospital name');
    expect(element.textContent).toContain('Discharge instructions / follow-up');
    expect(element.textContent).toContain(existing.hospitalName);
    expect(element.textContent).not.toContain(existing.diagnosis);
  });

  it('renders the compact empty state', () => {
    component.items.set([]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No hospitalizations have been added yet.',
    );
  });

  it('validates required fields and discharge date ordering', () => {
    component.save();
    expect(api.create).not.toHaveBeenCalled();
    fillDraft(component);
    component.draft.dischargedAt = '2026-09-19T10:00';
    fixture.detectChanges();
    expect(component.valid()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Discharge cannot be before admission.',
    );
  });

  it('creates once without companyId, inserts the row, and resets the form', () => {
    component.items.set([]);
    fillDraft(component);
    component.save();

    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.create).toHaveBeenCalledWith(
      'client-1',
      expect.not.objectContaining({ companyId: expect.anything() }),
    );
    expect(component.items()).toEqual([existing]);
    expect(component.draft.hospitalName).toBe('');
    expect(component.editing()).toBeNull();
  });

  it('prevents duplicate submission while saving', () => {
    const pending = new Subject<ClientHospitalization>();
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
    expect(component.draft.hospitalName).toBe(' New Hospital ');
    expect(component.error()).toContain('Could not save');
  });

  it('uses the same form for edit and returns to Add mode after update', () => {
    const updated = { ...existing, hospitalName: 'Updated Hospital' };
    api.update.mockReturnValue(of(updated));
    component.edit(existing);
    component.draft.hospitalName = updated.hospitalName;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Update hospitalization');

    component.save();

    expect(api.update).toHaveBeenCalledWith(
      'client-1',
      existing.id,
      expect.objectContaining({ editorVersion: existing.editorVersion }),
    );
    expect(component.items()[0].hospitalName).toBe(updated.hospitalName);
    expect(component.editing()).toBeNull();
  });

  it('cancel edit restores Add mode without persisting', () => {
    component.edit(existing);
    component.close();
    expect(api.update).not.toHaveBeenCalled();
    expect(component.editing()).toBeNull();
    expect(component.draft.hospitalName).toBe('');
  });

  it('blocks navigation while hospitalization data is unfinished', () => {
    component.draft.hospitalName = 'Unfinished';
    expect(component.canLeaveStep()).toBe(false);
    expect(component.error()).toContain('Save the hospitalization or cancel');
    component.add();
    expect(component.canLeaveStep()).toBe(true);
  });

  it('honors view and mutation permissions', () => {
    permissions.clear();
    fixture = TestBed.createComponent(ClientHospitalizationsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'You do not have permission',
    );
    expect(api.list).toHaveBeenCalledTimes(1);
  });
});

function fillDraft(component: ClientHospitalizationsComponent): void {
  Object.assign(component.draft, {
    hospitalName: ' New Hospital ',
    admittedAt: '2026-09-20T10:00',
    dischargedAt: '2026-09-21T10:00',
    reason: ' Observation ',
    diagnosis: ' Stable ',
    dischargeInstructions: ' Follow up ',
  });
}
