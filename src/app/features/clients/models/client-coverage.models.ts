export interface ClientCoverage {
  readonly id: string;
  readonly payerId: string | null;
  readonly payerName: string;
  readonly manualPayerName: string | null;
  readonly memberId: string | null;
  readonly medicaidId: string | null;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly isVerified: boolean;
  readonly isPrimary: boolean;
  readonly editorVersion: string;
}

export interface SaveClientCoverageRequest {
  readonly payerId: string | null;
  readonly manualPayerName: string | null;
  readonly memberId: string | null;
  readonly medicaidId: string | null;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly isVerified: boolean;
  readonly isPrimary: boolean;
}

export interface UpdateClientCoverageRequest extends SaveClientCoverageRequest {
  readonly editorVersion: string;
}
