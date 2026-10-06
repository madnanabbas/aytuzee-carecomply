import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import {
  ClientContact,
  ClientContactsApiService,
  SaveClientContact,
} from '../../data-access/client-contacts-api.service';
import { ClientContactsComponent } from './client-contacts';

describe('ClientContactsComponent', () => {
  const existing: ClientContact = {
    id: 'contact-1',
    type: 'Emergency',
    name: 'Jordan Northstar',
    relationship: 'Sibling',
    phone: '6125550100',
    email: 'jordan@example.test',
    address: '10 Main Street',
    isActive: true,
  };
  let fixture: ComponentFixture<ClientContactsComponent>;
  let component: ClientContactsComponent;
  let api: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let permissions: Set<string>;

  beforeEach(async () => {
    permissions = new Set([
      Permissions.ClientContact.View,
      Permissions.ClientContact.Create,
      Permissions.ClientContact.Edit,
    ]);
    api = {
      list: vi.fn(() => of([existing])),
      create: vi.fn(() => of(existing)),
      update: vi.fn(() => of(existing)),
    };
    await TestBed.configureTestingModule({
      imports: [ClientContactsComponent],
      providers: [
        { provide: ClientContactsApiService, useValue: api },
        {
          provide: AuthorizationService,
          useValue: { hasPermission: (permission: string) => permissions.has(permission) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClientContactsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the inline form and existing rows without a dialog', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.textContent).toContain('Contact type');
    expect(element.textContent).toContain('Add contact');
    expect(element.textContent).toContain(existing.name);
  });

  it('renders a compact table empty state', () => {
    component.contacts.set([]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No contacts have been added yet.',
    );
  });

  it('does not submit an invalid contact', () => {
    component.save();

    expect(api.create).not.toHaveBeenCalled();
  });

  it('creates once, sends no company id, inserts the row, and resets the form', () => {
    component.contacts.set([]);
    fillValidDraft(component);

    component.save();

    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.create).toHaveBeenCalledWith(
      'client-1',
      expect.not.objectContaining({ companyId: expect.anything() }),
    );
    expect(component.contacts()).toEqual([existing]);
    expect(component.draft.name).toBe('');
    expect(component.editing()).toBeNull();
  });

  it('prevents a duplicate request while saving', () => {
    const pending = new Subject<ClientContact>();
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

    expect(component.draft.name).toBe(' New Contact ');
    expect(component.error()).toContain('Could not save');
  });

  it('uses the same form for edit and returns to add mode after update', () => {
    const updated = { ...existing, name: 'Updated Contact' };
    api.update.mockReturnValue(of(updated));
    component.edit(existing);
    expect(component.draft.name).toBe(existing.name);
    component.draft.name = updated.name;

    component.save();

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(component.contacts()[0].name).toBe(updated.name);
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

  it('blocks wizard navigation while an inline contact is unfinished', () => {
    component.draft.name = 'Unfinished';

    expect(component.canLeaveStep()).toBe(false);
    expect(component.error()).toContain('Save the contact or cancel');

    component.add();
    expect(component.canLeaveStep()).toBe(true);
  });

  it('honors view and mutation permissions', () => {
    permissions.clear();
    fixture = TestBed.createComponent(ClientContactsComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('You do not have permission');
    expect(api.list).toHaveBeenCalledTimes(1);
  });
});

function fillValidDraft(component: ClientContactsComponent): void {
  Object.assign(component.draft, {
    type: 'General',
    name: ' New Contact ',
    relationship: ' Friend ',
    phone: '(612) 555-0199',
    email: ' new@example.test ',
    address: ' 20 Main Street ',
    isActive: true,
  } satisfies SaveClientContact);
}
