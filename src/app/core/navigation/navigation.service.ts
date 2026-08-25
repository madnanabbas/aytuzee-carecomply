import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthorizationService } from '../authorization/authorization.service';
import { canAccessNavigationRoute } from './app-navigation';
import { NavigationApiService } from './navigation-api.service';
import { resolveNavigationIcon } from './navigation-icon-resolver';
import {
  NavigationGroup,
  NavigationItem,
  NavigationLoadStatus,
} from './navigation.models';

const NAVIGATION_REQUEST_TIMEOUT_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly api = inject(NavigationApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly groupsState = signal<readonly NavigationGroup[]>([]);
  private readonly statusState = signal<NavigationLoadStatus>('idle');
  private loadedUserId: string | null = null;
  private loadingUserId: string | null = null;
  private loadingPromise: Promise<void> | null = null;

  readonly groups = this.groupsState.asReadonly();
  readonly status = this.statusState.asReadonly();

  async loadForSession(userId: string): Promise<void> {
    if (this.loadedUserId === userId && this.statusState() === 'loaded') return;
    if (this.loadingUserId === userId && this.loadingPromise) return this.loadingPromise;

    this.loadingUserId = userId;
    this.statusState.set('loading');
    this.groupsState.set([]);
    this.loadingPromise = this.load(userId);
    return this.loadingPromise;
  }

  clear(): void {
    this.loadedUserId = null;
    this.loadingUserId = null;
    this.loadingPromise = null;
    this.groupsState.set([]);
    this.statusState.set('idle');
  }

  firstAllowedPath(): string {
    return this.groupsState().flatMap((group) => group.items).at(0)?.route ?? '/forbidden';
  }

  findByUrl(url: string): NavigationItem | undefined {
    const normalized = normalizeUrl(url);
    const allItems = this.groupsState()
      .flatMap((group) => group.items)
      .flatMap((item) => [item, ...item.children]);
    return allItems.find((item) => normalizeUrl(item.route) === normalized)
      ?? [...allItems]
        .sort((left, right) => right.route.length - left.route.length)
        .find((item) => normalized.startsWith(`${normalizeUrl(item.route)}/`));
  }

  private async load(userId: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.getNavigation().pipe(timeout(NAVIGATION_REQUEST_TIMEOUT_MS)),
      );
      const groups = this.parseModules(response);
      if (this.loadingUserId !== userId) return;

      this.groupsState.set(groups);
      this.statusState.set('loaded');
      this.loadedUserId = userId;
    } catch {
      if (this.loadingUserId === userId) {
        this.groupsState.set([]);
        this.statusState.set('error');
        this.loadedUserId = null;
      }
    } finally {
      if (this.loadingUserId === userId) {
        this.loadingUserId = null;
        this.loadingPromise = null;
      }
    }
  }

  private parseModules(value: unknown): readonly NavigationGroup[] {
    if (!Array.isArray(value)) throw new Error('The navigation response is invalid.');

    return value
      .map((module) => this.parseModule(module))
      .filter((module): module is NavigationGroup => module !== null)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.key.localeCompare(right.key));
  }

  private parseModule(value: unknown): NavigationGroup | null {
    if (!isRecord(value)
      || !isSafeKey(value['key'])
      || !isBoundedText(value['name'])
      || !isSortOrder(value['sortOrder'])
      || !Array.isArray(value['features'])) return null;

    const items = value['features']
      .map((feature) => this.parseFeature(feature, false))
      .filter((feature): feature is NavigationItem => feature !== null)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
    return items.length === 0
      ? null
      : {
          key: value['key'],
          label: value['name'],
          sortOrder: value['sortOrder'],
          items,
        };
  }

  private parseFeature(value: unknown, isChild: boolean): NavigationItem | null {
    if (!isRecord(value)
      || !isSafeKey(value['key'])
      || !isBoundedText(value['name'])
      || !isSafeInternalRoute(value['route'])
      || !isSafeKey(value['iconKey'])
      || !isSortOrder(value['sortOrder'])
      || !Array.isArray(value['children'])
      || (isChild && value['children'].length > 0)
      || !canAccessNavigationRoute(this.authorization, value['key'], value['route'])) return null;

    const children = value['children']
      .map((child) => this.parseFeature(child, true))
      .filter((child): child is NavigationItem => child !== null)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
    return {
      id: value['key'],
      label: value['name'],
      route: value['route'],
      icon: resolveNavigationIcon(value['iconKey']),
      sortOrder: value['sortOrder'],
      children,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSafeKey(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 100
    && /^[a-z0-9-]+$/u.test(value);
}

function isBoundedText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 100;
}

function isSortOrder(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isSafeInternalRoute(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 2 && value.length <= 200
    && /^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/u.test(value);
}

function normalizeUrl(url: string): string {
  const withoutQuery = url.split('?')[0] ?? url;
  const withoutFragment = withoutQuery.split('#')[0] ?? withoutQuery;
  return withoutFragment.length > 1 && withoutFragment.endsWith('/')
    ? withoutFragment.slice(0, -1)
    : withoutFragment;
}
