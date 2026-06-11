import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gauge,
  TrendingUp,
  AlertTriangle,
  Plus,
  BarChart3,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useStore } from '../../store/useStore';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { formatNumber, formatPercentage } from '../../utils/format';
import { formatDate } from '../../utils/date';
import { clsx } from 'clsx';

export const QuotaPage = () => {
  const { quotas, user, addApproval, pushNotification } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([quotas[0]?.id || ''].filter(Boolean));
  const [showExpandModal, setShowExpandModal] = useState(false);
  const [expandQuotaAmount, setExpandQuotaAmount] = useState<number>(10000);
  const [expandReason, setExpandReason] = useState('');
  const [expandDuration, setExpandDuration] = useState('30');
  const [selectedQuotaId, setSelectedQuotaId] = useState<string>('');

  const tabs = [
    { key: 'overview', label: '额度总览' },
    { key: 'trend', label: '使用趋势' },
    { key: 'compare', label: '产品对比' },
  ];

  const totalQuota = quotas.reduce((sum, q) => sum + q.totalQuota, 0);
  const totalUsed = quotas.reduce((sum, q) => sum + q.usedQuota, 0);
  const overallUsage = totalQuota > 0 ? (totalUsed / totalQuota) * 100 : 0;
  const alertCount = quotas.filter((q) => (q.usedQuota / q.totalQuota) * 100 >= q.alertThreshold).length;

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getTrendData = () => {
    const selectedQuotas = quotas.filter((q) => selectedProducts.includes(q.id));
    if (selectedQuotas.length === 0) return [];

    const dateMap: Record<string, Record<string, string | number>> = {};
    selectedQuotas.forEach((quota) => {
      quota.usageHistory.forEach((record) => {
        if (!dateMap[record.date]) {
          dateMap[record.date] = { date: record.date };
        }
        dateMap[record.date][quota.productName] = record.usage;
      });
    });

    return Object.values(dateMap);
  };

  const getCompareData = () => {
    return quotas.map((q) => ({
      name: q.productName.replace('数据', ''),
      已使用: q.usedQuota,
      剩余额度: q.totalQuota - q.usedQuota,
    }));
  };

  const colors = ['#06B6D4', '#8B5CF6', '#F97316', '#10B981', '#EF4444'];

  const handleExpandSubmit = () => {
    if (!selectedQuotaId || !expandReason.trim()) return;
    const quota = quotas.find((q) => q.id === selectedQuotaId);
    if (!quota) return;

    const approvalId = `a_${Date.now()}`;
    addApproval({
      id: approvalId,
      type: 'quota_expand',
      title: `${quota.productName}临时扩容申请`,
      subscriptionId: quota.subscriptionId,
      productName: quota.productName,
      applicant: user.name,
      applyTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      reason: `申请扩容额度：${expandQuotaAmount} 次，有效期 ${expandDuration} 天。${expandReason}`,
      status: 'pending',
      currentNode: 0,
      nodes: [
        { id: `n_${Date.now()}_1`, name: '部门主管审批', approver: '王总', status: 'current' },
        { id: `n_${Date.now()}_2`, name: '财务审核', approver: '赵丽', status: 'pending' },
      ],
    });

    pushNotification({
      type: 'quota',
      title: '扩容申请已提交',
      message: `【${quota.productName}】扩容 ${expandQuotaAmount} 次的申请已提交，请等待审批。`,
      page: 'approval',
      params: { id: approvalId },
    });

    setShowExpandModal(false);
    setExpandReason('');
    setExpandQuotaAmount(10000);
    setExpandDuration('30');
    setSelectedQuotaId('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="card p-6 flex items-center gap-6"
        >
          <ProgressRing value={totalUsed} max={totalQuota} size={100} />
          <div>
            <p className="text-dark-400 text-sm mb-1">整体使用率</p>
            <p className="text-2xl font-bold font-display text-white">
              {formatPercentage(overallUsage)}
            </p>
            <p className="text-xs text-dark-500 mt-1">
              {formatNumber(totalUsed)} / {formatNumber(totalQuota)} 次
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent-green/20 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">活跃产品</p>
              <p className="text-2xl font-bold font-display text-white">{quotas.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-accent-green">
            <ArrowUpRight className="w-3 h-3" />
            <span>全部正常运行</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent-orange/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-accent-orange" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">额度预警</p>
              <p className="text-2xl font-bold font-display text-white">{alertCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-accent-orange">
            <AlertTriangle className="w-3 h-3" />
            <span>需及时关注</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">本月调用</p>
              <p className="text-2xl font-bold font-display text-white">{formatNumber(totalUsed)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-accent-cyan">
            <Calendar className="w-3 h-3" />
            <span>较上月 +12.5%</span>
          </div>
        </motion.div>
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="grid gap-4">
          {quotas.map((quota, index) => {
            const usagePercent = (quota.usedQuota / quota.totalQuota) * 100;
            const isAlert = usagePercent >= quota.alertThreshold;
            return (
              <motion.div
                key={quota.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card card-hover p-6"
              >
                <div className="flex items-center gap-6">
                  <ProgressRing
                    value={quota.usedQuota}
                    max={quota.totalQuota}
                    size={90}
                    label={quota.unit}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{quota.productName}</h3>
                      {isAlert && (
                        <Badge status="critical" />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-dark-400 mb-1">总额度</p>
                        <p className="text-lg font-semibold text-white">{formatNumber(quota.totalQuota)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-400 mb-1">已使用</p>
                        <p className="text-lg font-semibold text-accent-cyan">{formatNumber(quota.usedQuota)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-400 mb-1">剩余</p>
                        <p className={clsx(
                          'text-lg font-semibold',
                          isAlert ? 'text-accent-red' : 'text-accent-green'
                        )}>
                          {formatNumber(quota.totalQuota - quota.usedQuota)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-dark-400">
                        <Calendar className="w-4 h-4" />
                        <span>重置周期：{quota.resetCycle === 'monthly' ? '每月' : quota.resetCycle === 'daily' ? '每日' : '每年'}</span>
                      </div>
                      <div className="flex-1" />
                      <button
                        onClick={() => {
                          setSelectedQuotaId(quota.id);
                          setShowExpandModal(true);
                        }}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        申请扩容
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {quotas.map((quota, index) => (
              <button
                key={quota.id}
                onClick={() => toggleProduct(quota.id)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  selectedProducts.includes(quota.id)
                    ? 'text-white shadow-lg'
                    : 'bg-dark-700/50 text-dark-400 hover:text-white hover:bg-dark-700'
                )}
                style={selectedProducts.includes(quota.id) ? {
                  backgroundColor: colors[index % colors.length] + '30',
                  borderColor: colors[index % colors.length],
                  borderWidth: 1,
                  color: colors[index % colors.length],
                } : {}}
              >
                {quota.productName}
              </button>
            ))}
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-cyan" />
              调用趋势（近30天）
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getTrendData()}>
                  <defs>
                    {quotas.map((q, i) => (
                      <linearGradient key={q.id} id={`gradient-${q.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                  />
                  <Legend />
                  {quotas.map((q, i) =>
                    selectedProducts.includes(q.id) && (
                      <Area
                        key={q.id}
                        type="monotone"
                        dataKey={q.productName}
                        stroke={colors[i % colors.length]}
                        fill={`url(#gradient-${q.id})`}
                        strokeWidth={2}
                      />
                    )
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent-cyan" />
            产品使用量对比
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getCompareData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend />
                <Bar dataKey="已使用" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="剩余额度" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <Modal
        isOpen={showExpandModal}
        onClose={() => { setShowExpandModal(false); setExpandReason(''); setSelectedQuotaId(''); }}
        title="申请临时扩容"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-dark-700/30">
            <p className="text-sm text-dark-400 mb-1">申请人</p>
            <p className="font-medium text-white">{user.name} · {user.department}</p>
            {selectedQuotaId && (
              <>
                <p className="text-sm text-dark-400 mt-2 mb-1">申请产品</p>
                <p className="font-medium text-white">{quotas.find((q) => q.id === selectedQuotaId)?.productName}</p>
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              申请扩容额度
            </label>
            <input
              type="number"
              value={expandQuotaAmount}
              onChange={(e) => setExpandQuotaAmount(Number(e.target.value))}
              className="input-field"
              placeholder="请输入扩容额度"
            />
            <p className="text-xs text-dark-500 mt-1">单位：次</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              有效期
            </label>
            <select
              value={expandDuration}
              onChange={(e) => setExpandDuration(e.target.value)}
              className="input-field"
            >
              <option value="7">7 天</option>
              <option value="15">15 天</option>
              <option value="30">30 天</option>
              <option value="60">60 天</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              扩容理由
            </label>
            <textarea
              rows={4}
              value={expandReason}
              onChange={(e) => setExpandReason(e.target.value)}
              className="input-field resize-none"
              placeholder="请详细说明扩容理由和使用场景..."
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <button onClick={() => { setShowExpandModal(false); setExpandReason(''); setSelectedQuotaId(''); }} className="btn-secondary">
              取消
            </button>
            <button
              onClick={handleExpandSubmit}
              className="btn-primary"
              disabled={!expandReason.trim() || !selectedQuotaId}
            >
              提交申请
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
