import {
  LucideBell,
  LucideBookOpen,
  LucideBuilding2,
  LucideCalendarClock,
  LucideChartNoAxesColumn,
  LucideCircle,
  LucideContactRound,
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

const NAVIGATION_ICONS: Readonly<Record<string, LucideIcon>> = {
  dashboard: LucideLayoutDashboard,
  clients: LucideUsers,
  employees: LucideContactRound,
  'dhs-library': LucideLibrary,
  documents: LucideFiles,
  'expiry-review': LucideCalendarClock,
  training: LucideGraduationCap,
  'background-checks': LucideShieldCheck,
  notifications: LucideBell,
  reports: LucideChartNoAxesColumn,
  companies: LucideBuilding2,
  'access-management': LucideUserRoundCog,
  users: LucideUsers,
  roles: LucideShieldCheck,
  permissions: LucideListChecks,
  'audit-logs': LucideBookOpen,
};

export function resolveNavigationIcon(iconKey: string): LucideIcon {
  return NAVIGATION_ICONS[iconKey] ?? LucideCircle;
}
