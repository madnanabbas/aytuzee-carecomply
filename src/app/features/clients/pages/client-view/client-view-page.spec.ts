import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientCareCoordinatorApiService } from '../../data-access/client-care-coordinator-api.service';
import { ClientCaregiverApiService } from '../../data-access/client-caregiver-api.service';
import { ClientClinicalContactsApiService } from '../../data-access/client-clinical-contacts-api.service';
import { ClientContactsApiService } from '../../data-access/client-contacts-api.service';
import { ClientHospitalizationApiService } from '../../data-access/client-hospitalization-api.service';
import { ClientResponsiblePartyApiService } from '../../data-access/client-responsible-party-api.service';
import { ClientTodoApiService } from '../../data-access/client-todo-api.service';
import { ClientDetails } from '../../models/client-api.models';
import { ClientViewPageComponent } from './client-view-page';
import { toClientViewModel } from './client-view.models';

describe('ClientViewPageComponent record navigation', () => {
  const profileItems = [
    'Overview',
    'Primary caregivers',
    'Contacts',
    'Care coordinators',
    'Consultation providers',
    'Doctors',
    'Responsible parties',
    'Hospitalizations',
  ];
  const operationItems = [
    'Quick notes',
    'To-dos',
    'Service agreements',
    'Forms',
    'Documents',
    'Email logs',
    'Employee services',
  ];
  const details: ClientDetails = {
    id: 'client-1',
    firstName: 'Avery',
    middleName: 'Jordan',
    lastName: 'Northstar',
    preferredName: 'Avery',
    dateOfBirth: '1990-01-01',
    gender: 'Female',
    pmiNumber: '12345678',
    hasSsn: false,
    insuranceProvider: 'Northstar Health',
    email: 'avery@example.com',
    primaryPhone: '(612) 555-0100',
    secondaryPhone: '(612) 555-0101',
    intakeDate: '2025-12-01',
    socDate: '2026-01-01',
    referralSource: 'Hospital',
    status: 'Active',
    location: 'Bloomington',
    locationId: 'location-1',
    supervisorUserId: 'supervisor-1',
    supervisorName: 'Nora Nurse',
    isOnboarding: false,
    dischargeDate: null,
    dischargeReason: null,
    addressLine1: '100 Main Street',
    addressLine2: 'Apt 2',
    city: 'Minneapolis',
    state: 'MN',
    postalCode: '55401',
    county: 'Hennepin',
    country: 'United States',
    evvAuthorizedHoursPerWeek: null,
    safetyMeasures: null,
    specialEquipment: null,
    allergies: null,
    otherServices: null,
    additionalProfile: null,
    services: [],
    languages: [],
    editorVersion: 'a'.repeat(64),
  };

  async function createFixture(hasPermission = () => true) {
    const relatedList = vi.fn(() => of([]));
    await TestBed.configureTestingModule({
      imports: [ClientViewPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ clientId: details.id }) } },
        },
        { provide: AuthorizationService, useValue: { hasPermission } },
        {
          provide: ClientApiService,
          useValue: { getClient: () => of(details), listClientServiceAgreements: relatedList },
        },
        {
          provide: ClientTodoApiService,
          useValue: { list: () => of([]), assignees: () => of([]) },
        },
        { provide: ClientCaregiverApiService, useValue: { list: relatedList } },
        { provide: ClientContactsApiService, useValue: { list: relatedList } },
        { provide: ClientCareCoordinatorApiService, useValue: { list: relatedList } },
        { provide: ClientClinicalContactsApiService, useValue: { list: relatedList } },
        { provide: ClientResponsiblePartyApiService, useValue: { list: relatedList } },
        { provide: ClientHospitalizationApiService, useValue: { list: relatedList } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientViewPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, relatedList };
  }

  function railGroups(element: HTMLElement): { label: string; items: string[] }[] {
    return Array.from(element.querySelectorAll<HTMLElement>('.client-record-nav-group')).map(
      (group) => ({
        label: group.querySelector('.client-record-nav-label')?.textContent?.trim() ?? '',
        items: Array.from(group.querySelectorAll<HTMLButtonElement>('.client-record-nav-item')).map(
          (item) => item.textContent?.trim() ?? '',
        ),
      }),
    );
  }

  function selectRailItem(element: HTMLElement, label: string): void {
    const item = Array.from(
      element.querySelectorAll<HTMLButtonElement>('.client-record-nav-item'),
    ).find((button) => button.textContent?.trim() === label);
    expect(item).toBeTruthy();
    item!.click();
  }

  it('replaces all grouped horizontal tabs with the two-group vertical record rail', async () => {
    const { fixture } = await createFixture();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('aside[aria-label="Client record navigation"]')).toBeTruthy();
    expect(railGroups(element)).toEqual([
      { label: 'Client profile', items: profileItems },
      { label: 'Operations', items: operationItems },
    ]);
    expect(element.querySelector('.client-primary-tabs')).toBeNull();
    expect(element.querySelector('.client-secondary-tabs')).toBeNull();
    expect(element.querySelector('nav[aria-label="Client primary sections"]')).toBeNull();
    expect(element.querySelector('nav[aria-label="Client section navigation"]')).toBeNull();
    expect(element.querySelector('.client-record-rail .overflow-x-auto')).toBeNull();
    expect(element.querySelector('.client-mobile-section .overflow-x-auto')).toBeNull();
    expect(railGroups(element).flatMap((group) => group.items)).not.toContain('Care team');
    expect(railGroups(element).flatMap((group) => group.items)).not.toContain('Clinical');
  });

  it('provides the same grouped navigation through a compact mobile selector', async () => {
    const { fixture } = await createFixture();
    const element = fixture.nativeElement as HTMLElement;
    const selector = element.querySelector<HTMLSelectElement>('#client-view-section');

    expect(selector).toBeTruthy();
    expect(
      Array.from(selector!.querySelectorAll('optgroup')).map((group) => ({
        label: group.label,
        items: Array.from(group.querySelectorAll('option')).map((option) => option.textContent),
      })),
    ).toEqual([
      { label: 'Client profile', items: profileItems },
      { label: 'Operations', items: operationItems },
    ]);

    selector!.value = 'hospitalizations';
    selector!.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('app-client-intake-profile h2')?.textContent?.trim()).toBe(
      'Hospitalizations',
    );
  });

  it.each([
    ['Overview', 'Client information'],
    ['Primary caregivers', 'Primary caregivers'],
    ['Contacts', 'Contacts'],
    ['Care coordinators', 'Care coordinators'],
    ['Consultation providers', 'Consultation providers'],
    ['Doctors', 'Doctors'],
    ['Responsible parties', 'Responsible parties'],
    ['Hospitalizations', 'Hospitalizations'],
    ['Quick notes', 'Quick Notes'],
    ['To-dos', 'To-dos'],
    ['Service agreements', 'Service Agreements'],
    ['Forms', 'Forms'],
    ['Documents', 'Documents'],
    ['Email logs', 'Email Logs'],
    ['Employee services', 'Employee Services / Care Team'],
  ])('selecting %s renders its focused content', async (navigationLabel, heading) => {
    const { fixture } = await createFixture();
    const element = fixture.nativeElement as HTMLElement;

    selectRailItem(element, navigationLabel);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const headings = Array.from(
      element.querySelectorAll<HTMLElement>('.client-record-content h2'),
    ).map((item) => item.textContent?.trim());
    expect(headings).toContain(heading);
  });

  it('keeps profile related sections read-only and Edit client unchanged', async () => {
    const { fixture } = await createFixture();
    const element = fixture.nativeElement as HTMLElement;
    const editLink = Array.from(element.querySelectorAll('a')).find((link) =>
      link.textContent?.includes('Edit client'),
    );

    expect(editLink?.getAttribute('href')).toBe('/clients/client-1/edit');
    selectRailItem(element, 'Contacts');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('app-client-intake-profile button')).toBeNull();
    expect(element.querySelector('app-client-intake-profile')?.textContent).not.toMatch(
      /Add|Edit|Delete/,
    );
  });

  it('keeps Overview summary-only and does not eagerly load related records', async () => {
    const { fixture, relatedList } = await createFixture();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-client-view-overview')).toBeTruthy();
    expect(element.querySelector('app-client-intake-profile')).toBeNull();
    expect(relatedList).not.toHaveBeenCalled();
  });

  it('renders the authoritative backend location and assigned supervisor name', async () => {
    const { fixture } = await createFixture();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Bloomington');
    expect(element.textContent).toContain('Nora Nurse');
    expect(element.textContent).not.toContain('Managed through Employee Services');
  });

  it('uses the employee-services fallback only when no direct supervisor is assigned', () => {
    const unassigned = toClientViewModel({
      ...details,
      supervisorUserId: null,
      supervisorName: null,
    });
    const assignedWithoutAResolvedName = toClientViewModel({
      ...details,
      supervisorUserId: 'supervisor-1',
      supervisorName: null,
    });

    expect(unassigned.supervisor).toBe('Managed through Employee Services');
    expect(assignedWithoutAResolvedName.supervisor).toBe('—');
    expect(unassigned.location).toBe('Bloomington');
  });

  it('does not show unavailable operations in either navigation control', async () => {
    const { fixture } = await createFixture(() => false);
    const element = fixture.nativeElement as HTMLElement;

    expect(railGroups(element)).toEqual([{ label: 'Client profile', items: profileItems }]);
    expect(element.querySelector('optgroup[label="Operations"]')).toBeNull();
  });
});
