import { motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/subscription': {
    title: '产品订阅',
    description: '管理您已订阅的数据产品，申请开通新的产品服务',
  },
  '/delivery': {
    title: '交付日历',
    description: '查看数据交付计划，跟踪交付批次，下载服务报告',
  },
  '/quota': {
    title: '调用额度',
    description: '监控各产品额度使用情况，申请临时扩容',
  },
  '/quality': {
    title: '质量反馈',
    description: '提交数据质量问题，跟踪处理进度，评价服务质量',
  },
  '/billing': {
    title: '费用账单',
    description: '查看消费明细，核对账单，汇总部门采购成本',
  },
  '/members': {
    title: '权限成员',
    description: '管理团队成员，配置角色权限',
  },
  '/approval': {
    title: '续订审批',
    description: '处理续订、停订、扩容等审批事项',
  },
};

export const MainLayout = () => {
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || { title: '', description: '' };

  return (
    <div className="min-h-screen bg-dark-900 grid-pattern">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-bold font-display text-white mb-1">
              {pageInfo.title}
            </h1>
            <p className="text-dark-400">{pageInfo.description}</p>
          </motion.div>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
