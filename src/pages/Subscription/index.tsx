import { useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Eye,
  Users,
  Settings,
  RefreshCw,
  ChevronRight,
  Filter,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { formatDate, getDaysRemaining } from '../../utils/date';
import { formatCurrency, formatNumber, getRoleText, truncateText } from '../../utils/format';
import type { Product, Subscription, Receiver } from '../../data/types';

export const SubscriptionPage = () => {
  const { subscriptions, products, user, addSubscription, addApproval, updateSubscription, pushNotification } = useStore();
  const [activeTab, setActiveTab] = useState('my');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReceiversModal, setShowReceiversModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applyReason, setApplyReason] = useState('');
  const [applyDuration, setApplyDuration] = useState('12');
  const [applyAutoRenewal, setApplyAutoRenewal] = useState('true');
  const [newReceiverName, setNewReceiverName] = useState('');
  const [newReceiverEmail, setNewReceiverEmail] = useState('');
  const [newReceiverPhone, setNewReceiverPhone] = useState('');
  const [newReceiverDept, setNewReceiverDept] = useState('');

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const pendingCount = subscriptions.filter((s) => s.status === 'pending').length;
  const expiringCount = subscriptions.filter(
    (s) => s.status === 'active' && getDaysRemaining(s.endDate) <= 30
  ).length;
  const expiredCount = subscriptions.filter((s) => s.status === 'expired').length;

  const filteredSubscriptions = subscriptions.filter((s) => {
    const matchesSearch = s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableProducts = products.filter(
    (p) => !subscriptions.some((s) => s.productId === p.id && s.status !== 'expired')
  );

  const tabs = [
    { key: 'my', label: '我的订阅' },
    { key: 'catalog', label: '产品目录' },
  ];

  const handleApplyProduct = () => {
    if (!selectedProduct) return;
    const duration = parseInt(applyDuration, 10);
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + duration);

    const newSub: Subscription = {
      id: `s_${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      provider: selectedProduct.provider,
      status: 'pending',
      startDate: formatDate(now),
      endDate: formatDate(endDate),
      quota: selectedProduct.defaultQuota,
      usedQuota: 0,
      receivers: [
        { id: `r_${Date.now()}`, name: user.name, email: user.email, phone: user.phone, department: user.department },
      ],
      autoRenewal: applyAutoRenewal === 'true',
      createdAt: formatDate(now),
    };

    addSubscription(newSub);

    const approvalId = `a_${Date.now()}`;
    addApproval({
      id: approvalId,
      type: 'new_subscription',
      title: `${selectedProduct.name}开通申请`,
      subscriptionId: newSub.id,
      productName: selectedProduct.name,
      applicant: user.name,
      applyTime: formatDate(now, 'YYYY-MM-DD HH:mm:ss'),
      reason: applyReason || `申请开通${selectedProduct.name}，订阅周期${duration}个月。`,
      status: 'pending',
      currentNode: 0,
      nodes: [
        { id: `n_${Date.now()}_1`, name: '部门主管审批', approver: '王总', status: 'current' },
        { id: `n_${Date.now()}_2`, name: '财务审核', approver: '赵丽', status: 'pending' },
        { id: `n_${Date.now()}_3`, name: '总经理审批', approver: '李总', status: 'pending' },
      ],
    });

    pushNotification({
      type: 'subscription',
      title: '新订申请已提交',
      message: `【${selectedProduct.name}】的开通申请已提交，请等待审批。`,
      page: 'approval',
      params: { id: approvalId },
    });

    setShowApplyModal(false);
    setApplyReason('');
    setApplyDuration('12');
    setApplyAutoRenewal('true');
    setSelectedProduct(null);
  };

  const handleAddReceiver = () => {
    if (!selectedSubscription || !newReceiverName.trim() || !newReceiverEmail.trim()) return;
    const newReceiver: Receiver = {
      id: `r_${Date.now()}`,
      name: newReceiverName.trim(),
      email: newReceiverEmail.trim(),
      phone: newReceiverPhone.trim(),
      department: newReceiverDept.trim(),
    };
    const updated: Subscription = {
      ...selectedSubscription,
      receivers: [...selectedSubscription.receivers, newReceiver],
    };
    updateSubscription(updated);
    setSelectedSubscription(updated);
    setNewReceiverName('');
    setNewReceiverEmail('');
    setNewReceiverPhone('');
    setNewReceiverDept('');
  };

  const handleRemoveReceiver = (receiverId: string) => {
    if (!selectedSubscription) return;
    const updated: Subscription = {
      ...selectedSubscription,
      receivers: selectedSubscription.receivers.filter((r) => r.id !== receiverId),
    };
    updateSubscription(updated);
    setSelectedSubscription(updated);
  };

  const handleOpenReceiversModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowReceiversModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="运行中订阅"
          value={activeCount}
          icon={CheckCircle}
          gradient="from-accent-green/20 to-accent-cyan/20"
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />
        <StatCard
          title="待生效"
          value={pendingCount}
          icon={Clock}
          gradient="from-accent-orange/20 to-accent-purple/20"
          delay={0.1}
        />
        <StatCard
          title="即将到期"
          value={expiringCount}
          icon={AlertTriangle}
          gradient="from-accent-orange/20 to-accent-red/20"
          trend={{ value: 5, isPositive: false }}
          delay={0.2}
        />
        <StatCard
          title="已过期"
          value={expiredCount}
          icon={Database}
          gradient="from-dark-600/20 to-dark-700/20"
          delay={0.3}
        />
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'my' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="搜索订阅产品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 input-field"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-40 py-2"
              >
                <option value="all">全部状态</option>
                <option value="active">运行中</option>
                <option value="pending">待生效</option>
                <option value="expired">已过期</option>
                <option value="suspended">已暂停</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredSubscriptions.map((subscription, index) => {
              const usagePercent = subscription.quota > 0 ? (subscription.usedQuota / subscription.quota) * 100 : 0;
              const daysRemaining = getDaysRemaining(subscription.endDate);
              return (
                <motion.div
                  key={subscription.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="card card-hover p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                        <Database className="w-6 h-6 text-accent-cyan" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-white">
                            {subscription.productName}
                          </h3>
                          <Badge status={subscription.status} />
                          {subscription.autoRenewal && (
                            <span className="flex items-center gap-1 text-xs text-accent-green">
                              <RefreshCw className="w-3 h-3" />
                              自动续订
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-dark-400 mb-3">{subscription.provider}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-dark-400">有效期：</span>
                            <span className="text-dark-200">
                              {formatDate(subscription.startDate)} ~ {formatDate(subscription.endDate)}
                            </span>
                          </div>
                          {daysRemaining > 0 && daysRemaining <= 30 && (
                            <div className="flex items-center gap-1 text-accent-orange">
                              <Clock className="w-4 h-4" />
                              <span>剩余 {daysRemaining} 天</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-dark-400" />
                            <span className="text-dark-200">
                              {subscription.receivers.length} 位接收人
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-dark-400">额度使用</span>
                            <span className="text-dark-200">
                              {formatNumber(subscription.usedQuota)} / {formatNumber(subscription.quota)}
                            </span>
                          </div>
                          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${usagePercent}%` }}
                              transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                              className={clsx(
                                'h-full rounded-full',
                                usagePercent >= 90
                                  ? 'bg-gradient-to-r from-accent-red to-accent-orange'
                                  : usagePercent >= 70
                                  ? 'bg-gradient-to-r from-accent-orange to-accent-cyan'
                                  : 'bg-gradient-to-r from-accent-cyan to-accent-green'
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReceiversModal(subscription)}
                        className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                        title="接收人配置"
                      >
                        <Users className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedSubscription(subscription)}
                        className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedSubscription(subscription)}
                        className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                        title="设置"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 btn-primary">
                        管理
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="grid grid-cols-2 gap-4">
          {availableProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="card card-hover p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 flex items-center justify-center flex-shrink-0">
                  <Database className="w-7 h-7 text-accent-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1">{product.name}</h3>
                  <p className="text-sm text-dark-400 mb-2">{product.provider}</p>
                  <p className="text-sm text-dark-300 mb-3 line-clamp-2">
                    {truncateText(product.description, 80)}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.dataType.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-0.5 text-xs rounded bg-dark-700/50 text-dark-300"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold font-display text-accent-cyan">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-sm text-dark-400">/{product.priceUnit === 'month' ? '月' : product.priceUnit === 'year' ? '年' : '次'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="btn-secondary"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowApplyModal(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        申请开通
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showApplyModal && !!selectedProduct}
        onClose={() => {
          setShowApplyModal(false);
          setApplyReason('');
          setSelectedProduct(null);
        }}
        title="申请开通产品"
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-dark-700/30">
              <h4 className="font-semibold text-white mb-2">{selectedProduct.name}</h4>
              <p className="text-sm text-dark-400">{selectedProduct.provider}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">使用场景</label>
                <textarea
                  rows={3}
                  placeholder="请描述您的使用场景和业务需求..."
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  className="input-field resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">订阅周期</label>
                  <select
                    value={applyDuration}
                    onChange={(e) => setApplyDuration(e.target.value)}
                    className="input-field"
                  >
                    <option value="1">1 个月</option>
                    <option value="3">3 个月</option>
                    <option value="6">6 个月</option>
                    <option value="12">12 个月</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">是否自动续订</label>
                  <select
                    value={applyAutoRenewal}
                    onChange={(e) => setApplyAutoRenewal(e.target.value)}
                    className="input-field"
                  >
                    <option value="true">是</option>
                    <option value="false">否</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">接收人配置</label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-dark-700/30 border border-dark-600">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-dark-400">{user.email}</p>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-accent-cyan/20 text-accent-cyan">默认接收人</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => { setShowApplyModal(false); setApplyReason(''); setSelectedProduct(null); }} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleApplyProduct}
                className="btn-primary"
                disabled={!applyReason.trim()}
              >
                提交申请
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showReceiversModal && !!selectedSubscription}
        onClose={() => { setShowReceiversModal(false); setNewReceiverName(''); setNewReceiverEmail(''); setNewReceiverPhone(''); setNewReceiverDept(''); }}
        title="接收人配置"
        size="md"
      >
        {selectedSubscription && (
          <div className="space-y-4">
            <div className="space-y-3">
              {selectedSubscription.receivers.map((receiver) => (
                <div
                  key={receiver.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30 border border-dark-600"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 flex items-center justify-center">
                    <span className="font-semibold text-accent-cyan">{receiver.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{receiver.name}</p>
                    <p className="text-xs text-dark-400">{receiver.department} · {receiver.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveReceiver(receiver.id)}
                    className="p-2 rounded-lg text-dark-400 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                    title="删除接收人"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedSubscription.receivers.length === 0 && (
                <p className="text-center text-dark-500 py-4">暂无接收人</p>
              )}
            </div>
            <div className="p-4 rounded-xl bg-dark-700/30 border border-dark-600 space-y-3">
              <p className="text-sm font-medium text-white">添加新接收人</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="姓名 *"
                  value={newReceiverName}
                  onChange={(e) => setNewReceiverName(e.target.value)}
                  className="input-field text-sm py-2"
                />
                <input
                  type="email"
                  placeholder="邮箱 *"
                  value={newReceiverEmail}
                  onChange={(e) => setNewReceiverEmail(e.target.value)}
                  className="input-field text-sm py-2"
                />
                <input
                  type="tel"
                  placeholder="手机号"
                  value={newReceiverPhone}
                  onChange={(e) => setNewReceiverPhone(e.target.value)}
                  className="input-field text-sm py-2"
                />
                <input
                  type="text"
                  placeholder="部门"
                  value={newReceiverDept}
                  onChange={(e) => setNewReceiverDept(e.target.value)}
                  className="input-field text-sm py-2"
                />
              </div>
              <button
                onClick={handleAddReceiver}
                disabled={!newReceiverName.trim() || !newReceiverEmail.trim()}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 border-dashed border-dark-500 text-dark-300 hover:border-accent-cyan hover:text-accent-cyan transition-colors disabled:opacity-40 disabled:hover:border-dark-500 disabled:hover:text-dark-300"
              >
                <Plus className="w-4 h-4" />
                添加接收人
              </button>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => setShowReceiversModal(false)} className="btn-primary">
                完成
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
