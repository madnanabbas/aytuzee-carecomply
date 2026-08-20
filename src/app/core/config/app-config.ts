import { InjectionToken, Provider } from '@angular/core';

export interface AppConfig {
  readonly apiBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<Readonly<AppConfig>>('APP_CONFIG');
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

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
  ];
}
