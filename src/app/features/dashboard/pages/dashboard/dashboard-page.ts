import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import {
  LucideCalendarClock,
  LucideCircleAlert,
  LucideContactRound,
  LucideFileQuestion,
  LucideFiles,
  LucideGraduationCap,
  LucideShieldCheck,
  LucideUsers,
  LucideDynamicIcon,
  type LucideIcon,
} from '@lucide/angular';

interface AttentionItem {
  readonly label: string;
  readonly value: string;
  readonly context: string;
  readonly icon: LucideIcon;
  readonly toneClass: string;
  readonly iconClass: string;
}

interface SnapshotItem {
  readonly label: string;
  readonly value: string;
  readonly context: string;
  readonly change: string;
  readonly icon: LucideIcon;
}

interface ReadinessItem {
  readonly label: string;
  readonly value: number;
  readonly detail: string;
  readonly barClass: string;
}

interface UpcomingItem {
  readonly requirement: string;
  readonly record: string;
  readonly due: string;
  readonly status: string;
  readonly statusClass: string;
}

interface ActivityItem {
  readonly title: string;
  readonly detail: string;
  readonly time: string;
  readonly toneClass: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [LucideDynamicIcon, NgClass],
  templateUrl: './dashboard-page.html',
})
export class DashboardPageComponent {
  readonly complianceScore = 88;

  readonly attentionItems: readonly AttentionItem[] = [
    {
      label: 'Expired',
      value: '12',
      context: 'Require immediate attention',
      icon: LucideCircleAlert,
      toneClass: 'border-expired/25 bg-expired/5',
      iconClass: 'bg-expired/10 text-expired',
    },
    {
      label: 'Expiring Soon',
      value: '28',
      context: 'Within the next 30 days',
      icon: LucideCalendarClock,
      toneClass: 'border-expiring-soon/25 bg-expiring-soon/5',
      iconClass: 'bg-expiring-soon/10 text-expiring-soon',
    },
    {
      label: 'Review Due',
      value: '9',
      context: 'Awaiting compliance review',
      icon: LucideShieldCheck,
      toneClass: 'border-review-due/25 bg-review-due/5',
      iconClass: 'bg-review-due/10 text-review-due',
    },
    {
      label: 'Missing Documents',
      value: '14',
      context: 'Incomplete requirements',
      icon: LucideFileQuestion,
      toneClass: 'border-warning/25 bg-warning/5',
      iconClass: 'bg-warning/10 text-warning',
    },
  ];

  readonly snapshotItems: readonly SnapshotItem[] = [
    {
      label: 'Active Clients',
      value: '86',
      context: 'Preview total',
      change: '+4 this month',
      icon: LucideUsers,
    },
    {
      label: 'Active Employees',
      value: '124',
      context: 'Preview total',
      change: '+7 this month',
      icon: LucideContactRound,
    },
    {
      label: 'Current Documents',
      value: '91%',
      context: 'Document readiness',
      change: '+2.4% improvement',
      icon: LucideFiles,
    },
    {
      label: 'Training Compliance',
      value: '88%',
      context: 'Workforce completion',
      change: '+3.1% improvement',
      icon: LucideGraduationCap,
    },
  ];

  readonly readinessItems: readonly ReadinessItem[] = [
    {
      label: 'Current',
      value: 72,
      detail: '72%',
      barClass: 'bg-active',
    },
    {
      label: 'Expiring soon',
      value: 16,
      detail: '16%',
      barClass: 'bg-expiring-soon',
    },
    {
      label: 'Review due',
      value: 8,
      detail: '8%',
      barClass: 'bg-review-due',
    },
    {
      label: 'Expired',
      value: 4,
      detail: '4%',
      barClass: 'bg-expired',
    },
  ];

  readonly upcomingItems: readonly UpcomingItem[] = [
    {
      requirement: 'Annual training verification',
      record: 'Employee compliance record',
      due: 'In 5 days',
      status: 'Expiring Soon',
      statusClass: 'bg-expiring-soon/10 text-expiring-soon',
    },
    {
      requirement: 'Document review',
      record: 'Client compliance record',
      due: 'Today',
      status: 'Review Due',
      statusClass: 'bg-review-due/10 text-review-due',
    },
    {
      requirement: 'Background check renewal',
      record: 'Employee compliance record',
      due: 'In 12 days',
      status: 'Current',
      statusClass: 'bg-active/10 text-active',
    },
    {
      requirement: 'Service authorization review',
      record: 'Client compliance record',
      due: 'In 16 days',
      status: 'Current',
      statusClass: 'bg-active/10 text-active',
    },
  ];

  readonly dhsUpdates = [
    {
      title: 'Program policy update',
      revision: 'Policy guidance updated',
      status: 'Updated',
    },
    {
      title: 'Provider compliance form',
      revision: 'New revision available',
      status: 'Review',
    },
    {
      title: 'Licensing guidance',
      revision: 'Guidance publication',
      status: 'Published',
    },
  ] as const;

  readonly workforceReadiness = [
    {
      label: 'Training',
      value: '88%',
      context: 'Completion rate',
    },
    {
      label: 'Background Checks',
      value: '94%',
      context: 'Currently valid',
    },
    {
      label: 'Employee Documents',
      value: '91%',
      context: 'Document readiness',
    },
  ] as const;

  readonly recentActivity: readonly ActivityItem[] = [
    {
      title: 'Document review completed',
      detail: 'Employee compliance record',
      time: '12 min ago',
      toneClass: 'bg-active',
    },
    {
      title: 'Training requirement updated',
      detail: 'Annual training verification',
      time: '38 min ago',
      toneClass: 'bg-info',
    },
    {
      title: 'Compliance review became due',
      detail: 'Client compliance record',
      time: '1 hr ago',
      toneClass: 'bg-review-due',
    },
    {
      title: 'Document expiration detected',
      detail: 'Employee compliance record',
      time: '2 hrs ago',
      toneClass: 'bg-expired',
    },
  ];
}
