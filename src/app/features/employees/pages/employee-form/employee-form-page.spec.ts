import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { CompanyLookupService } from '../../../../core/lookups/company-lookup.service';
import { LocationLookupService } from '../../../../core/lookups/location-lookup.service';
import { EmployeeApiService } from '../../data-access/employee-api.service';
import { emptyEmployee } from '../../models/employee.models';
import { EmployeeFormPageComponent } from './employee-form-page';

describe('EmployeeFormPageComponent step persistence', () => {
  const employeeId = '0199aaff-0000-7000-8000-000000000001';
  const locationId = '0199aaff-0000-7000-8000-000000000002';
  const api = {
    create: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
  };
  const companies = { list: vi.fn(() => of([])) };

  function setup(
    editId: string | null = null,
    step: number | null = null,
    isPlatformAdministrator = false,
    firstName = '',
  ) {
    api.create.mockReset();
    api.update.mockReset();
    api.get.mockReset();
    companies.list.mockClear();
    api.create.mockReturnValue(of({ ...emptyEmployee(), id: employeeId }));
    api.update.mockReturnValue(of({ ...emptyEmployee(), id: employeeId }));
    api.get.mockReturnValue(
      of({ ...emptyEmployee(), id: employeeId, firstName, locationIds: [locationId] }),
    );
    TestBed.configureTestingModule({
      imports: [EmployeeFormPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(editId ? { employeeId: editId } : {}),
              queryParamMap: convertToParamMap(step === null ? {} : { step: String(step) }),
            },
          },
        },
        { provide: EmployeeApiService, useValue: api },
        { provide: CompanyLookupService, useValue: companies },
        {
          provide: AuthSessionService,
          useValue: {
            currentUser: () => ({ isPlatformAdministrator }),
          },
        },
        {
          provide: LocationLookupService,
          useValue: {
            list: () =>
              of([
                {
                  id: locationId,
                  companyId: 'company-1',
                  name: 'Main',
                  isMain: true,
                  isActive: true,
                },
              ]),
          },
        },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EmployeeFormPageComponent);
    const component = fixture.componentInstance;
    return { component, fixture, navigate };
  }

  it('creates on the first Next and resumes at the edit URL', () => {
    const { component, navigate } = setup();
    Object.assign(component.draft, {
      firstName: 'Taylor',
      lastName: 'Worker',
      email: 'taylor@example.test',
      jobTitle: 'Caregiver',
      hireDate: '2026-09-01',
      dateOfBirth: '1990-04-12',
      gender: 'Female',
      phone: '(612) 555-0102',
      streetAddress: '100 Main Street',
      ssn: '123456789',
    });

    component.next();

    expect(api.create).toHaveBeenCalledOnce();
    expect(api.update).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/employees', employeeId, 'edit'], {
      queryParams: { step: 1 },
      replaceUrl: true,
    });
  });

  it('does not request the platform company directory for a company user', () => {
    const { component } = setup();

    expect(companies.list).not.toHaveBeenCalled();
    expect(component.locations().map((location) => location.name)).toEqual(['Main']);
  });

  it('loads company choices for a platform administrator', () => {
    setup(null, null, true);

    expect(companies.list).toHaveBeenCalledOnce();
  });

  it('updates the same employee before advancing an existing wizard', () => {
    const { component, navigate } = setup(employeeId, 1);

    component.next();

    expect(api.update).toHaveBeenCalledWith(employeeId, component.draft);
    expect(api.create).not.toHaveBeenCalled();
    expect(component.step()).toBe(2);
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { step: 2 },
        replaceUrl: true,
      }),
    );
  });

  it('stays on the current step when saving fails', () => {
    const { component, navigate } = setup(employeeId, 1);
    api.update.mockReturnValue(
      throwError(() => ({
        error: { title: 'Validation failed', errors: { PreviousName: ['Enter a previous name.'] } },
      })),
    );

    component.next();

    expect(component.step()).toBe(1);
    expect(component.fieldError('previousName')).toBe('Enter a previous name.');
    expect(component.error()).toBe('Validation failed');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('populates an edit form from the employee response', () => {
    const { component } = setup(employeeId, null, false, 'Existing');

    expect(api.get).toHaveBeenCalledWith(employeeId);
    expect(component.draft.firstName).toBe('Existing');
    expect(component.draft.locationIds).toEqual([locationId]);
  });

  it('does not navigate or save when the current step is invalid', () => {
    const { component, navigate } = setup();

    component.next();

    expect(api.create).not.toHaveBeenCalled();
    expect(component.step()).toBe(0);
    expect(component.fieldError('firstName')).toBe('First name is required.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('handles lookup failures without failing page construction', () => {
    TestBed.resetTestingModule();
    companies.list.mockReturnValueOnce(throwError(() => new Error('lookup unavailable')));
    const { component } = setup(null, null, true);

    expect(component.companies()).toEqual([]);
  });

  it('retains Employee SSN digits without adding hyphens', () => {
    const { component } = setup();

    component.ssn('123456789');

    expect(component.draft.ssn).toBe('123456789');
  });

  it('normalizes a pasted formatted Employee SSN to nine digits', () => {
    const { component } = setup();

    component.ssn('123-45-6789');

    expect(component.draft.ssn).toBe('123456789');
  });

  it('removes alphabetic and punctuation characters from Employee SSN input', () => {
    const { component } = setup();

    component.ssn('ABC-!@#');

    expect(component.draft.ssn).toBe('');
  });

  it('limits Employee SSN input to nine digits', () => {
    const { component } = setup();

    component.ssn('1234567890123');

    expect(component.draft.ssn).toBe('123456789');
  });

  it('does not render EVV or IVR controls for create or edit', () => {
    for (const editId of [null, employeeId]) {
      TestBed.resetTestingModule();
      const { fixture } = setup(editId);
      fixture.detectChanges();
      const content = fixture.nativeElement.textContent as string;

      expect(content).not.toContain('EVV email');
      expect(content).not.toContain('EVV password');
      expect(content).not.toContain('IVR PIN');
      expect(content).not.toContain('EVV / IVR authorization');
    }
  });

  it('adds, edits and removes contacts', () => {
    const { component } = setup();
    Object.assign(component.contactDraft, {
      name: 'Pat',
      phone: '(612) 555-0100',
      relationship: 'Sibling',
    });
    expect(component.saveContact()).toBe(true);
    component.editContact(0);
    component.contactDraft.relationship = 'Parent';
    component.saveContact();
    expect(component.draft.contacts?.[0].relationship).toBe('Parent');
    component.removeContact(0);
    expect(component.draft.contacts).toEqual([]);
  });

  it('adds, edits and removes training records', () => {
    const { component } = setup();
    component.trainingDraft.trainingName = 'PCA certification';
    expect(component.saveTraining()).toBe(true);
    component.editTraining(0);
    component.trainingDraft.jobTitle = 'PCA';
    component.saveTraining();
    expect(component.training.trainings[0].jobTitle).toBe('PCA');
    component.removeTraining(0);
    expect(component.training.trainings).toEqual([]);
  });

  it('adds, edits and removes payer affiliations', () => {
    const { component } = setup();
    Object.assign(component.payerDraft, { company: 'Acme', payer: 'Plan' });
    component.savePayerAffiliation();
    component.editPayerAffiliation(0);
    component.payerDraft.payerId = 'P-1';
    component.savePayerAffiliation();
    expect(component.draft.payerAffiliations?.[0].payerId).toBe('P-1');
    component.removePayerAffiliation(0);
    expect(component.draft.payerAffiliations).toEqual([]);
  });

  it('adds, edits and removes background checks', () => {
    const { component } = setup();
    Object.assign(component.backgroundDraft, {
      licenseType: 'State identification',
      studyType: 'Criminal background study',
    });
    component.saveBackgroundCheck();
    component.editBackgroundCheck(0);
    component.backgroundDraft.received = true;
    component.backgroundDraft.receivedDate = '2026-09-01';
    component.saveBackgroundCheck();
    expect(component.background.checks[0].received).toBe(true);
    component.removeBackgroundCheck(0);
    expect(component.background.checks).toEqual([]);
  });
});
