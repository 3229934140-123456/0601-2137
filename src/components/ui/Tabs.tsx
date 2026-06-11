import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'default' | 'pills';
}

export const Tabs = ({ tabs, activeKey, onChange, variant = 'default' }: TabsProps) => {
  return (
    <div className={clsx(
      'flex gap-1',
      variant === 'default' ? 'border-b border-dark-700' : ''
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            'relative px-4 py-2.5 text-sm font-medium transition-colors duration-200 flex items-center gap-2',
            variant === 'default'
              ? activeKey === tab.key
                ? 'text-accent-cyan'
                : 'text-dark-400 hover:text-dark-200'
              : activeKey === tab.key
              ? 'text-white bg-dark-700/50'
              : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50 rounded-lg'
          )}
        >
          {tab.icon}
          {tab.label}
          {variant === 'default' && activeKey === tab.key && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-cyan to-accent-purple"
            />
          )}
        </button>
      ))}
    </div>
  );
};
