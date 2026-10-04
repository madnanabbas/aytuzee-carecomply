import { Component, computed, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideBell,
  LucideChevronDown,
  LucideLogOut,
  LucideMenu,
  LucideSearch,
  LucideX,
} from '@lucide/angular';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { AuthorizationService } from '../../core/authorization/authorization.service';
import { Permissions } from '../../core/authorization/permissions';
import { NavigationService } from '../../core/navigation/navigation.service';
import { buildHeaderSearchResults, HeaderSearchResult } from './header-search';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    LucideBell,
    LucideChevronDown,
    LucideLogOut,
    LucideMenu,
    LucideSearch,
    LucideX,
    RouterLink,
  ],
  templateUrl: './header.html',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class HeaderComponent {
  private readonly session = inject(AuthSessionService);
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);
  private readonly navigation = inject(NavigationService);

  private readonly accountControl = viewChild<ElementRef<HTMLElement>>('accountControl');

  private readonly accountButton = viewChild<ElementRef<HTMLButtonElement>>('accountButton');

  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');

  private readonly searchControl = viewChild<ElementRef<HTMLElement>>('searchControl');

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly menuRequested = output<void>();

  readonly accountMenuOpen = signal(false);
  readonly logoutPending = signal(false);

  readonly searchQuery = signal('');
  readonly searchOpen = signal(false);
  readonly activeSearchIndex = signal(-1);

  readonly currentUser = this.session.currentUser;
  readonly accountSubtitle = computed(() => {
    const user = this.currentUser();
    return (
      user?.companyName?.trim() || (user?.isPlatformAdministrator ? 'Platform administration' : '')
    );
  });

  readonly canViewNotifications = computed(() =>
    this.authorization.hasPermission(Permissions.Notification.View),
  );

  /**
   * Search behavior:
   *
   * Empty query:
   *   Return every accessible feature from the navigation response.
   *
   * Query entered:
   *   Filter by module, parent feature or feature name and return
   *   the first matching results.
   *
   * NavigationService already contains the permission-filtered
   * navigation tree, so unauthorized features are never exposed here.
   */
  readonly searchResults = computed<readonly HeaderSearchResult[]>(() => {
    return buildHeaderSearchResults(this.navigation.groups(), this.searchQuery());
  });

  readonly initials = computed(() => {
    const words = this.currentUser()?.displayName.trim().split(/\s+/u).filter(Boolean) ?? [];

    if (words.length === 0) {
      return 'CC';
    }

    const first = words[0]?.charAt(0) ?? '';
    const last = words.length > 1 ? (words.at(-1)?.charAt(0) ?? '') : '';

    return `${first}${last}`.toUpperCase();
  });

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((isOpen) => !isOpen);
    this.closeSearch();
  }

  closeAccountMenu(restoreFocus = false): void {
    if (!this.accountMenuOpen()) {
      return;
    }

    this.accountMenuOpen.set(false);

    if (restoreFocus) {
      queueMicrotask(() => this.accountButton()?.nativeElement.focus());
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchQuery.set(value);
    this.searchOpen.set(true);
    this.activeSearchIndex.set(-1);
  }

  onSearchFocus(): void {
    // Open even when there is no search text.
    // This makes the control work as both search and quick navigation.
    this.searchOpen.set(true);
    this.activeSearchIndex.set(-1);
    this.closeAccountMenu();
  }

  clearSearch(): void {
    this.searchQuery.set('');

    // Keep the dropdown open after clearing so the user immediately
    // sees all available features again.
    this.searchOpen.set(true);
    this.activeSearchIndex.set(-1);

    queueMicrotask(() => this.searchInput()?.nativeElement.focus());
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const results = this.searchResults();

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (results.length === 0) {
        return;
      }

      this.searchOpen.set(true);

      this.activeSearchIndex.update((index) => (index + 1) % results.length);

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (results.length === 0) {
        return;
      }

      this.searchOpen.set(true);

      this.activeSearchIndex.update((index) => (index <= 0 ? results.length - 1 : index - 1));

      return;
    }

    if (event.key === 'Enter') {
      const index = this.activeSearchIndex();

      const selected =
        index >= 0 ? results[index] : this.searchQuery().trim() ? results[0] : undefined;

      if (selected) {
        event.preventDefault();
        void this.openSearchResult(selected);
      }
    }
  }

  async openSearchResult(result: HeaderSearchResult): Promise<void> {
    this.searchQuery.set('');
    this.searchOpen.set(false);
    this.activeSearchIndex.set(-1);

    await this.router.navigateByUrl(result.route);
  }

  closeSearch(restoreFocus = false): void {
    if (!this.searchOpen()) {
      return;
    }

    this.searchOpen.set(false);
    this.activeSearchIndex.set(-1);

    if (restoreFocus) {
      queueMicrotask(() => this.searchInput()?.nativeElement.focus());
    }
  }

  onEscape(): void {
    if (this.searchOpen()) {
      this.closeSearch(true);
      return;
    }

    this.closeAccountMenu(true);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!(event.target instanceof Node)) {
      return;
    }

    if (!this.accountControl()?.nativeElement.contains(event.target)) {
      this.closeAccountMenu();
    }

    if (!this.searchControl()?.nativeElement.contains(event.target)) {
      this.closeSearch();
    }
  }

  focusMenuButton(): void {
    this.menuButton()?.nativeElement.focus();
  }

  async logout(): Promise<void> {
    if (this.logoutPending()) {
      return;
    }

    this.logoutPending.set(true);
    this.closeAccountMenu();

    try {
      await this.session.logout();
    } finally {
      this.logoutPending.set(false);
    }
  }
}
