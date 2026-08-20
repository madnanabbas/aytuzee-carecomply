import {
  LucideBell,
  LucideBookOpen,
  LucideCalendarClock,
  LucideChartNoAxesColumn,
  LucideContactRound,
  LucideFilePlus2,
  LucideFiles,
  LucideGraduationCap,
  LucideLayoutDashboard,
  LucideLibrary,
  LucideListChecks,
  LucideShieldCheck,
  LucideUsers,
  LucideUserRoundCog,
  type LucideIcon,
} from '@lucide/angular';

import { AuthorizationService } from '../authorization/authorization.service';
import {
  Permission,
  Permissions,
} from '../authorization/permissions';

export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly route?: string;
  readonly icon: LucideIcon;

  /**
   * Navigation visibility is ANY-of these permissions.
   *
   * A single-permission route simply contains one permission.
   */
  readonly permissions: readonly Permission[];

  readonly children?: readonly NavigationItem[];
}

export interface NavigationGroup {
  readonly label: string;
  readonly items: readonly NavigationItem[];
}

/**
 * ============================================================
 * CANONICAL TOP-LEVEL NAVIGATION ITEMS
 * ============================================================
 *
 * IMPORTANT:
 *
 * Keep this as a keyed object.
 *
 * app.routes.ts
 * AuthenticatedLandingService
 * HeaderComponent
 *
 * already depend on this contract.
 */
export const APP_NAVIGATION_ITEMS = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    icon: LucideLayoutDashboard,
    permissions: [
      Permissions.Dashboard.View,
    ],
  },

  clients: {
    id: 'clients',
    label: 'Clients',
    route: '/clients',
    icon: LucideUsers,
    permissions: [
      Permissions.Client.View,
    ],
  },

  employees: {
    id: 'employees',
    label: 'Employees',
    route: '/employees',
    icon: LucideContactRound,
    permissions: [
      Permissions.Employee.View,
    ],
  },

  dhsLibrary: {
    id: 'dhs-library',
    label: 'DHS Library',
    route: '/dhs-library',
    icon: LucideLibrary,
    permissions: [
      Permissions.DHSLibrary.View,
    ],
  },

  documents: {
    id: 'documents',
    label: 'Documents',
    route: '/documents',
    icon: LucideFiles,
    permissions: [
      Permissions.ClientDocument.View,
      Permissions.EmployeeDocument.View,
      Permissions.TrainingDocument.View,
      Permissions.BackgroundCheckDocument.View,
    ],
  },

  expiryReview: {
    id: 'expiry-review',
    label: 'Expiry & Review',
    route: '/expiry-review',
    icon: LucideCalendarClock,
    permissions: [
      Permissions.ExpiryReview.View,
    ],
  },

  training: {
    id: 'training',
    label: 'Training',
    route: '/training',
    icon: LucideGraduationCap,
    permissions: [
      Permissions.Training.View,
    ],
  },

  backgroundChecks: {
    id: 'background-checks',
    label: 'Background Checks',
    route: '/background-checks',
    icon: LucideShieldCheck,
    permissions: [
      Permissions.BackgroundCheck.View,
    ],
  },

  notifications: {
    id: 'notifications',
    label: 'Notifications',
    route: '/notifications',
    icon: LucideBell,
    permissions: [
      Permissions.Notification.View,
    ],
  },

  reports: {
    id: 'reports',
    label: 'Reports',
    route: '/reports',
    icon: LucideChartNoAxesColumn,
    permissions: [
      Permissions.FinancialReport.View,
    ],
  },

  accessControl: {
    id: 'access-control',
    label: 'Access Management',
    route: '/access-control',
    icon: LucideUserRoundCog,

    permissions: [
      Permissions.User.View,
      Permissions.User.Manage,
      Permissions.Role.View,
      Permissions.Role.Manage,
      Permissions.Permission.View,
      Permissions.Permission.Manage,
      Permissions.AuditLog.View,
    ],

    children: [
      {
        id: 'register-user',
        label: 'Register User',
        route: '/access-control/register-user',
        icon: LucideFilePlus2,
        permissions: [
          Permissions.User.Manage,
        ],
      },

      {
        id: 'users',
        label: 'Users',
        route: '/access-control/users',
        icon: LucideUsers,
        permissions: [
          Permissions.User.View,
        ],
      },

      {
        id: 'roles',
        label: 'Roles',
        route: '/access-control/roles',
        icon: LucideShieldCheck,
        permissions: [
          Permissions.Role.View,
        ],
      },

      {
        id: 'permissions',
        label: 'Permissions',
        route: '/access-control/permissions',
        icon: LucideListChecks,
        permissions: [
          Permissions.Permission.View,
        ],
      },

      {
        id: 'audit-logs',
        label: 'Audit Logs',
        route: '/access-control/audit-logs',
        icon: LucideBookOpen,
        permissions: [
          Permissions.AuditLog.View,
        ],
      },
    ],
  },
} as const satisfies Record<string, NavigationItem>;

