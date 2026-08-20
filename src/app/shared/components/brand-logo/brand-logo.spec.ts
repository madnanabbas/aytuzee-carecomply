import { TestBed } from '@angular/core/testing';
import { BrandLogoComponent } from './brand-logo';

describe('BrandLogoComponent', () => {
  it('should render the official application asset with accessible branding', () => {
    const fixture = TestBed.createComponent(BrandLogoComponent);
    fixture.detectChanges();

    const image = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(image?.getAttribute('src')).toBe('/images/logo.png');
    expect(image?.getAttribute('alt')).toBe('Aytuzee Care Comply');
    expect(image?.classList.contains('object-contain')).toBe(true);
  });
});
