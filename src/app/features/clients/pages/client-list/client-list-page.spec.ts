import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientApiService } from '../../data-access/client-api.service';
import { ClientListResponse } from '../../models/client-api.models';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { CompanyLookupService } from '../../../../core/lookups/company-lookup.service';
import { ClientListPageComponent } from './client-list-page';

describe('ClientListPageComponent', () => {
  const queryParams = new BehaviorSubject(convertToParamMap({}));
  const api = {
    listClients: vi.fn(),
    createGuestInvitation: vi.fn(),
    sendGuestInvitation: vi.fn(),
  };

  beforeEach(() => {
    queryParams.next(convertToParamMap({}));
    api.listClients.mockReset();
    api.listClients.mockReturnValue(of(clientListResponse()));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'clients/:clientId/edit', component: EditRouteStubComponent }]),
        { provide: ClientApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
        {
          provide: AuthSessionService,
          useValue: { currentUser: () => ({ isPlatformAdministrator: false }) },
        },
        { provide: CompanyLookupService, useValue: { list: () => of([]) } },
      ],
    });
  });

  it('shows the Edit action with Client.Edit and navigates to the existing edit route', async () => {
    TestBed.inject(AuthorizationService).setPermissions([
      Permissions.Client.View,
      Permissions.Client.Edit,
    ]);

    const fixture = TestBed.createComponent(ClientListPageComponent);
    fixture.detectChanges();

    const edit = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      'a[aria-label="Edit client Avery Northstar"]',
    );
    expect(edit).not.toBeNull();
    expect(edit?.getAttribute('href')).toBe('/clients/client-1/edit');
    expect(edit?.title).toBe('Edit Client');

    edit?.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/clients/client-1/edit');
  });

  it('hides the Edit action without Client.Edit', () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.Client.View]);

    const fixture = TestBed.createComponent(ClientListPageComponent);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'a[aria-label="Edit client Avery Northstar"]',
      ),
    ).toBeNull();
  });

  it('shows G-Link beside the unchanged New client action only with its permission', () => {
    TestBed.inject(AuthorizationService).setPermissions([
      Permissions.Client.View,
      Permissions.Client.Create,
      Permissions.Client.GuestInvite,
    ]);
    const fixture = TestBed.createComponent(ClientListPageComponent);
    fixture.detectChanges();
    const actions = (fixture.nativeElement as HTMLElement).querySelector('header div.flex-wrap');
    expect(actions?.textContent).toContain('G-Link');
    expect(actions?.textContent).toContain('New client');
    expect(actions?.querySelector('a')?.getAttribute('href')).toBe('/clients/new');

    actions?.querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.guestInvitationDialogOpen()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('hides G-Link without Client.GuestInvite', () => {
    TestBed.inject(AuthorizationService).setPermissions([
      Permissions.Client.View,
      Permissions.Client.Create,
    ]);
    const fixture = TestBed.createComponent(ClientListPageComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('G-Link');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('New client');
  });
});

@Component({ template: '', standalone: true })
class EditRouteStubComponent {}

function clientListResponse(): ClientListResponse {
  return {
    items: [
      {
        id: 'client-1',
        displayName: 'Avery Northstar',
        preferredName: 'Avery',
        pmiNumber: '39032647',
        dateOfBirth: '1988-01-06',
        gender: 'Male',
        status: 'Active',
        location: 'Main',
        socDate: '2026-09-01',
        isOnboarding: false,
        programType: 'Two45D',
        updatedAtUtc: '2026-09-29T00:00:00Z',
        services: [],
      },
    ],
    availableLocations: ['Main'],
    pageNumber: 1,
    pageSize: 25,
    totalCount: 1,
    totalPages: 1,
  };
}
