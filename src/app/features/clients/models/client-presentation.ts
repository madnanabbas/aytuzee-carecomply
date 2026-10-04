import { ClientGenderCode, ClientProgramTypeCode, ClientStatusCode } from './client-api.models';

const STATUS_LABELS: Readonly<Record<number, string>> = {
  [ClientStatusCode.Pending]: 'Pending',
  [ClientStatusCode.Active]: 'Active',
  [ClientStatusCode.OnHold]: 'On hold',
  [ClientStatusCode.Discharged]: 'Discharged',
  [ClientStatusCode.Inactive]: 'Inactive',
};

const GENDER_LABELS: Readonly<Record<number, string>> = {
  [ClientGenderCode.Unknown]: 'Unknown',
  [ClientGenderCode.Female]: 'Female',
  [ClientGenderCode.Male]: 'Male',
  [ClientGenderCode.NonBinary]: 'Non-binary',
  [ClientGenderCode.Other]: 'Other',
  [ClientGenderCode.PreferNotToSay]: 'Prefer not to say',
};

const PROGRAM_LABELS: Readonly<Record<number, string>> = {
  [ClientProgramTypeCode.None]: '—',
  [ClientProgramTypeCode.PcaTraditional]: 'PCA Traditional',
  [ClientProgramTypeCode.PcaChoice]: 'PCA Choice',
  [ClientProgramTypeCode.Two45D]: '245D',
  [ClientProgramTypeCode.CfssAgency]: 'CFSS Agency',
  [ClientProgramTypeCode.CfssBudget]: 'CFSS Budget',
};

export function clientStatusLabel(value: ClientStatusCode | string): string {
  if (typeof value === 'number') return STATUS_LABELS[value] ?? 'Unknown';
  return normalizeEnumText(value);
}

export function clientGenderLabel(value: ClientGenderCode | string): string {
  if (typeof value === 'number') return GENDER_LABELS[value] ?? 'Unknown';
  return normalizeEnumText(value);
}

export function clientProgramLabel(value: ClientProgramTypeCode | string): string {
  if (typeof value === 'number') return PROGRAM_LABELS[value] ?? '—';
  switch (
    value
      .trim()
      .replace(/[\s_-]/g, '')
      .toLowerCase()
  ) {
    case 'pcatraditional':
      return 'PCA Traditional';
    case 'pcachoice':
      return 'PCA Choice';
    case 'two45d':
    case '245d':
      return '245D';
    case 'cfssagency':
      return 'CFSS Agency';
    case 'cfssbudget':
      return 'CFSS Budget';
    case 'none':
      return '—';
    default:
      return addWordBreaks(value);
  }
}

export function clientStatusCode(value: string): ClientStatusCode {
  switch (value.trim().toLowerCase()) {
    case 'pending':
      return ClientStatusCode.Pending;
    case 'active':
      return ClientStatusCode.Active;
    case 'on hold':
    case 'onhold':
      return ClientStatusCode.OnHold;
    case 'discharged':
      return ClientStatusCode.Discharged;
    case 'inactive':
      return ClientStatusCode.Inactive;
    default:
      return ClientStatusCode.Pending;
  }
}

export function clientGenderCode(value: string): ClientGenderCode {
  switch (value.trim().toLowerCase()) {
    case 'female':
      return ClientGenderCode.Female;
    case 'male':
      return ClientGenderCode.Male;
    case 'non-binary':
    case 'nonbinary':
      return ClientGenderCode.NonBinary;
    case 'other':
      return ClientGenderCode.Other;
    case 'prefer not to say':
      return ClientGenderCode.PreferNotToSay;
    default:
      return ClientGenderCode.Unknown;
  }
}

export function clientProgramCode(value: string): ClientProgramTypeCode {
  switch (value.trim().toLowerCase()) {
    case 'pca traditional':
      return ClientProgramTypeCode.PcaTraditional;
    case 'pca choice':
      return ClientProgramTypeCode.PcaChoice;
    case '245d':
      return ClientProgramTypeCode.Two45D;
    case 'cfss agency':
      return ClientProgramTypeCode.CfssAgency;
    case 'cfss budget':
      return ClientProgramTypeCode.CfssBudget;
    default:
      return ClientProgramTypeCode.None;
  }
}

export function nullableTrimmed(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized ? normalized : null;
}

export function nullableBoolean(value: string): boolean | null {
  switch (value.trim().toLowerCase()) {
    case 'yes':
      return true;
    case 'no':
      return false;
    default:
      return null;
  }
}

export function booleanChoice(value: boolean | null | undefined): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '';
}

export function formatDateForDisplay(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
}

function normalizeEnumText(value: string): string {
  return addWordBreaks(value?.replace(/^Two45D$/i, '245D'));
}

function addWordBreaks(value: string): string {
  return value?.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}
