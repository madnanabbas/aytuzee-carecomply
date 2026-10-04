import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import {
  CareCoordinator,
  ClientCareCoordinatorApiService,
} from '../../data-access/client-care-coordinator-api.service';
import { ClientCareCoordinatorsComponent } from './client-care-coordinators';

describe('ClientCareCoordinatorsComponent', () => {
  const existing: CareCoordinator = {
    id: 'coordinator-1',
    name: 'Morgan Lee',
    companyName: 'County Services',
    phone: '6125550100',
    phoneExtension: '42',
    fax: '6125550101',
    email: 'morgan@example.test',
    isActive: true,
  };
  let fixture: ComponentFixture<ClientCareCoordinatorsComponent>;
  let component: ClientCareCoordinatorsComponent;
  let api: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let permissions: Set<string>;

  beforeEach(async () => {
    permissions = new Set([
      Permissions.ClientCareCoordinator.View,
      Permissions.ClientCareCoordinator.Create,
      Permissions.ClientCareCoordinator.Edit,
    ]);
    api = {
      list: vi.fn(() => of([existing])),
      create: vi.fn(() => of(existing)),
      update: vi.fn(() => of(existing)),
    };
    await TestBed.configureTestingModule({
      imports: [ClientCareCoordinatorsComponent],
      providers: [
        { provide: ClientCareCoordinatorApiService, useValue: api },
        {
          provide: AuthorizationService,
          useValue: { hasPermission: (permission: string) => permissions.has(permission) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClientCareCoordinatorsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders inline fields and existing rows without a dialog', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.textContent).toContain('Coordinator name');
    expect(element.textContent).toContain('Add coordinator');
    expect(element.textContent).toContain(existing.name);
  });

  it('renders a compact table empty state', () => {
    component.coordinators.set([]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No care coordinators have been added yet.',
    );
  });

  it('does not submit an invalid coordinator', () => {
    component.save();

    expect(api.create).not.toHaveBeenCalled();
  });

  it('creates once, sends no company id, inserts the row, and resets the form', () => {
    component.coordinators.set([]);
    fillValidDraft(component);

    component.save();

    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.create).toHaveBeenCalledWith(
      'client-1',
      expect.not.objectContaining({ companyId: expect.anything() }),
    );
    expect(component.coordinators()).toEqual([existing]);
    expect(component.draft.name).toBe('');
    expect(component.editing()).toBeNull();
  });

  it('prevents duplicate submission while saving', () => {
    const pending = new Subject<CareCoordinator>();
    api.create.mockReturnValue(pending);
    fillValidDraft(component);

    component.save();
    component.save();

    expect(api.create).toHaveBeenCalledTimes(1);
  });

  it('preserves entered values when create fails', () => {
    api.create.mockReturnValue(throwError(() => new Error('failed')));
    fillValidDraft(component);

    component.save();

    expect(component.draft.name).toBe(' New Coordinator ');
    expect(component.error()).toContain('Could not save');
  });

  it('uses the same form for edit and returns to add mode after update', () => {
    const updated = { ...existing, name: 'Updated Coordinator' };
    api.update.mockReturnValue(of(updated));
    component.edit(existing);
    expect(component.draft.name).toBe(existing.name);
    component.draft.name = updated.name;

    component.save();

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(component.coordinators()[0].name).toBe(updated.name);
    expect(component.editing()).toBeNull();
    expect(component.draft.name).toBe('');
  });

  it('cancel edit restores a clean add state without persisting', () => {
    component.edit(existing);

    component.close();

    expect(api.update).not.toHaveBeenCalled();
    expect(component.editing()).toBeNull();
    expect(component.draft.name).toBe('');
  });

  it('blocks wizard navigation while coordinator data is unfinished', () => {
    component.draft.name = 'Unfinished';

    expect(component.canLeaveStep()).toBe(false);
    expect(component.error()).toContain('Save the coordinator or cancel');

    component.add();
    expect(component.canLeaveStep()).toBe(true);
  });

  it('honors view and mutation permissions', () => {
    permissions.clear();
    fixture = TestBed.createComponent(ClientCareCoordinatorsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'You do not have permission',
    );
    expect(api.list).toHaveBeenCalledTimes(1);
  });
});

function fillValidDraft(component: ClientCareCoordinatorsComponent): void {
  Object.assign(component.draft, {
    name: ' New Coordinator ',
    companyName: ' County Services ',
    phone: '(612) 555-0199',
    phoneExtension: '12',
    fax: '(612) 555-0198',
    email: ' coordinator@example.test ',
    isActive: true,
  });
}
