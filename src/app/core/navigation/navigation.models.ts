import { LucideIcon } from '@lucide/angular';

export interface NavigationModuleResponse {
  readonly key: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly features: readonly NavigationFeatureResponse[];
}

export interface NavigationFeatureResponse {
  readonly key: string;
  readonly name: string;
  readonly route: string;
  readonly iconKey: string;
  readonly sortOrder: number;
  readonly children: readonly NavigationFeatureResponse[];
}

export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly icon: LucideIcon;
  readonly sortOrder: number;
  readonly children: readonly NavigationItem[];
}

export interface NavigationGroup {
  readonly key: string;
  readonly label: string;
  readonly sortOrder: number;
  readonly items: readonly NavigationItem[];
}

export type NavigationLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';
