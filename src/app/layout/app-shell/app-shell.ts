import { Component, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { PageContainerComponent } from '../page-container/page-container';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [HeaderComponent, PageContainerComponent, RouterOutlet, SidebarComponent],
  templateUrl: './app-shell.html',
})
export class AppShellComponent {
  private readonly header = viewChild(HeaderComponent);

  readonly mobileSidebarOpen = signal(false);

  openMobileSidebar(): void {
    this.mobileSidebarOpen.set(true);
  }

  closeMobileSidebar(): void {
    if (!this.mobileSidebarOpen()) {
      return;
    }

    this.mobileSidebarOpen.set(false);
    queueMicrotask(() => this.header()?.focusMenuButton());
  }
}
