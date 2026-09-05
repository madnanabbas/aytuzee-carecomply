import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/app-config';
import {
  NavigationFeatureRequest,
  NavigationModuleItem,
  NavigationModuleRequest,
  NavigationMutationResponse,
} from '../models/module-feature.models';

@Injectable({ providedIn: 'root' })
export class ModuleFeatureApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly basePath = 'access-management/navigation-management';

  list(): Observable<readonly NavigationModuleItem[]> {
    return this.http.get<readonly NavigationModuleItem[]>(`${this.apiBaseUrl}/${this.basePath}`);
  }

  createModule(request: NavigationModuleRequest): Observable<NavigationMutationResponse> {
    return this.http.post<NavigationMutationResponse>(`${this.apiBaseUrl}/${this.basePath}/modules`, request);
  }

  updateModule(moduleId: number, request: NavigationModuleRequest): Observable<NavigationMutationResponse> {
    return this.http.put<NavigationMutationResponse>(`${this.apiBaseUrl}/${this.basePath}/modules/${moduleId}`, request);
  }

  deleteModule(moduleId: number): Observable<NavigationMutationResponse> {
    return this.http.delete<NavigationMutationResponse>(`${this.apiBaseUrl}/${this.basePath}/modules/${moduleId}`);
  }

  createFeature(request: NavigationFeatureRequest): Observable<NavigationMutationResponse> {
    return this.http.post<NavigationMutationResponse>(`${this.apiBaseUrl}/${this.basePath}/features`, request);
  }

  updateFeature(featureId: number, request: NavigationFeatureRequest): Observable<NavigationMutationResponse> {
    return this.http.put<NavigationMutationResponse>(`${this.apiBaseUrl}/${this.basePath}/features/${featureId}`, request);
  }

  deleteFeature(featureId: number): Observable<NavigationMutationResponse> {
    return this.http.delete<NavigationMutationResponse>(`${this.apiBaseUrl}/${this.basePath}/features/${featureId}`);
  }
}
