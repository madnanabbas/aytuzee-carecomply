export interface ClientFormTemplate {
  readonly templateVersionId: string;
  readonly templateKey: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly versionNumber: number;
  readonly pageCount: number;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
}

export interface ClientFormTemplateListResponse {
  readonly templates: readonly ClientFormTemplate[];
}

export interface ClientFormBinding {
  readonly pdfFieldName: string;
  readonly value: string;
  readonly userEditable: boolean;
}

export interface ClientFormBindingsResponse {
  readonly templateVersionId: string;
  readonly fields: readonly ClientFormBinding[];
}

export interface ClientFormDocumentSource {
  readonly bytes: ArrayBuffer;
  readonly bindings: readonly ClientFormBinding[];
}
