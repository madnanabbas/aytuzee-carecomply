import { Component } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `
    <img
      src="/images/logo.png"
      width="2172"
      height="724"
      alt="Aytuzee Care Comply"
      class="block h-auto w-full object-contain"
    />
  `,
})
export class BrandLogoComponent {}
