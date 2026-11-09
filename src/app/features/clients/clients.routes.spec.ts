import { clientsRoutes } from './clients.routes';
import { Permissions } from '../../core/authorization/permissions';

describe('clientsRoutes G-Link phase boundary', () => {
  it('does not add a public client-intake route in the authenticated dialog phase', () => {
    expect(clientsRoutes.some((route) => route.path === 'client-intake')).toBe(false);
  });

  it('registers Client Forms before parameterized client routes with its dedicated permission', () => {
    const formsIndex = clientsRoutes.findIndex((route) => route.path === 'forms');
    const clientIndex = clientsRoutes.findIndex((route) => route.path === ':clientId');
    const forms = clientsRoutes[formsIndex];

    expect(formsIndex).toBeGreaterThanOrEqual(0);
    expect(formsIndex).toBeLessThan(clientIndex);
    expect(forms?.data?.['permissions']).toEqual([Permissions.ClientForm.View]);
    expect(forms?.canActivate).toHaveLength(2);
  });

  it('keeps the client list at /clients and registers the database navigation alias first', () => {
    const listAliasIndex = clientsRoutes.findIndex((route) => route.path === 'list');
    const clientIndex = clientsRoutes.findIndex((route) => route.path === ':clientId');
    const rootList = clientsRoutes.find((route) => route.path === '');
    const listAlias = clientsRoutes[listAliasIndex];

    expect(rootList?.data?.['permissions']).toEqual([Permissions.Client.View]);
    expect(listAliasIndex).toBeGreaterThanOrEqual(0);
    expect(listAliasIndex).toBeLessThan(clientIndex);
    expect(listAlias?.data?.['permissions']).toEqual([Permissions.Client.View]);
  });
});
