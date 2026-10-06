import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { POSTAL_LOOKUP_BASE_URL } from '../../../core/config/app-config';

interface ZippopotamPlace {
  readonly 'place name': string;
  readonly state: string;
  readonly 'state abbreviation': string;
  readonly county?: string;
  readonly district?: string;
  readonly region?: string;
}

interface ZippopotamResponse {
  readonly country: string;
  readonly 'country abbreviation': string;
  readonly places: readonly ZippopotamPlace[];
}

export interface PostalAddressMatch {
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly countryCode: string;
  readonly area: string | null;
}

@Injectable({ providedIn: 'root' })
export class PostalLookupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(POSTAL_LOOKUP_BASE_URL);

  lookupPostalCode(countryCode: string, postalCode: string): Observable<PostalAddressMatch | null> {
    const normalizedPostalCode =
      countryCode.toUpperCase() === 'US'
        ? postalCode.replace(/\D/g, '').slice(0, 5)
        : postalCode.trim();
    return this.http
      .get<ZippopotamResponse>(
        `${this.baseUrl}/${encodeURIComponent(countryCode.toLowerCase())}/${encodeURIComponent(normalizedPostalCode)}`,
      )
      .pipe(map((response) => mapPostalResponse(response)));
  }
}

function mapPostalResponse(response: ZippopotamResponse): PostalAddressMatch | null {
  const place = response.places[0];
  if (!place) return null;

  const city = place['place name']?.trim();
  const state = (place.state || place['state abbreviation'])?.trim();
  const country = response.country?.trim();
  const countryCode = response['country abbreviation']?.trim().toUpperCase();
  const area = (place.county || place.district || place.region)?.trim() || null;
  return city && state && country && countryCode
    ? { city, state, country, countryCode, area }
    : null;
}
