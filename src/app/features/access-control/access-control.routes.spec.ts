import { Permissions } from '../../core/authorization/permissions';
import { permissionGuard } from '../../core/guards/permission-guard';
import { accessControlRoutes } from './access-control.routes';

describe('access control routes', () => {
  it('should protect the lazy Users page with User.View and expose no Register User route', () => {
    const users = accessControlRoutes.find((route) => route.path === 'users');

    expect(users).toBeDefined();
    expect(users?.canActivate).toEqual([permissionGuard]);
    expect(users?.data?.['permissions']).toEqual([Permissions.User.View]);
    expect(users?.loadComponent).toBeTypeOf('function');
    expect(accessControlRoutes.some((route) => route.path === 'register-user')).toBe(false);
  });

  it('should expose the protected single-form General editor', () => {
    const editor = accessControlRoutes.find((route) => route.path === 'users/:userId');

    expect(editor?.canActivate).toEqual([permissionGuard]);
    expect(editor?.data?.['permissions']).toEqual([Permissions.User.View]);
    expect(editor?.children?.map((route) => route.path)).toEqual(['', 'general']);
  });

  it('should expose Add User before the parameter route and require User.Manage', () => {
    const createIndex = accessControlRoutes.findIndex((route) => route.path === 'users/new');
    const editorIndex = accessControlRoutes.findIndex((route) => route.path === 'users/:userId');
    const create = accessControlRoutes[createIndex];

    expect(createIndex).toBeGreaterThan(-1);
    expect(createIndex).toBeLessThan(editorIndex);
    expect(create.canActivate).toEqual([permissionGuard]);
    expect(create.data?.['permissions']).toEqual([Permissions.User.Manage]);
    expect(create.data?.['createMode']).toBe(true);
    expect(create.children?.map((route) => route.path)).toEqual(['', 'general']);
  });
});
