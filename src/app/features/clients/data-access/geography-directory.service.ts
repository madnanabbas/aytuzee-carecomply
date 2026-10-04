import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GEOGRAPHY_BASE_URL } from '../../../core/config/app-config';

export interface CountryOption {
  readonly name: string;
  readonly code: string;
}
export interface StateOption {
  readonly name: string;
  readonly code: string;
}

interface ApiEnvelope<T> {
  readonly error: boolean;
  readonly data: T;
}

@Injectable({ providedIn: 'root' })
export class GeographyDirectoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(GEOGRAPHY_BASE_URL);

  countries(): Observable<readonly CountryOption[]> {
    return this.http
      .get<ApiEnvelope<readonly { name: string; Iso2: string }[]>>(`${this.baseUrl}/countries/iso`)
      .pipe(
        map((response) =>
          uniqueByCode(
            response.data.map((country) => ({ name: country.name, code: country.Iso2 })),
          ).sort(byName),
        ),
      );
  }

  states(country: string): Observable<readonly StateOption[]> {
    return this.http
      .post<ApiEnvelope<{ states: readonly { name: string; state_code: string }[] }>>(
        `${this.baseUrl}/countries/states`,
        { country },
      )
      .pipe(
        map((response) =>
          response.data.states
            .map((state) => ({ name: state.name, code: state.state_code }))
            .sort(byName),
        ),
      );
  }

  cities(country: string, state: string): Observable<readonly string[]> {
    return this.http
      .post<ApiEnvelope<readonly string[]>>(`${this.baseUrl}/countries/state/cities`, {
        country,
        state,
      })
      .pipe(map((response) => [...response.data].sort((left, right) => left.localeCompare(right))));
  }
}

function byName(left: { name: string }, right: { name: string }): number {
  return left.name.localeCompare(right.name);
}

function uniqueByCode<T extends { code: string }>(values: readonly T[]): T[] {
  return [
    ...new Map(
      values.filter((value) => value.code).map((value) => [value.code.toUpperCase(), value]),
    ).values(),
  ];
}
