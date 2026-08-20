import { Component } from '@angular/core';

@Component({
  selector: 'app-forbidden',
  template: `
    <section aria-labelledby="forbidden-title" class="max-w-2xl">
      <h1 id="forbidden-title" class="text-page-title">Access denied</h1>
      <p class="mt-2 text-body text-text-secondary">
        You do not have permission to view this page.
      </p>
    </section>
  `,
})
export class ForbiddenComponent {}
