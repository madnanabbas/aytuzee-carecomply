import { clientsRoutes } from './clients.routes';

describe('clientsRoutes G-Link phase boundary', () => {
  it('does not add a public client-intake route in the authenticated dialog phase', () => {
    expect(clientsRoutes.some((route) => route.path === 'client-intake')).toBe(false);
  });
});
