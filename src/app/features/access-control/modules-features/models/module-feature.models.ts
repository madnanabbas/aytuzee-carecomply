export interface ModuleFeatureItem {
  readonly id: number;
  readonly moduleId: number;
  readonly parentFeatureId: number | null;
  readonly key: string;
  readonly name: string;
  readonly route: string;
  readonly iconKey: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface NavigationModuleItem {
  readonly id: number;
  readonly key: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly features: readonly ModuleFeatureItem[];
}

export interface NavigationModuleRequest {
  readonly key: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface NavigationFeatureRequest {
  readonly moduleId: number;
  readonly parentFeatureId: number | null;
  readonly key: string;
  readonly name: string;
  readonly route: string;
  readonly iconKey: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface NavigationMutationResponse {
  readonly id: number;
}
