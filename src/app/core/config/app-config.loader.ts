import { AppConfig } from './app-config';

const APP_CONFIG_PATH = 'config/app-config.json';
const CONFIGURATION_ERROR_MESSAGE = 'Application configuration is unavailable.';

export async function loadAppConfig(
  fetchConfig: typeof fetch = globalThis.fetch,
): Promise<Readonly<AppConfig>> {
  let response: Response;

  try {
    const configUrl = new URL(APP_CONFIG_PATH, document.baseURI).toString();
    response = await fetchConfig(configUrl, { cache: 'no-store' });
  } catch {
    throw configurationError();
  }

  if (!response.ok) {
    throw configurationError();
  }

  let value: unknown;

  try {
    value = await response.json();
  } catch {
    throw configurationError();
  }

  return parseAppConfig(value);
}

export function parseAppConfig(value: unknown): Readonly<AppConfig> {
  const allowedKeys = new Set(['apiBaseUrl', 'postalLookupBaseUrl', 'geographyBaseUrl']);
  if (!isRecord(value) || Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw configurationError();
  }

  if (typeof value['apiBaseUrl'] !== 'string' || typeof value['postalLookupBaseUrl'] !== 'string' || typeof value['geographyBaseUrl'] !== 'string') {
    throw configurationError();
  }

  const apiBaseUrl = normalizeApiBaseUrl(value['apiBaseUrl']);
  const postalLookupBaseUrl = normalizeApiBaseUrl(value['postalLookupBaseUrl']);
  const geographyBaseUrl = normalizeApiBaseUrl(value['geographyBaseUrl']);

  return Object.freeze({ apiBaseUrl, postalLookupBaseUrl, geographyBaseUrl });
}

function normalizeApiBaseUrl(value: string): string {
  const candidate = value.trim();

  if (!candidate) {
    throw configurationError();
  }

  if (/\s/.test(candidate) || candidate.includes('\\')) {
    throw configurationError();
  }

  if (candidate.startsWith('/')) {
    if (candidate.startsWith('//')) {
      throw configurationError();
    }

    const parsed = new URL(candidate, document.baseURI);
    validateUrlParts(parsed);
    return removeTrailingSlash(candidate);
  }

  if (!/^https?:\/\//i.test(candidate)) {
    throw configurationError();
  }

  let parsed: URL;

  try {
    parsed = new URL(candidate);
  } catch {
    throw configurationError();
  }

  validateUrlParts(parsed);

  if (parsed.protocol === 'http:' && !isLocalDevelopmentHost(parsed.hostname)) {
    throw configurationError();
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw configurationError();
  }

  return removeTrailingSlash(candidate);
}

function validateUrlParts(url: URL): void {
  if (url.username || url.password || url.search || url.hash) {
    throw configurationError();
  }
}

function isLocalDevelopmentHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function removeTrailingSlash(value: string): string {
  return value.length > 1 ? value.replace(/\/+$/, '') : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function configurationError(): Error {
  return new Error(CONFIGURATION_ERROR_MESSAGE);
}
