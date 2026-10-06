import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../../../core/config/app-config';
import { employeeFormToRequest } from '../models/employee-form.mapper';
import { EmployeeDto, EmployeeFormModel, EmployeeListResponse } from '../models/employee.models';

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/employees`;

  list(search = '', page = 1, pageSize = 25) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<EmployeeListResponse>(this.baseUrl, { params });
  }

  get(id: string) {
    return this.http.get<EmployeeDto>(`${this.baseUrl}/${id}`);
  }
  create(value: EmployeeFormModel) {
    return this.http.post<EmployeeDto>(this.baseUrl, employeeFormToRequest(value));
  }
  update(id: string, value: EmployeeFormModel) {
    return this.http.put<EmployeeDto>(`${this.baseUrl}/${id}`, employeeFormToRequest(value));
  }
}
