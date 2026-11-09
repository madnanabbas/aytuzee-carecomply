import { LucideCircle, LucideFiles } from '@lucide/angular';
import { resolveNavigationIcon } from './navigation-icon-resolver';

describe('resolveNavigationIcon', () => {
  it('resolves the backend Client Forms icon key through the existing local icon map', () => {
    expect(resolveNavigationIcon('documents')).toBe(LucideFiles);
    expect(resolveNavigationIcon('unknown-icon')).toBe(LucideCircle);
  });
});
