import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  delay?: number;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'from-accent-cyan/20 to-accent-purple/20',
  delay = 0,
}: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card card-hover p-6 relative overflow-hidden"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-30`}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-dark-400 text-sm mb-1">{title}</p>
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: delay + 0.2 }}
              className="text-3xl font-bold font-display text-white"
            >
              {value}
            </motion.p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center">
            <Icon className="w-6 h-6 text-accent-cyan" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            <span
              className={clsx(
                'text-sm font-medium',
                trend.isPositive ? 'text-accent-green' : 'text-accent-red'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-dark-500 text-sm">较上月</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
