import { Component } from '@angular/core';

@Component({
  selector: 'app-page-container',
  standalone: true,
  template: `
    <div class="px-page-mobile py-page sm:px-page lg:px-page-wide">
      <ng-content />
    </div>
  `,
})
export class PageContainerComponent {}
