export type ClientServiceAgreementStatus =
  'Draft' | 'PendingAuthorization' | 'Active' | 'OnHold' | 'Expired' | 'Terminated' | 'Cancelled';

export type ClientServiceAgreementUnitType =
  'FifteenMinutes' | 'Hour' | 'Visit' | 'Day' | 'PerDiem' | 'ServiceUnit' | 'DollarAmount';

export type ClientServiceAgreementPriority = 'Normal' | 'High' | 'Urgent';

export interface ClientServiceAgreementLineDiagnosis {
  readonly id: string;
  readonly diagnosisText: string | null;
  readonly icdCode: string | null;
  readonly isPrimary: boolean;
}

export interface ClientServiceAgreementLine {
  readonly id: string;
  readonly serviceCode: string;
  readonly serviceName: string;
  readonly unitType: ClientServiceAgreementUnitType | null;
  readonly minutesPerUnit: number | null;
  readonly authorizedUnits: number | null;
  readonly ratePerUnit: number | null;
  readonly plannedHoursPerVisit: number | null;
  readonly plannedVisitsPerWeek: number | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly rateEffectiveFrom: string | null;
  readonly rateEffectiveTo: string | null;
  readonly authorizedBudgetAmount: number | null;
  readonly diagnoses: readonly ClientServiceAgreementLineDiagnosis[];
  readonly estimatedBudget: number | null;
  readonly plannedHoursPerWeek: number | null;
  readonly plannedUnitsPerWeek: number | null;
}

export interface ClientServiceAgreementWarning {
  readonly code: 'SERVICE_LINE_OVERLAP';
  readonly serviceCode: string;
  readonly serviceLineId: string;
  readonly overlappingAgreementId: string;
  readonly overlappingLineId: string;
  readonly overlapStartDate: string;
  readonly overlapEndDate: string | null;
}

export interface ClientServiceAgreement {
  readonly id: string;
  readonly payerId?: string | null;
  readonly clientCoverageId?: string | null;
  readonly agreementNumber: string | null;
  readonly payerName: string | null;
  readonly insuredMemberId: string | null;
  readonly priorAuthorizationNumber: string | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly status: ClientServiceAgreementStatus | null;
  readonly priority: ClientServiceAgreementPriority | null;
  readonly isDummy: boolean;
  readonly notes: string | null;
  readonly editorVersion: string;
  readonly lines: readonly ClientServiceAgreementLine[];
  readonly warnings: readonly ClientServiceAgreementWarning[];
}

export interface CreateClientServiceAgreementLineDiagnosisRequest {
  readonly diagnosisText: string | null;
  readonly icdCode: string | null;
  readonly isPrimary: boolean;
}

export interface UpdateClientServiceAgreementLineDiagnosisRequest extends CreateClientServiceAgreementLineDiagnosisRequest {
  readonly id?: string;
}

export interface CreateClientServiceAgreementLineRequest {
  readonly serviceCode: string;
  readonly serviceName: string;
  readonly unitType: ClientServiceAgreementUnitType | null;
  readonly minutesPerUnit: number | null;
  readonly authorizedUnits: number | null;
  readonly ratePerUnit: number | null;
  readonly plannedHoursPerVisit: number | null;
  readonly plannedVisitsPerWeek: number | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly rateEffectiveFrom: string | null;
  readonly rateEffectiveTo: string | null;
  readonly authorizedBudgetAmount: number | null;
  readonly diagnoses: readonly CreateClientServiceAgreementLineDiagnosisRequest[];
}

export interface UpdateClientServiceAgreementLineRequest extends Omit<
  CreateClientServiceAgreementLineRequest,
  'diagnoses'
> {
  readonly id?: string;
  readonly diagnoses: readonly UpdateClientServiceAgreementLineDiagnosisRequest[];
}

export interface CreateClientServiceAgreementRequest {
  readonly payerId?: string | null;
  readonly clientCoverageId?: string | null;
  readonly agreementNumber: string | null;
  readonly payerName: string | null;
  readonly insuredMemberId: string | null;
  readonly priorAuthorizationNumber: string | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly status: ClientServiceAgreementStatus | null;
  readonly priority: ClientServiceAgreementPriority | null;
  readonly isDummy: boolean;
  readonly notes: string | null;
  readonly lines: readonly CreateClientServiceAgreementLineRequest[];
}

export interface UpdateClientServiceAgreementRequest extends Omit<
  CreateClientServiceAgreementRequest,
  'lines'
> {
  readonly editorVersion: string;
  readonly lines: readonly UpdateClientServiceAgreementLineRequest[];
}
