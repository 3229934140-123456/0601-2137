import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Calendar,
  Gauge,
  MessageSquareWarning,
  Receipt,
  Users,
  FileCheck,
  Database,
} from 'lucide-react';

const navItems = [
  { path: '/subscription', label: '产品订阅', icon: LayoutGrid },
  { path: '/delivery', label: '交付日历', icon: Calendar },
  { path: '/quota', label: '调用额度', icon: Gauge },
  { path: '/quality', label: '质量反馈', icon: MessageSquareWarning },
  { path: '/billing', label: '费用账单', icon: Receipt },
  { path: '/members', label: '权限成员', icon: Users },
  { path: '/approval', label: '续订审批', icon: FileCheck },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-white">数据要素平台</h1>
            <p className="text-xs text-dark-400">订阅管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <NavLink
                  to={item.path}
                  className={clsx(
                    'sidebar-item group',
                    isActive && 'sidebar-item-active'
                  )}
                >
                  <Icon
                    className={clsx(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-accent-cyan' : 'text-dark-400 group-hover:text-white'
                    )}
                  />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveDot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-cyan"
                    />
                  )}
                </NavLink>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-dark-700/50">
        <div className="card p-4 bg-gradient-to-br from-accent-cyan/10 to-accent-purple/10 border-accent-cyan/20">
          <p className="text-sm text-dark-300 mb-2">需要帮助？</p>
          <p className="text-xs text-dark-400 mb-3">查看使用文档或联系客服</p>
          <button className="w-full text-sm px-3 py-2 rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 transition-colors font-medium">
            查看帮助中心
          </button>
        </div>
      </div>
    </aside>
  );
};
