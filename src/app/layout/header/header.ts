import { Component, computed, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { LucideBell, LucideChevronDown, LucideLogOut, LucideMenu } from '@lucide/angular';
import { filter, map, startWith } from 'rxjs';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { AuthorizationService } from '../../core/authorization/authorization.service';
import { Permissions } from '../../core/authorization/permissions';
import { NavigationService } from '../../core/navigation/navigation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideBell, LucideChevronDown, LucideLogOut, LucideMenu, RouterLink],
  templateUrl: './header.html',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeAccountMenu(true)',
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
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly menuRequested = output<void>();
  readonly accountMenuOpen = signal(false);
  readonly logoutPending = signal(false);
  readonly currentUser = this.session.currentUser;
  readonly canViewNotifications = computed(() =>
    this.authorization.hasPermission(Permissions.Notification.View),
  );
  readonly pageContext = computed(
    () => this.navigation.findByUrl(this.currentUrl())?.label ?? 'Care workspace',
  );
  readonly initials = computed(() => {
    const words = this.currentUser()?.displayName.trim().split(/\s+/u).filter(Boolean) ?? [];
    if (words.length === 0) {
      return 'CC';
    }

    const first = words[0]?.charAt(0) ?? '';
    const last = words.length > 1 ? words.at(-1)?.charAt(0) ?? '' : '';
    return `${first}${last}`.toUpperCase();
  });

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((isOpen) => !isOpen);
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

  onDocumentClick(event: MouseEvent): void {
    if (
      event.target instanceof Node &&
      !this.accountControl()?.nativeElement.contains(event.target)
    ) {
      this.closeAccountMenu();
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
