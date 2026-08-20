import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AppConfig, provideAppConfig } from './core/config/app-config';
import { AuthSessionService } from './core/auth/auth-session.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export function createAppConfig(config: Readonly<AppConfig>): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideRouter(routes),
      ...provideAppConfig(config),
      provideAppInitializer(() => inject(AuthSessionService).initialize()),
    ],
  };
}
