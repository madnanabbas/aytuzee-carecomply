import { InjectionToken, Provider } from '@angular/core';

export interface AppConfig {
  readonly apiBaseUrl: string;
  readonly postalLookupBaseUrl: string;
  readonly geographyBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<Readonly<AppConfig>>('APP_CONFIG');
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
export const POSTAL_LOOKUP_BASE_URL = new InjectionToken<string>('POSTAL_LOOKUP_BASE_URL');
export const GEOGRAPHY_BASE_URL = new InjectionToken<string>('GEOGRAPHY_BASE_URL');

export function provideAppConfig(config: Readonly<AppConfig>): Provider[] {
  return [
    {
      provide: APP_CONFIG,
      useValue: config,
    },
    {
      provide: API_BASE_URL,
      useFactory: (appConfig: Readonly<AppConfig>) => appConfig.apiBaseUrl,
      deps: [APP_CONFIG],
    },
    {
      provide: POSTAL_LOOKUP_BASE_URL,
      useFactory: (appConfig: Readonly<AppConfig>) => appConfig.postalLookupBaseUrl,
      deps: [APP_CONFIG],
    },
    {
      provide: GEOGRAPHY_BASE_URL,
      useFactory: (appConfig: Readonly<AppConfig>) => appConfig.geographyBaseUrl,
      deps: [APP_CONFIG],
    },
  ];
}
