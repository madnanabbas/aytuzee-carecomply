import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type ClientTab =
  'overview' | 'personal' | 'contacts' | 'services' | 'documents' | 'compliance' | 'history';

@Component({
  selector: 'app-client-profile-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-profile-page.html',
})
export class ClientProfilePageComponent {
  readonly activeTab = signal<ClientTab>('overview');

  selectTab(tab: ClientTab): void {
    this.activeTab.set(tab);
  }
}
