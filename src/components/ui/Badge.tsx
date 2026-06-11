import { clsx } from 'clsx';
import { getStatusText } from '../../utils/format';

interface BadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-dark-600 text-dark-200 border-dark-500',
  success: 'bg-accent-green/20 text-accent-green border-accent-green/30',
  warning: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
  danger: 'bg-accent-red/20 text-accent-red border-accent-red/30',
  info: 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',
};

const statusVariants: Record<string, string> = {
  active: 'success',
  completed: 'success',
  resolved: 'success',
  closed: 'success',
  paid: 'success',
  approved: 'success',
  pending: 'warning',
  delivering: 'warning',
  submitted: 'warning',
  processing: 'warning',
  unpaid: 'warning',
  current: 'info',
  expired: 'danger',
  suspended: 'danger',
  failed: 'danger',
  overdue: 'danger',
  rejected: 'danger',
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'default',
};

export const Badge = ({ status, variant, className }: BadgeProps) => {
  const v = variant || statusVariants[status] || 'default';
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[v],
        className
      )}
    >
      {getStatusText(status)}
    </span>
  );
};
