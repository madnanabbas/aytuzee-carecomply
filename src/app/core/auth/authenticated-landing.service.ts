import { inject, Injectable } from '@angular/core';
import { AuthorizationService } from '../authorization/authorization.service';
import { APP_NAVIGATION_ORDER, canViewNavigationItem } from '../navigation/app-navigation';

@Injectable({
  providedIn: 'root',
})
export class AuthenticatedLandingService {
  private readonly authorization = inject(AuthorizationService);

  firstAllowedPath(): string {
    return (
      APP_NAVIGATION_ORDER.find((item) =>
        canViewNavigationItem(this.authorization, item),
      )?.route ?? '/forbidden'
    );
  }
}
