import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../../../core/config/app-config';
import { CompanyLookupService } from '../../../core/lookups/company-lookup.service';
import type { Company } from '../../../core/lookups/company-lookup.service';

export type { Company } from '../../../core/lookups/company-lookup.service';
export interface CompanyInput {
  readonly name: string;
  readonly code: string;
  readonly isActive?: boolean;
  readonly editorVersion?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly lookup = inject(CompanyLookupService);
  private readonly base = `${inject(API_BASE_URL)}/companies`;
  list() {
    return this.lookup.list();
  }
  create(input: CompanyInput) {
    return this.http.post<Company>(this.base, input);
  }
  update(id: string, input: CompanyInput) {
    return this.http.put<Company>(`${this.base}/${id}`, input);
  }
  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
