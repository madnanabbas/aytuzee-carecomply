import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, APP_CONFIG, AppConfig, provideAppConfig } from './app-config';

describe('provideAppConfig', () => {
  const config: Readonly<AppConfig> = {
    apiBaseUrl: '/api',
    postalLookupBaseUrl: 'https://api.zippopotam.us',
    geographyBaseUrl: 'https://countriesnow.space/api/v0.1',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: provideAppConfig(config),
    });
  });

  it('should provide the application configuration', () => {
    expect(TestBed.inject(APP_CONFIG)).toBe(config);
  });

  it('should provide the API base URL from the application configuration', () => {
    expect(TestBed.inject(API_BASE_URL)).toBe('/api');
  });

  it('should allow the application configuration to be overridden in tests', () => {
    TestBed.overrideProvider(APP_CONFIG, {
      useValue: { apiBaseUrl: '/test-api', postalLookupBaseUrl: 'https://postal.example.test', geographyBaseUrl: 'https://geography.example.test' } satisfies AppConfig,
    });

    expect(TestBed.inject(API_BASE_URL)).toBe('/test-api');
  });
});
