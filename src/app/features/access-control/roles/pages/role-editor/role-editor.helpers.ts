import { HttpErrorResponse } from '@angular/common/http';
import { RoleEditorError } from '../../models/role-management.models';

export function sortedPermissionIds(ids: ReadonlySet<number>): readonly number[] {
  return [...ids].sort((left, right) => left - right);
}

export function setsEqual(left: ReadonlySet<number>, right: ReadonlySet<number>): boolean {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

export function normalizeDescription(value: string): string | null {
  const description = value.trim();
  return description.length === 0 ? null : description;
}

export function mapRoleError(error: HttpErrorResponse): RoleEditorError {
  if (error.status === 404) return 'notFound';

  const type = typeof error.error?.type === 'string' ? error.error.type.toLowerCase() : '';
  if (type.includes('duplicate')) return 'duplicateName';
  if (type.includes('permission') && type.includes('invalid')) return 'invalidPermission';
  if (type.includes('last') && type.includes('manager')) return 'lastRoleManager';
  if (error.status === 409) return 'conflict';
  return 'failed';
}
