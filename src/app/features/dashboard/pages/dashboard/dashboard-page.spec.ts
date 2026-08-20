import { TestBed } from '@angular/core/testing';
import { DashboardPageComponent } from './dashboard-page';

describe('DashboardPageComponent', () => {
  it('should render the approved compliance-focused preview sections and text statuses', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const copy = element.textContent ?? '';

    expect(copy).toContain('Preview data');
    expect(copy).toContain('Compliance attention');
    expect(copy).toContain('Operational snapshot');
    expect(copy).toContain('Compliance readiness');
    expect(copy).toContain('Upcoming compliance work');
    expect(copy).toContain('Recent DHS updates');
    expect(copy).toContain('Workforce readiness');
    expect(copy).toContain('Expired');
    expect(copy).toContain('Expiring Soon');
    expect(copy).toContain('Review Due');
    expect(copy).toContain('Current');
    expect(copy).toContain('illustrative only');
  });

  it('should remain a presentation-only component without injected API dependencies', () => {
    expect(DashboardPageComponent.length).toBe(0);
    expect(TestBed.createComponent(DashboardPageComponent).componentInstance).toBeTruthy();
  });
});
