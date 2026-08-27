import { Injectable } from '@angular/core';
import { NavigationModuleItem } from '../models/module-feature.models';

@Injectable({ providedIn: 'root' })
export class ModuleFeatureDesignService {
  // UI-only fixture. Replace this service with the management API after design approval.
  getModules(): readonly NavigationModuleItem[] {
    return [
     
    ];
  }
}
