export interface ClientDocument {
  readonly id: string;
  readonly clientId: string;
  readonly category: string;
  readonly title: string;
  readonly description: string | null;
  readonly expiryDate: string | null;
  readonly reviewDate: string | null;
  readonly status: 'Active' | 'Archived';
  readonly currentVersionId: string;
  readonly currentVersionNumber: number;
  readonly originalFileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly uploadedAtUtc: string;
  readonly updatedAtUtc: string;
  readonly editorVersion: string;
}

export interface ClientDocumentVersion {
  readonly id: string;
  readonly versionNumber: number;
  readonly originalFileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly uploadedAtUtc: string;
  readonly isCurrent: boolean;
}

export interface ClientDocumentDetails {
  readonly document: ClientDocument;
  readonly versions: readonly ClientDocumentVersion[];
}

export interface ClientDocumentMetadata {
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly expiryDate: string;
  readonly reviewDate: string;
}
