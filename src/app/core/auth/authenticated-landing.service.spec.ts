import { TestBed } from '@angular/core/testing';
import { NavigationService } from '../navigation/navigation.service';
import { AuthenticatedLandingService } from './authenticated-landing.service';

describe('AuthenticatedLandingService', () => {
  let landing: AuthenticatedLandingService;
  const navigation = { firstAllowedPath: vi.fn() };

  beforeEach(() => {
    navigation.firstAllowedPath.mockReset().mockReturnValue('/forbidden');
    TestBed.configureTestingModule({
      providers: [{ provide: NavigationService, useValue: navigation }],
    });
    landing = TestBed.inject(AuthenticatedLandingService);
  });

  it('should select the first backend-filtered navigation route', () => {
    navigation.firstAllowedPath.mockReturnValue('/dashboard');

    expect(landing.firstAllowedPath()).toBe('/dashboard');
  });

  it('should support non-dashboard users without role assumptions', () => {
    navigation.firstAllowedPath.mockReturnValue('/employees');

    expect(landing.firstAllowedPath()).toBe('/employees');
  });

  it('should fail closed when no application route is permitted', () => {
    expect(landing.firstAllowedPath()).toBe('/forbidden');
  });
});
