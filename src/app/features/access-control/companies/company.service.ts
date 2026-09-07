import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../../../core/config/app-config';

export interface Company { readonly id: string; readonly name: string; readonly code: string; readonly isActive: boolean; readonly userCount: number; readonly clientCount: number; readonly editorVersion: string; }
export interface CompanyInput { readonly name: string; readonly code: string; readonly isActive?: boolean; readonly editorVersion?: string; }

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient); private readonly base = `${inject(API_BASE_URL)}/companies`;
  list() { return this.http.get<readonly Company[]>(this.base); }
  create(input: CompanyInput) { return this.http.post<Company>(this.base, input); }
  update(id: string, input: CompanyInput) { return this.http.put<Company>(`${this.base}/${id}`, input); }
  delete(id: string) { return this.http.delete<void>(`${this.base}/${id}`); }
}
