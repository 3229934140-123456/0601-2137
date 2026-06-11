import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  Package,
  Gauge,
  FileCheck,
  MessageSquareWarning,
  Receipt,
  LayoutGrid,
  Calendar,
  CheckCheck,
  Filter,
  Clock,
  ChevronRight,
  Inbox,
  Search,
  X,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getRelativeTime } from '../../utils/date';
import { getTypeText } from '../../utils/format';
import { clsx } from 'clsx';
import type { Notification } from '../../data/types';

type NotifTypeFilter = 'all' | 'delivery' | 'quota' | 'approval' | 'quality' | 'billing' | 'subscription';
type ReadFilter = 'all' | 'unread' | 'read';
type TimeFilter = 'all' | 'today' | '7d' | '30d';

const PAGE_MAP: Record<string, string> = {
  subscription: '/subscription',
  delivery: '/delivery',
  quota: '/quota',
  quality: '/quality',
  billing: '/billing',
  members: '/members',
  approval: '/approval',
};

const TYPE_META: Record<string, { label: string; icon: any; color: string; bg: string; badge: string }> = {
  delivery: { label: '交付通知', icon: Package, color: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/30', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  quota: { label: '额度提醒', icon: Gauge, color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/30', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  approval: { label: '审批通知', icon: FileCheck, color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  quality: { label: '质量反馈', icon: MessageSquareWarning, color: 'text-rose-300', bg: 'bg-rose-500/10 border-rose-500/30', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  billing: { label: '账单通知', icon: Receipt, color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/30', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  subscription: { label: '订阅通知', icon: LayoutGrid, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10 border-accent-cyan/30', badge: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30' },
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setPendingDetailId,
  } = useStore();

  const [typeFilter, setTypeFilter] = useState<NotifTypeFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchText, setSearchText] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeStats = useMemo(() => {
    const all = ['delivery', 'quota', 'approval', 'quality', 'billing', 'subscription'] as const;
    return all.map((t) => ({
      key: t,
      total: notifications.filter((n) => n.type === t).length,
      unread: notifications.filter((n) => n.type === t && !n.read).length,
    }));
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const now = new Date();
    return notifications.filter((n) => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (readFilter === 'unread' && n.read) return false;
      if (readFilter === 'read' && !n.read) return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        if (!n.title.toLowerCase().includes(s) && !n.message.toLowerCase().includes(s)) return false;
      }
      if (timeFilter !== 'all') {
        const d = new Date(n.createdAt);
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        if (timeFilter === 'today' && diffDays > 1) return false;
        if (timeFilter === '7d' && diffDays > 7) return false;
        if (timeFilter === '30d' && diffDays > 30) return false;
      }
      return true;
    });
  }, [notifications, typeFilter, readFilter, timeFilter, searchText]);

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (readFilter !== 'all' ? 1 : 0) +
    (timeFilter !== 'all' ? 1 : 0) +
    (searchText ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter('all');
    setReadFilter('all');
    setTimeFilter('all');
    setSearchText('');
  };

  const handleNotificationClick = (n: Notification) => {
    markNotificationRead(n.id);
    if (n.page && PAGE_MAP[n.page]) {
      if (n.params?.id) {
        if (n.page === 'approval') {
          setPendingDetailId('approval', n.params.id);
        } else if (n.page === 'quality') {
          setPendingDetailId('quality', n.params.id);
        }
      }
      navigate(PAGE_MAP[n.page]);
    }
  };

  const typeFilterOptions: { key: NotifTypeFilter; label: string }[] = [
    { key: 'all', label: '全部类型' },
    { key: 'delivery', label: '交付通知' },
    { key: 'quota', label: '额度提醒' },
    { key: 'approval', label: '审批通知' },
    { key: 'quality', label: '质量反馈' },
    { key: 'billing', label: '账单通知' },
    { key: 'subscription', label: '订阅通知' },
  ];

  const readFilterOptions: { key: ReadFilter; label: string }[] = [
    { key: 'all', label: '全部状态' },
    { key: 'unread', label: '未读' },
    { key: 'read', label: '已读' },
  ];

  const timeFilterOptions: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: '全部时间' },
    { key: 'today', label: '今天' },
    { key: '7d', label: '近 7 天' },
    { key: '30d', label: '近 30 天' },
  ];

  return (
    <div className="space-y-6">
      {/* 概览统计卡 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4"
      >
        <div className="card p-4 bg-gradient-to-br from-accent-cyan/10 to-accent-purple/10 border-accent-cyan/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
              <Inbox className="w-4 h-4 text-accent-cyan" />
            </div>
            {unreadCount > 0 && (
              <span className="badge badge-danger text-xs">{unreadCount} 未读</span>
            )}
          </div>
          <p className="text-2xl font-bold font-display text-white">{notifications.length}</p>
          <p className="text-xs text-dark-400 mt-1">消息总数</p>
        </div>
        {typeStats.map((s, idx) => {
          const meta = TYPE_META[s.key];
          const Icon = meta.icon;
          return (
            <button
              key={s.key}
              onClick={() => setTypeFilter(s.key as NotifTypeFilter)}
              className={clsx(
                'card p-4 text-left transition-all hover:border-accent-cyan/40',
                typeFilter === s.key && 'ring-2 ring-accent-cyan/40 border-accent-cyan/40'
              )}
              style={{ transitionDelay: `${idx * 0.03}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', meta.bg)}>
                  <Icon className={clsx('w-4 h-4', meta.color)} />
                </div>
                {s.unread > 0 && (
                  <span className="badge badge-danger text-xs">{s.unread}</span>
                )}
              </div>
              <p className="text-2xl font-bold font-display text-white">{s.total}</p>
              <p className="text-xs text-dark-400 mt-1">{meta.label}</p>
            </button>
          );
        })}
      </motion.div>

      {/* 筛选栏 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-dark-300">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">筛选</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索消息..."
              className="pl-9 pr-8 py-2 w-52 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-cyan/50 transition-colors"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as ReadFilter)}
            className="px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-accent-cyan/50"
          >
            {readFilterOptions.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NotifTypeFilter)}
            className="px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-accent-cyan/50"
          >
            {typeFilterOptions.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-dark-800/50 border border-dark-700 rounded-lg">
            {timeFilterOptions.map((o) => (
              <button
                key={o.key}
                onClick={() => setTimeFilter(o.key)}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  timeFilter === o.key
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {o.key !== 'all' && <Clock className="w-3 h-3" />}
                  {o.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs text-dark-300 hover:text-white hover:bg-dark-700/50 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              清除 ({activeFilterCount})
            </button>
          )}

          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 rounded-lg text-xs font-medium transition-colors border border-accent-cyan/30"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              全部标记已读
            </button>
          )}
        </div>
      </motion.div>

      {/* 激活的筛选徽章 */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          {typeFilter !== 'all' && (
            <span className={clsx('badge text-xs border', TYPE_META[typeFilter].badge)}>
              类型: {typeFilterOptions.find((o) => o.key === typeFilter)?.label}
              <button onClick={() => setTypeFilter('all')} className="ml-1.5 opacity-60 hover:opacity-100">×</button>
            </span>
          )}
          {readFilter !== 'all' && (
            <span className="badge badge-info text-xs border border-accent-cyan/30">
              {readFilter === 'unread' ? '仅未读' : '仅已读'}
              <button onClick={() => setReadFilter('all')} className="ml-1.5 opacity-60 hover:opacity-100">×</button>
            </span>
          )}
          {timeFilter !== 'all' && (
            <span className="badge badge-warning text-xs border border-amber-500/30">
              时间: {timeFilterOptions.find((o) => o.key === timeFilter)?.label}
              <button onClick={() => setTimeFilter('all')} className="ml-1.5 opacity-60 hover:opacity-100">×</button>
            </span>
          )}
          {searchText && (
            <span className="badge badge-success text-xs border border-emerald-500/30">
              搜索: "{searchText}"
              <button onClick={() => setSearchText('')} className="ml-1.5 opacity-60 hover:opacity-100">×</button>
            </span>
          )}
        </div>
      )}

      {/* 消息列表 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-dark-700/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent-cyan" />
            <h3 className="font-semibold text-white">消息列表</h3>
            <span className="text-xs text-dark-400">
              共 {filteredNotifications.length} 条
              {filteredNotifications.filter((n) => !n.read).length > 0 && (
                <span className="ml-1">
                  · 未读 {filteredNotifications.filter((n) => !n.read).length} 条
                </span>
              )}
            </span>
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-dark-800/50 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-dark-500" />
            </div>
            <p className="text-dark-300 font-medium mb-1">没有匹配的消息</p>
            <p className="text-xs text-dark-500">试试调整筛选条件，或稍后再来查看</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 rounded-lg transition-colors border border-accent-cyan/30"
              >
                清除所有筛选
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-dark-700/50 max-h-[620px] overflow-y-auto scrollbar-thin">
            {filteredNotifications.map((n, idx) => {
              const meta = TYPE_META[n.type] || TYPE_META.subscription;
              const Icon = meta.icon;
              const jumpable = !!n.page && !!PAGE_MAP[n.page!];
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.015, 0.3) }}
                  onClick={() => jumpable && handleNotificationClick(n)}
                  className={clsx(
                    'px-5 py-4 transition-all group',
                    jumpable && 'cursor-pointer hover:bg-dark-700/30',
                    !n.read && 'bg-accent-cyan/[0.03]'
                  )}
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 relative',
                          meta.bg,
                          !n.read && 'ring-2 ring-offset-2 ring-offset-dark-900 ring-accent-cyan/40'
                        )}
                      >
                        <Icon className={clsx('w-5 h-5', meta.color)} />
                        {!n.read && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-cyan border-2 border-dark-900" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={clsx('badge text-[10px] font-medium border', meta.badge)}>
                            {meta.label}
                          </span>
                          <h4
                            className={clsx(
                              'font-medium',
                              !n.read ? 'text-white' : 'text-dark-200'
                            )}
                          >
                            {n.title}
                          </h4>
                          {!n.read && (
                            <span className="badge badge-danger text-[10px] px-1.5">未读</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-dark-500 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(n.createdAt)}
                          </span>
                          {jumpable && (
                            <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-accent-cyan transition-colors" />
                          )}
                        </div>
                      </div>
                      <p className={clsx(
                        'text-sm leading-relaxed mb-2',
                        !n.read ? 'text-dark-300' : 'text-dark-400'
                      )}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-dark-500">
                        <span>{n.createdAt}</span>
                        {jumpable && (
                          <span className="inline-flex items-center gap-1 text-accent-cyan/70 group-hover:text-accent-cyan">
                            {n.page === 'approval' && '查看审批详情'}
                            {n.page === 'quality' && '查看问题详情'}
                            {n.page === 'subscription' && '前往订阅页'}
                            {n.page === 'delivery' && '前往交付日历'}
                            {n.page === 'quota' && '前往额度页'}
                            {n.page === 'billing' && '前往账单页'}
                            {n.page === 'members' && '前往成员页'}
                            {!['approval', 'quality', 'subscription', 'delivery', 'quota', 'billing', 'members'].includes(n.page!) && '查看详情'}
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                        {!jumpable && n.params?.id && (
                          <span className="text-dark-500">编号: {n.params.id}</span>
                        )}
                        {n.read && (
                          <span className="inline-flex items-center gap-1 text-emerald-400/70">
                            <CheckCheck className="w-3 h-3" />
                            已读
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
