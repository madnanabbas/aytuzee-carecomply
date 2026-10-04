import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideChevronDown, LucideDynamicIcon, LucideX } from '@lucide/angular';

import { NavigationItem } from '../../core/navigation/navigation.models';
import { NavigationService } from '../../core/navigation/navigation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    LucideDynamicIcon,
    LucideChevronDown,
    LucideX,
  ],
  templateUrl: './sidebar.html',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class SidebarComponent {
  private readonly navigation = inject(NavigationService);
  private readonly router = inject(Router);

  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  readonly mobileOpen = input(false);

  readonly closeRequested = output<void>();

  readonly collapsed = signal(false);

  readonly expandedModules = signal<ReadonlySet<string>>(new Set<string>());

  readonly groups = this.navigation.groups;
  readonly navigationStatus = this.navigation.status;

  constructor() {
    effect(() => {
      if (!this.mobileOpen()) {
        return;
      }

      queueMicrotask(() => {
        this.closeButton()?.nativeElement.focus();
      });
    });
  }

  toggleCollapsed(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  toggleModule(itemId: string): void {
    this.expandedModules.update((current) => {
      const next = new Set(current);

      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      return next;
    });
  }

  isModuleExpanded(itemId: string): boolean {
    return this.expandedModules().has(itemId);
  }

  isChildRouteActive(item: NavigationItem): boolean {
    if (!item.children.length) {
      return false;
    }

    const currentUrl = this.normalizeUrl(this.router.url);

    return item.children.some((child) => {
      if (!child.route) {
        return false;
      }

      const childRoute = this.normalizeUrl(child.route);

      return currentUrl === childRoute || currentUrl.startsWith(`${childRoute}/`);
    });
  }

  close(): void {
    if (!this.mobileOpen()) {
      return;
    }

    this.closeRequested.emit();
  }

  onEscape(): void {
    if (this.mobileOpen()) {
      this.close();
    }
  }

  private normalizeUrl(url: string): string {
    const withoutQuery = url.split('?')[0] ?? url;

    const withoutFragment = withoutQuery.split('#')[0] ?? withoutQuery;

    if (withoutFragment.length > 1 && withoutFragment.endsWith('/')) {
      return withoutFragment.slice(0, -1);
    }

    return withoutFragment;
  }
}
