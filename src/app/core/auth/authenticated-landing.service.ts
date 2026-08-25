import { inject, Injectable } from '@angular/core';
import { NavigationService } from '../navigation/navigation.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticatedLandingService {
  private readonly navigation = inject(NavigationService);

  firstAllowedPath(): string {
    return this.navigation.firstAllowedPath();
  }
}
