import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClientViewOverviewComponent } from './client-view-overview';
import { EMPTY_CLIENT_VIEW } from './client-view.models';

describe('ClientViewOverviewComponent', () => {
  it('accounts for basic, contact, and additional intake information read-only', async () => {
    await TestBed.configureTestingModule({
      imports: [ClientViewOverviewComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientViewOverviewComponent);
    fixture.componentRef.setInput('client', EMPTY_CLIENT_VIEW);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';
    expect(text).toContain('Client information');
    expect(text).toContain('Care & service');
    expect(text).toContain('Preferences & additional profile');
    expect(text).toContain('Referral & program');
    expect(element.querySelector('input, select, textarea')).toBeNull();
    expect(element.querySelector('button')).toBeNull();
  });
});
