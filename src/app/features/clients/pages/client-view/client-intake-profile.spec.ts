import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientCaregiverApiService } from '../../data-access/client-caregiver-api.service';
import { ClientContactsApiService } from '../../data-access/client-contacts-api.service';
import { ClientCareCoordinatorApiService } from '../../data-access/client-care-coordinator-api.service';
import { ClientClinicalContactsApiService } from '../../data-access/client-clinical-contacts-api.service';
import { ClientResponsiblePartyApiService } from '../../data-access/client-responsible-party-api.service';
import { ClientHospitalizationApiService } from '../../data-access/client-hospitalization-api.service';
import { ClientIntakeProfileComponent } from './client-intake-profile';
import { AuthorizationService } from '../../../../core/authorization/authorization.service';

describe('ClientIntakeProfileComponent', () => {
  it('renders one requested section read-only and loads only that section API', async () => {
    const list = vi.fn().mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [ClientIntakeProfileComponent],
      providers: [
        { provide: AuthorizationService, useValue: { hasPermission: () => true } },
        { provide: ClientCaregiverApiService, useValue: { list } },
        { provide: ClientContactsApiService, useValue: { list } },
        { provide: ClientCareCoordinatorApiService, useValue: { list } },
        { provide: ClientClinicalContactsApiService, useValue: { list } },
        { provide: ClientResponsiblePartyApiService, useValue: { list } },
        { provide: ClientHospitalizationApiService, useValue: { list } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientIntakeProfileComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.componentRef.setInput('section', 'caregivers');
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Primary caregivers');
    expect(text).toContain('No primary caregivers available.');
    expect(text).not.toContain('Intake profile');
    expect((fixture.nativeElement as HTMLElement).querySelector('nav')).toBeNull();
    expect(text).not.toMatch(/Add|Edit|Delete/);
    expect(list).toHaveBeenCalledOnce();
  });

  it('distinguishes missing permission from an authorized empty result', async () => {
    const list = vi.fn().mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [ClientIntakeProfileComponent],
      providers: [
        { provide: AuthorizationService, useValue: { hasPermission: () => false } },
        { provide: ClientCaregiverApiService, useValue: { list } },
        { provide: ClientContactsApiService, useValue: { list } },
        { provide: ClientCareCoordinatorApiService, useValue: { list } },
        { provide: ClientClinicalContactsApiService, useValue: { list } },
        { provide: ClientResponsiblePartyApiService, useValue: { list } },
        { provide: ClientHospitalizationApiService, useValue: { list } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientIntakeProfileComponent);
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.componentRef.setInput('section', 'physicians');
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('This information is not available with your current permissions.');
    expect(text).not.toContain('No doctors available.');
    expect(list).not.toHaveBeenCalled();
  });
});
