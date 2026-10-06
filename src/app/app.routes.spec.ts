import { routes } from './app.routes';

describe('application routes', () => {
  it('keeps client intake public and outside the authenticated application shell', () => {
    const intake = routes.find((route) => route.path === 'client-intake');
    const shell = routes.find((route) => route.path === '');

    expect(intake).toBeDefined();
    expect(intake?.canActivate).toBeUndefined();
    expect(shell?.children?.some((route) => route.path === 'client-intake')).toBe(false);
  });
});
