import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permissions } from '../../../../core/authorization/permissions';
import { ClientListFilter, ClientListItem } from '../../models/client-design.models';

const CLIENTS: readonly ClientListItem[] = [
  {
    id: '1',
    firstName: 'Marcus',
    lastName: 'Lee',
    goesBy: 'Marc',
    pmi: '24591384',
    dateOfBirth: '1986-02-14',
    phone: '(612) 555-0142',
    email: 'marcus.lee@example.test',
    program: '245D',
    services: ['Individualized Home Supports'],
    location: 'Minneapolis',
    socDate: '2026-06-01',
    supervisor: 'Dana Morris',
    status: 'Active',
    onboarding: false,
    attentionCount: 1,
  },
  {
    id: '2',
    firstName: 'Olivia',
    lastName: 'Bennett',
    pmi: '30847219',
    dateOfBirth: '1993-08-27',
    phone: '(651) 555-0186',
    program: 'PCA Traditional',
    services: ['PCA'],
    location: 'St. Paul',
    socDate: '2026-07-15',
    supervisor: 'Renee Clark',
    status: 'Active',
    onboarding: true,
    attentionCount: 3,
  },
  {
    id: '3',
    firstName: 'Ethan',
    lastName: 'Walker',
    goesBy: 'Ethan',
    pmi: '17462053',
    dateOfBirth: '1978-11-09',
    phone: '(763) 555-0164',
    program: 'CFSS Agency',
    services: ['CFSS'],
    location: 'Brooklyn Park',
    socDate: '2026-04-10',
    supervisor: 'Dana Morris',
    status: 'Active',
    onboarding: false,
    attentionCount: 0,
  },
  {
    id: '4',
    firstName: 'Sophia',
    lastName: 'Ramirez',
    pmi: '61240735',
    dateOfBirth: '2001-03-22',
    phone: '(952) 555-0198',
    program: 'PCA Choice',
    services: ['PCA'],
    location: 'Bloomington',
    socDate: '2026-08-20',
    supervisor: 'Nora James',
    status: 'Pending',
    onboarding: true,
    attentionCount: 2,
  },
  {
    id: '5',
    firstName: 'Daniel',
    lastName: 'Morgan',
    pmi: '45012876',
    dateOfBirth: '1969-06-05',
    phone: '(612) 555-0127',
    program: '245D',
    services: ['Respite'],
    location: 'Minneapolis',
    socDate: '2025-12-01',
    supervisor: 'Renee Clark',
    status: 'Inactive',
    onboarding: false,
    attentionCount: 0,
  },
];

@Component({
  selector: 'app-client-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-list-page.html',
})
export class ClientListPageComponent {
  private readonly authorization = inject(AuthorizationService);

  readonly canCreateClient = computed(() =>
    this.authorization.hasPermission(Permissions.Client.Create)
  );

  readonly filter = signal<ClientListFilter>({
    search: '',
    status: 'all',
    program: 'all',
    location: 'all',
    onboarding: 'all',
  });

  readonly clients = signal(CLIENTS);
  readonly filteredClients = computed(() => {
    const filter = this.filter();
    const search = filter.search.trim().toLowerCase();

    return this.clients().filter((client) => {
      const matchesSearch = !search || [
        client.firstName,
        client.lastName,
        client.goesBy ?? '',
        client.pmi,
        client.phone,
        client.email ?? '',
        client.program,
        client.services.join(' '),
        client.supervisor,
      ].some((value) => value.toLowerCase().includes(search));

      return matchesSearch
        && (filter.status === 'all' || client.status === filter.status)
        && (filter.program === 'all' || client.program === filter.program)
        && (filter.location === 'all' || client.location === filter.location)
        && (filter.onboarding === 'all'
          || (filter.onboarding === 'yes' ? client.onboarding : !client.onboarding));
    });
  });

  readonly totalCount = computed(() => this.clients().length);
  readonly activeCount = computed(() => this.clients().filter((client) => client.status === 'Active').length);
  readonly onboardingCount = computed(() => this.clients().filter((client) => client.onboarding).length);
  readonly attentionCount = computed(() => this.clients().filter((client) => client.attentionCount > 0).length);

  readonly programs = computed(() => [...new Set(this.clients().map((client) => client.program))]);
  readonly locations = computed(() => [...new Set(this.clients().map((client) => client.location))]);

  updateSearch(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const search = event.target.value;
    this.filter.update((value) => ({ ...value, search }));
  }

  updateSelect(key: 'status' | 'program' | 'location' | 'onboarding', event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }

    const selectedValue = event.target.value;
    this.filter.update((value) => ({ ...value, [key]: selectedValue } as ClientListFilter));
  }

  clearFilters(): void {
    this.filter.set({
      search: '',
      status: 'all',
      program: 'all',
      location: 'all',
      onboarding: 'all',
    });
  }

  fullName(client: ClientListItem): string {
    return `${client.firstName} ${client.lastName}`;
  }

  initials(client: ClientListItem): string {
    return `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`;
  }

  statusClasses(status: ClientListItem['status']): string {
    switch (status) {
      case 'Active':
        return 'bg-green-50 text-success ring-green-200';
      case 'Pending':
        return 'bg-amber-50 text-warning ring-amber-200';
      case 'Discharged':
        return 'bg-rose-50 text-danger ring-rose-200';
      default:
        return 'bg-slate-100 text-text-muted ring-slate-200';
    }
  }
}