/**
 * ============================================================
 * AUTHENTICATED LANDING ORDER
 * ============================================================
 *
 * Used by AuthenticatedLandingService.
 *
 * Do not put child administration pages here.
 * The landing service should land on the module root.
 */
export const APP_NAVIGATION_ORDER: readonly NavigationItem[] = [
  APP_NAVIGATION_ITEMS.dashboard,
  APP_NAVIGATION_ITEMS.clients,
  APP_NAVIGATION_ITEMS.employees,
  APP_NAVIGATION_ITEMS.dhsLibrary,
  APP_NAVIGATION_ITEMS.documents,
  APP_NAVIGATION_ITEMS.training,
  APP_NAVIGATION_ITEMS.backgroundChecks,
  APP_NAVIGATION_ITEMS.expiryReview,
  APP_NAVIGATION_ITEMS.notifications,
  APP_NAVIGATION_ITEMS.reports,
  APP_NAVIGATION_ITEMS.accessControl,
];

/**
 * ============================================================
 * SIDEBAR GROUPS
 * ============================================================
 *
 * Sidebar uses this presentation grouping.
 *
 * This is intentionally separate from APP_NAVIGATION_ITEMS so
 * route metadata and landing logic keep their existing contract.
 */
export const APP_NAVIGATION_GROUPS: readonly NavigationGroup[] = [
  {
    label: 'Overview',
    items: [
      APP_NAVIGATION_ITEMS.dashboard,
    ],
  },

  {
    label: 'People',
    items: [
      APP_NAVIGATION_ITEMS.clients,
      APP_NAVIGATION_ITEMS.employees,
    ],
  },

  {
    label: 'Compliance',
    items: [
      APP_NAVIGATION_ITEMS.dhsLibrary,
      APP_NAVIGATION_ITEMS.documents,
      APP_NAVIGATION_ITEMS.expiryReview,
      APP_NAVIGATION_ITEMS.training,
      APP_NAVIGATION_ITEMS.backgroundChecks,
    ],
  },

  {
    label: 'Operations',
    items: [
      APP_NAVIGATION_ITEMS.notifications,
      APP_NAVIGATION_ITEMS.reports,
    ],
  },

  {
    label: 'Administration',
    items: [
      APP_NAVIGATION_ITEMS.accessControl,
    ],
  },
];

/**
 * Returns true when the current user has ANY permission required
 * by the navigation item.
 */
export function canViewNavigationItem(
  authorization: AuthorizationService,
  item: NavigationItem,
): boolean {
  if (item.permissions.length === 0) {
    return false;
  }

  return authorization.hasAnyPermission(item.permissions);
}

/**
 * Finds both top-level and nested navigation items.
 *
 * HeaderComponent can therefore resolve page context for:
 *
 * /access-control
 * /access-control/register-user
 * /access-control/users
 * etc.
 */
export function findNavigationItem(
  url: string,
): NavigationItem | undefined {
  const normalizedUrl = normalizeUrl(url);

  const exactChild = APP_NAVIGATION_ORDER
    .flatMap((item) => item.children ?? [])
    .find(
      (item) =>
        item.route !== undefined &&
        normalizeUrl(item.route) === normalizedUrl,
    );

  if (exactChild) {
    return exactChild;
  }

  const exactTopLevel = APP_NAVIGATION_ORDER.find(
    (item) =>
      item.route !== undefined &&
      normalizeUrl(item.route) === normalizedUrl,
  );

  if (exactTopLevel) {
    return exactTopLevel;
  }

  const nestedChild = APP_NAVIGATION_ORDER
    .flatMap((item) => item.children ?? [])
    .find(
      (item) =>
        item.route !== undefined &&
        normalizedUrl.startsWith(
          `${normalizeUrl(item.route)}/`,
        ),
    );

  if (nestedChild) {
    return nestedChild;
  }

  return APP_NAVIGATION_ORDER.find(
    (item) =>
      item.route !== undefined &&
      normalizedUrl.startsWith(
        `${normalizeUrl(item.route)}/`,
      ),
  );
}

function normalizeUrl(url: string): string {
  const withoutQuery = url.split('?')[0] ?? url;
  const withoutFragment = withoutQuery.split('#')[0] ?? withoutQuery;

  if (
    withoutFragment.length > 1 &&
    withoutFragment.endsWith('/')
  ) {
    return withoutFragment.slice(0, -1);
  }

  return withoutFragment;
}