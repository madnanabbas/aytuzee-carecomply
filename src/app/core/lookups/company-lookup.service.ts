import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/app-config';

export interface Company {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly isActive: boolean;
  readonly userCount: number;
  readonly clientCount: number;
  readonly editorVersion: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyLookupService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/companies`;

  list() {
    return this.http.get<readonly Company[]>(this.base);
  }
}
