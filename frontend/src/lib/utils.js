import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function getAlertTypeColor(type) {
  switch (type?.toLowerCase()) {
    case 'emergency':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    case 'advisory':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    case 'announcement':
      return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
    default:
      return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
  }
}

export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'status-pending';
    case 'in_progress':
      return 'status-in_progress';
    case 'resolved':
      return 'status-resolved';
    case 'rejected':
      return 'status-rejected';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  }
}

export function getAlertBorderClass(type) {
  switch (type?.toLowerCase()) {
    case 'emergency':
      return 'alert-emergency';
    case 'advisory':
      return 'alert-advisory';
    case 'announcement':
      return 'alert-announcement';
    default:
      return '';
  }
}
