import { Component, DestroyRef, inject, Input, OnChanges, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { ClientCaregiverApiService } from '../../data-access/client-caregiver-api.service';
import { ClientContactsApiService } from '../../data-access/client-contacts-api.service';
import { ClientCareCoordinatorApiService } from '../../data-access/client-care-coordinator-api.service';
import {
  ClientClinicalContactsApiService,
  ClinicalContact,
} from '../../data-access/client-clinical-contacts-api.service';
import { ClientResponsiblePartyApiService } from '../../data-access/client-responsible-party-api.service';
import { ClientHospitalizationApiService } from '../../data-access/client-hospitalization-api.service';
import { ClientCaregiver } from '../../models/client-caregiver.models';
import { ClientContact } from '../../data-access/client-contacts-api.service';
import { CareCoordinator } from '../../data-access/client-care-coordinator-api.service';
import { ResponsibleParty } from '../../data-access/client-responsible-party-api.service';
import { ClientHospitalization } from '../../models/client-hospitalization.models';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';
import { Permission, Permissions } from '../../../../core/authorization/permissions';

export type ClientIntakeSection =
  | 'caregivers'
  | 'contacts'
  | 'coordinators'
  | 'providers'
  | 'physicians'
  | 'responsible-parties'
  | 'hospitalizations';

@Component({
  selector: 'app-client-intake-profile',
  standalone: true,
  templateUrl: './client-intake-profile.html',
  styleUrl: './client-view-page.css',
})
export class ClientIntakeProfileComponent implements OnChanges {
  @Input({ required: true }) clientId = '';
  @Input({ required: true }) section: ClientIntakeSection = 'caregivers';

  private readonly caregiversApi = inject(ClientCaregiverApiService);
  private readonly contactsApi = inject(ClientContactsApiService);
  private readonly coordinatorsApi = inject(ClientCareCoordinatorApiService);
  private readonly clinicalApi = inject(ClientClinicalContactsApiService);
  private readonly responsiblePartiesApi = inject(ClientResponsiblePartyApiService);
  private readonly hospitalizationsApi = inject(ClientHospitalizationApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authorization = inject(AuthorizationService);

  readonly loading = signal(false);
  readonly caregivers = signal<readonly ClientCaregiver[]>([]);
  readonly contacts = signal<readonly ClientContact[]>([]);
  readonly coordinators = signal<readonly CareCoordinator[]>([]);
  readonly providers = signal<readonly ClinicalContact[]>([]);
  readonly physicians = signal<readonly ClinicalContact[]>([]);
  readonly responsibleParties = signal<readonly ResponsibleParty[]>([]);
  readonly hospitalizations = signal<readonly ClientHospitalization[]>([]);

  canView(): boolean {
    return this.authorization.hasPermission(this.permissionFor(this.section));
  }

  sectionLabel(): string {
    switch (this.section) {
      case 'caregivers':
        return 'Primary caregivers';
      case 'contacts':
        return 'Contacts';
      case 'coordinators':
        return 'Care coordinators';
      case 'providers':
        return 'Consultation providers';
      case 'physicians':
        return 'Doctors';
      case 'responsible-parties':
        return 'Responsible parties';
      case 'hospitalizations':
        return 'Hospitalizations';
    }
  }

  ngOnChanges(): void {
    if (this.clientId) this.load();
  }

  private load(): void {
    this.loading.set(true);
    const canView = this.canView();
    forkJoin({
      caregivers:
        canView && this.section === 'caregivers'
          ? this.caregiversApi.list(this.clientId).pipe(catchError(() => of([])))
          : of([]),
      contacts:
        canView && this.section === 'contacts'
          ? this.contactsApi.list(this.clientId).pipe(catchError(() => of([])))
          : of([]),
      coordinators:
        canView && this.section === 'coordinators'
          ? this.coordinatorsApi.list(this.clientId).pipe(catchError(() => of([])))
          : of([]),
      providers:
        canView && this.section === 'providers'
          ? this.clinicalApi
              .list(this.clientId, 'consultation-providers')
              .pipe(catchError(() => of([])))
          : of([]),
      physicians:
        canView && this.section === 'physicians'
          ? this.clinicalApi.list(this.clientId, 'physicians').pipe(catchError(() => of([])))
          : of([]),
      responsibleParties:
        canView && this.section === 'responsible-parties'
          ? this.responsiblePartiesApi.list(this.clientId).pipe(catchError(() => of([])))
          : of([]),
      hospitalizations:
        canView && this.section === 'hospitalizations'
          ? this.hospitalizationsApi.list(this.clientId).pipe(catchError(() => of([])))
          : of([]),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.caregivers.set(result.caregivers);
        this.contacts.set(result.contacts);
        this.coordinators.set(result.coordinators);
        this.providers.set(result.providers);
        this.physicians.set(result.physicians);
        this.responsibleParties.set(result.responsibleParties);
        this.hospitalizations.set(result.hospitalizations);
        this.loading.set(false);
      });
  }

  private permissionFor(section: ClientIntakeSection): Permission {
    switch (section) {
      case 'caregivers':
        return Permissions.ClientCaregiver.View;
      case 'contacts':
        return Permissions.ClientContact.View;
      case 'coordinators':
        return Permissions.ClientCareCoordinator.View;
      case 'providers':
        return Permissions.ClientConsultationProvider.View;
      case 'physicians':
        return Permissions.ClientPhysician.View;
      case 'responsible-parties':
        return Permissions.ClientResponsibleParty.View;
      case 'hospitalizations':
        return Permissions.ClientHospitalization.View;
    }
  }
}
