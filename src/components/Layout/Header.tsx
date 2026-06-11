import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, ChevronDown, Settings, LogOut } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getRelativeTime } from '../../utils/date';
import { getTypeText } from '../../utils/format';
import { clsx } from 'clsx';

export const Header = () => {
  const navigate = useNavigate();
  const { user, notifications, markNotificationRead, markAllNotificationsRead, setPendingDetailId } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      delivery: '📦',
      quota: '⚠️',
      approval: '✅',
      quality: '🔧',
      billing: '💰',
      subscription: '📋',
    };
    return icons[type] || '📢';
  };

  return (
    <header className="h-16 bg-dark-900/60 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="搜索产品、订阅、账单..."
            className="pl-10 pr-4 py-2 w-80 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-cyan/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent-red text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-96 card p-0 overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-dark-700">
                  <h3 className="font-semibold text-white">通知中心</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="text-xs text-accent-cyan hover:underline"
                    >
                      全部已读
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-dark-400">
                      暂无通知
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          markNotificationRead(notification.id);
                          const pageMap: Record<string, string> = {
                            subscription: '/subscription',
                            delivery: '/delivery',
                            quota: '/quota',
                            quality: '/quality',
                            billing: '/billing',
                            members: '/members',
                            approval: '/approval',
                          };
                          if (notification.page && pageMap[notification.page]) {
                            if (notification.params?.id) {
                              if (notification.page === 'approval') {
                                setPendingDetailId('approval', notification.params.id);
                              } else if (notification.page === 'quality') {
                                setPendingDetailId('quality', notification.params.id);
                              }
                            }
                            setShowNotifications(false);
                            navigate(pageMap[notification.page]);
                          }
                        }}
                        className={clsx(
                          'p-4 border-b border-dark-700/50 hover:bg-dark-700/30 cursor-pointer transition-colors',
                          !notification.read && 'bg-accent-cyan/5'
                        )}
                      >
                        <div className="flex gap-3">
                          <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="badge badge-info text-xs">
                                {getTypeText(notification.type)}
                              </span>
                              <span className="text-xs text-dark-500">
                                {getRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-white mb-0.5">
                              {notification.title}
                            </p>
                            <p className="text-xs text-dark-400 truncate">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-accent-cyan mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-dark-700/50 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-dark-400">{user.department}</p>
            </div>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full bg-dark-600"
            />
            <ChevronDown className="w-4 h-4 text-dark-400" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-56 card p-2"
              >
                <div className="p-3 border-b border-dark-700 mb-2">
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-xs text-dark-400">{user.email}</p>
                </div>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-300 hover:bg-dark-700/50 hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                  账号设置
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-accent-red hover:bg-accent-red/10 transition-colors">
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
