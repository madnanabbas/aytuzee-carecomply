export type FormTemplateVersionStatus = 'Draft' | 'Published' | 'Retired';

export interface FormTemplateSummary {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly category: string;
  readonly ownerType: string;
  readonly companyId: string | null;
  readonly isActive: boolean;
  readonly versionCount: number;
  readonly latestVersionNumber: number | null;
  readonly latestVersionStatus: FormTemplateVersionStatus | null;
  readonly latestVersionUploadedAtUtc: string | null;
}

export interface FormTemplate {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly ownerType: string;
  readonly companyId: string | null;
  readonly isActive: boolean;
  readonly createdAtUtc: string;
  readonly versions: readonly FormTemplateVersion[];
}

export interface FormTemplateVersion {
  readonly id: string;
  readonly templateId: string;
  readonly versionNumber: number;
  readonly status: FormTemplateVersionStatus;
  readonly originalFileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly pageCount: number;
  readonly technology: string;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly uploadedAtUtc: string;
  readonly fieldCount: number;
}

export interface FormTemplateField {
  readonly id: string;
  readonly pdfFieldName: string;
  readonly pdfFieldType: string;
  readonly fieldPurpose: string;
  readonly bindingKey: string | null;
  readonly formatKey: string | null;
  readonly isUserEditable: boolean;
}

export interface FormTemplateWarning {
  readonly code: string;
  readonly message: string;
}

export interface FormTemplateMutationResponse {
  readonly template: FormTemplate | null;
  readonly version: FormTemplateVersion | null;
  readonly warnings: readonly FormTemplateWarning[];
}

export interface NewFormTemplateUpload {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly file: File;
}

export type FormTemplateUploadEvent =
  | { readonly kind: 'progress'; readonly percent: number }
  | { readonly kind: 'complete'; readonly response: FormTemplateMutationResponse };

export type FormFieldPurpose = 'Manual' | 'Data' | 'Signature' | 'Attestation';

export interface FormTemplateBindingCatalog {
  readonly groups: readonly FormTemplateBindingGroup[];
}
export interface FormTemplateBindingGroup {
  readonly label: string;
  readonly items: readonly FormTemplateBindingItem[];
}
export interface FormTemplateBindingItem {
  readonly key: string;
  readonly label: string;
  readonly allowedPdfFieldTypes: readonly string[];
}
export interface FormTemplateMapping {
  readonly id: string;
  readonly pdfFieldName: string;
  readonly pdfFieldType: string;
  readonly fieldPurpose: FormFieldPurpose;
  readonly bindingKey: string | null;
  readonly suggestedPurpose: FormFieldPurpose | null;
}
export interface FormTemplateMappingSet {
  readonly templateId: string;
  readonly templateKey: string;
  readonly versionId: string;
  readonly versionNumber: number;
  readonly status: FormTemplateVersionStatus;
  readonly requiresWarningAcknowledgement: boolean;
  readonly isReviewed: boolean;
  readonly rowVersion: string;
  readonly mappings: readonly FormTemplateMapping[];
}
export interface FormTemplatePreview {
  readonly isSynthetic: true;
  readonly values: readonly { readonly mappingId: string; readonly value: string }[];
}
