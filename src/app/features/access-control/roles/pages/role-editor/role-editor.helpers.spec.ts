import { HttpErrorResponse } from '@angular/common/http';
import {
  mapRoleError,
  normalizeDescription,
  setsEqual,
  sortedPermissionIds,
} from './role-editor.helpers';

describe('role editor helpers', () => {
  it('normalizes descriptions and permission identifiers without changing values', () => {
    expect(normalizeDescription('  Description  ')).toBe('Description');
    expect(normalizeDescription('   ')).toBeNull();
    expect(sortedPermissionIds(new Set([20, 3, 10]))).toEqual([3, 10, 20]);
    expect(setsEqual(new Set([3, 10]), new Set([10, 3]))).toBe(true);
  });

  it.each([
    [404, {}, 'notFound'],
    [400, { type: 'urn:duplicate-role' }, 'duplicateName'],
    [400, { type: 'urn:permission-invalid' }, 'invalidPermission'],
    [400, { type: 'urn:last-role-manager' }, 'lastRoleManager'],
    [409, {}, 'conflict'],
    [500, {}, 'failed'],
  ] as const)('maps status %s to the existing %s behavior', (status, error, expected) => {
    expect(mapRoleError(new HttpErrorResponse({ status, error }))).toBe(expected);
  });
});
