export interface ClientServiceAgreementLine {
  readonly id: string;
  readonly serviceCode: string;
  readonly serviceName: string;
  readonly unitType: string | null;
  readonly minutesPerUnit: number | null;
  readonly authorizedUnits: number | null;
  readonly ratePerUnit: number | null;
  readonly plannedHoursPerVisit: number | null;
  readonly plannedVisitsPerWeek: number | null;
  readonly primaryDiagnosisText: string | null;
  readonly icdCode: string | null;
  readonly estimatedBudget: number | null;
  readonly plannedHoursPerWeek: number | null;
  readonly plannedUnitsPerWeek: number | null;
}

export interface ClientServiceAgreement {
  readonly id: string;
  readonly agreementNumber: string | null;
  readonly payerName: string | null;
  readonly insuredMemberId: string | null;
  readonly priorAuthorizationNumber: string | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly status: string | null;
  readonly notes: string | null;
  readonly editorVersion: string;
  readonly lines: readonly ClientServiceAgreementLine[];
}

export interface CreateClientServiceAgreementLineRequest {
  readonly serviceCode: string;
  readonly serviceName: string;
  readonly unitType: string | null;
  readonly minutesPerUnit: number | null;
  readonly authorizedUnits: number | null;
  readonly ratePerUnit: number | null;
  readonly plannedHoursPerVisit: number | null;
  readonly plannedVisitsPerWeek: number | null;
  readonly primaryDiagnosisText: string | null;
  readonly icdCode: string | null;
}

export interface UpdateClientServiceAgreementLineRequest extends CreateClientServiceAgreementLineRequest {
  readonly id?: string;
}

export interface CreateClientServiceAgreementRequest {
  readonly agreementNumber: string | null;
  readonly payerName: string | null;
  readonly insuredMemberId: string | null;
  readonly priorAuthorizationNumber: string | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly status: string | null;
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
