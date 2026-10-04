import { loadAppConfig, parseAppConfig } from './app-config.loader';

describe('app configuration loader', () => {
  it.each([
    { value: '/api', expected: '/api' },
    { value: 'https://api.carecomply.example/api', expected: 'https://api.carecomply.example/api' },
    { value: 'http://localhost:5000/api', expected: 'http://localhost:5000/api' },
    { value: 'http://127.0.0.1:5000/api', expected: 'http://127.0.0.1:5000/api' },
  ])('should accept $value', ({ value, expected }) => {
    expect(
      parseAppConfig({
        apiBaseUrl: value,
        postalLookupBaseUrl: 'https://api.zippopotam.us',
        geographyBaseUrl: 'https://countriesnow.space/api/v0.1',
      }),
    ).toEqual({
      apiBaseUrl: expected,
      postalLookupBaseUrl: 'https://api.zippopotam.us',
      geographyBaseUrl: 'https://countriesnow.space/api/v0.1',
    });
  });

  it('should normalize trailing slashes', () => {
    expect(
      parseAppConfig({
        apiBaseUrl: 'https://api.carecomply.example/api/',
        postalLookupBaseUrl: 'https://api.zippopotam.us/',
        geographyBaseUrl: 'https://countriesnow.space/api/v0.1/',
      }),
    ).toEqual({
      apiBaseUrl: 'https://api.carecomply.example/api',
      postalLookupBaseUrl: 'https://api.zippopotam.us',
      geographyBaseUrl: 'https://countriesnow.space/api/v0.1',
    });
  });

  it.each([
    { name: 'an empty value', value: '' },
    { name: 'a missing API base URL', value: undefined },
    { name: 'a malformed URL', value: 'not-a-url' },
    { name: 'an external insecure HTTP URL', value: 'http://api.carecomply.example/api' },
    { name: 'credentials', value: 'https://user:password@api.carecomply.example/api' },
    { name: 'a query string', value: 'https://api.carecomply.example/api?source=frontend' },
    { name: 'a fragment', value: 'https://api.carecomply.example/api#clients' },
  ])('should reject $name', ({ value }) => {
    expect(() =>
      parseAppConfig({
        apiBaseUrl: value,
        postalLookupBaseUrl: 'https://api.zippopotam.us',
        geographyBaseUrl: 'https://countriesnow.space/api/v0.1',
      }),
    ).toThrow('Application configuration is unavailable.');
  });

  it('should reject a missing configuration file', async () => {
    const fetchConfig = vi.fn(async (): Promise<Response> => {
      throw new TypeError('Network error');
    });

    await expect(loadAppConfig(fetchConfig as typeof fetch)).rejects.toThrow(
      'Application configuration is unavailable.',
    );
  });

  it('should reject an unsuccessful configuration response', async () => {
    const fetchConfig = vi.fn(async () => createResponse({}, false));

    await expect(loadAppConfig(fetchConfig as typeof fetch)).rejects.toThrow(
      'Application configuration is unavailable.',
    );
  });

  it('should reject malformed JSON', async () => {
    const fetchConfig = vi.fn(async () => createMalformedResponse());

    await expect(loadAppConfig(fetchConfig as typeof fetch)).rejects.toThrow(
      'Application configuration is unavailable.',
    );
  });

  it('should load configuration without using the browser cache', async () => {
    const fetchConfig = vi.fn(async () =>
      createResponse({
        apiBaseUrl: '/api',
        postalLookupBaseUrl: 'https://api.zippopotam.us',
        geographyBaseUrl: 'https://countriesnow.space/api/v0.1',
      }),
    );

    await expect(loadAppConfig(fetchConfig as typeof fetch)).resolves.toEqual({
      apiBaseUrl: '/api',
      postalLookupBaseUrl: 'https://api.zippopotam.us',
      geographyBaseUrl: 'https://countriesnow.space/api/v0.1',
    });
    expect(fetchConfig).toHaveBeenCalledWith(expect.stringMatching(/\/config\/app-config\.json$/), {
      cache: 'no-store',
    });
  });
});

function createResponse(value: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn(async () => value),
  } as unknown as Response;
}

function createMalformedResponse(): Response {
  return {
    ok: true,
    json: vi.fn(async () => {
      throw new SyntaxError('Malformed JSON');
    }),
  } as unknown as Response;
}
