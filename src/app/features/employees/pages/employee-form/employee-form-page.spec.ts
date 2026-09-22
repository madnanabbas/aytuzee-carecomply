import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { CompanyService } from '../../../access-control/companies/company.service';
import { LocationService } from '../../../access-control/companies/location.service';
import { EmployeeApiService, emptyEmployee } from '../../data-access/employee-api.service';
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

  function setup(editId: string | null = null, step: number | null = null, isPlatformAdministrator = false) {
    api.create.mockReset();
    api.update.mockReset();
    api.get.mockReset();
    companies.list.mockClear();
    api.create.mockReturnValue(of({ ...emptyEmployee(), id: employeeId }));
    api.update.mockReturnValue(of({ ...emptyEmployee(), id: employeeId }));
    api.get.mockReturnValue(of({ ...emptyEmployee(), id: employeeId, locationIds: [locationId] }));
    TestBed.configureTestingModule({
      imports: [EmployeeFormPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: {
          snapshot: {
            paramMap: convertToParamMap(editId ? { employeeId: editId } : {}),
            queryParamMap: convertToParamMap(step === null ? {} : { step: String(step) }),
          },
        } },
        { provide: EmployeeApiService, useValue: api },
        { provide: CompanyService, useValue: companies },
        { provide: AuthSessionService, useValue: {
          currentUser: () => ({ isPlatformAdministrator }),
        } },
        { provide: LocationService, useValue: { list: () => of([{
          id: locationId, companyId: 'company-1', name: 'Main', isMain: true, isActive: true,
        }]) } },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = TestBed.createComponent(EmployeeFormPageComponent).componentInstance;
    return { component, navigate };
  }

  it('creates on the first Next and resumes at the edit URL', () => {
    const { component, navigate } = setup();
    Object.assign(component.draft, {
      firstName: 'Taylor', lastName: 'Worker', email: 'taylor@example.test',
      jobTitle: 'Caregiver', hireDate: '2026-09-01', dateOfBirth: '1990-04-12',
      gender: 'Female', phone: '(612) 555-0102', streetAddress: '100 Main Street',
      ssn: '123-45-6789',
    });

    component.next();

    expect(api.create).toHaveBeenCalledOnce();
    expect(api.update).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/employees', employeeId, 'edit'], {
      queryParams: { step: 1 }, replaceUrl: true,
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
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { step: 2 }, replaceUrl: true,
    }));
  });

  it('stays on the current step when saving fails', () => {
    const { component, navigate } = setup(employeeId, 1);
    api.update.mockReturnValue(throwError(() => ({
      error: { title: 'Validation failed', errors: { PreviousName: ['Enter a previous name.'] } },
    })));

    component.next();

    expect(component.step()).toBe(1);
    expect(component.fieldError('previousName')).toBe('Enter a previous name.');
    expect(component.error()).toBe('Validation failed');
    expect(navigate).not.toHaveBeenCalled();
  });
});
