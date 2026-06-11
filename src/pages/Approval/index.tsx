import { useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  ChevronRight,
  User,
  Calendar,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Ban,
  Zap,
  Database,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatDateTime } from '../../utils/date';
import { getStatusText, getTypeText } from '../../utils/format';
import type { ApprovalRequest } from '../../data/types';

export const ApprovalPage = () => {
  const { approvals, user, approveAndApplyEffect } = useStore();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [approveComment, setApproveComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const rejectedCount = approvals.filter((a) => a.status === 'rejected').length;
  const myCount = approvals.filter((a) => a.applicant === user.name).length;

  const filteredApprovals = approvals.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.applicant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    const matchesTab = activeTab === 'all'
      ? true
      : activeTab === 'my'
      ? a.applicant === user.name
      : a.status === activeTab;
    return matchesSearch && matchesType && matchesTab;
  });

  const tabs = [
    { key: 'pending', label: '待我审批' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'my', label: '我的申请' },
    { key: 'all', label: '全部' },
  ];

  const getApprovalTypeIcon = (type: string) => {
    switch (type) {
      case 'renewal':
        return <RefreshCw className="w-5 h-5 text-accent-cyan" />;
      case 'termination':
        return <Ban className="w-5 h-5 text-accent-red" />;
      case 'quota_expand':
        return <Zap className="w-5 h-5 text-accent-orange" />;
      case 'new_subscription':
        return <Database className="w-5 h-5 text-accent-purple" />;
      default:
        return <FileText className="w-5 h-5 text-dark-400" />;
    }
  };

  const getApprovalTypeColor = (type: string) => {
    switch (type) {
      case 'renewal':
        return 'from-accent-cyan/20 to-accent-purple/20';
      case 'termination':
        return 'from-accent-red/20 to-accent-orange/20';
      case 'quota_expand':
        return 'from-accent-orange/20 to-accent-yellow/20';
      case 'new_subscription':
        return 'from-accent-purple/20 to-accent-cyan/20';
      default:
        return 'from-dark-600/20 to-dark-700/20';
    }
  };

  const handleApprove = () => {
    if (!selectedApproval) return;
    const updatedApproval = { ...selectedApproval };
    const currentNode = updatedApproval.nodes[updatedApproval.currentNode];
    if (currentNode) {
      currentNode.status = 'approved';
      currentNode.comment = approveComment || '同意';
      currentNode.approveTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    if (updatedApproval.currentNode < updatedApproval.nodes.length - 1) {
      updatedApproval.currentNode++;
      updatedApproval.nodes[updatedApproval.currentNode].status = 'current';
    } else {
      updatedApproval.status = 'approved';
    }
    approveAndApplyEffect(updatedApproval);
    setShowDetailModal(false);
    setApproveComment('');
    alert('审批已通过！');
  };

  const handleReject = () => {
    if (!selectedApproval) return;
    const updatedApproval = { ...selectedApproval };
    const currentNode = updatedApproval.nodes[updatedApproval.currentNode];
    if (currentNode) {
      currentNode.status = 'rejected';
      currentNode.comment = rejectComment || '拒绝';
      currentNode.approveTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    updatedApproval.status = 'rejected';
    approveAndApplyEffect(updatedApproval);
    setShowRejectModal(false);
    setShowDetailModal(false);
    setRejectComment('');
    alert('审批已拒绝！');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="待审批"
          value={pendingCount}
          icon={Clock}
          gradient="from-accent-orange/20 to-accent-red/20"
          trend={{ value: 3, isPositive: true }}
          delay={0}
        />
        <StatCard
          title="已通过"
          value={approvedCount}
          icon={CheckCircle}
          gradient="from-accent-green/20 to-accent-cyan/20"
          trend={{ value: 5, isPositive: true }}
          delay={0.1}
        />
        <StatCard
          title="已拒绝"
          value={rejectedCount}
          icon={XCircle}
          gradient="from-accent-red/20 to-accent-purple/20"
          delay={0.2}
        />
        <StatCard
          title="我的申请"
          value={myCount}
          icon={FileCheck}
          gradient="from-accent-purple/20 to-primary-500/20"
          delay={0.3}
        />
      </div>

      <div className="flex items-center justify-between">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          发起申请
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="搜索申请标题、产品、申请人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 input-field"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field w-40 py-2"
          >
            <option value="all">全部类型</option>
            <option value="renewal">续订申请</option>
            <option value="termination">停订申请</option>
            <option value="quota_expand">额度扩容</option>
            <option value="new_subscription">新订申请</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredApprovals.map((approval, index) => (
          <motion.div
            key={approval.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="card card-hover p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getApprovalTypeColor(approval.type)} flex items-center justify-center flex-shrink-0`}>
                  {getApprovalTypeIcon(approval.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-white">{approval.title}</h3>
                    <Badge status={approval.status} />
                    <span className="px-2 py-0.5 text-xs rounded-full bg-dark-700 text-dark-300">
                      {getTypeText(approval.type)}
                    </span>
                  </div>
                  <p className="text-sm text-dark-400 mb-3">{approval.productName}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-dark-400" />
                      <span className="text-dark-300">{approval.applicant}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-dark-400" />
                      <span className="text-dark-300">{formatDateTime(approval.applyTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-dark-400" />
                      <span className="text-dark-300">{approval.nodes.length} 个审批节点</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {approval.nodes.map((node, nodeIndex) => (
                      <div key={node.id} className="flex items-center">
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                            node.status === 'approved'
                              ? 'bg-accent-green text-white'
                              : node.status === 'rejected'
                              ? 'bg-accent-red text-white'
                              : node.status === 'current'
                              ? 'bg-accent-cyan text-white animate-pulse'
                              : 'bg-dark-700 text-dark-400'
                          )}
                        >
                          {node.status === 'approved' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : node.status === 'rejected' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            nodeIndex + 1
                          )}
                        </div>
                        {nodeIndex < approval.nodes.length - 1 && (
                          <div
                            className={clsx(
                              'w-8 h-0.5',
                              node.status === 'approved' ? 'bg-accent-green' : 'bg-dark-700'
                            )}
                          />
                        )}
                      </div>
                    ))}
                    <span className="ml-2 text-sm text-dark-400">
                      当前：{approval.nodes[approval.currentNode]?.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedApproval(approval);
                    setShowDetailModal(true);
                  }}
                  className="flex items-center gap-2 btn-secondary"
                >
                  <Eye className="w-4 h-4" />
                  查看详情
                </button>
                {approval.status === 'pending' && approval.nodes[approval.currentNode]?.approver === user.name && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedApproval(approval);
                        handleApprove();
                      }}
                      className="flex items-center gap-2 btn-primary"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      通过
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApproval(approval);
                        setShowRejectModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={showDetailModal && !!selectedApproval}
        onClose={() => setShowDetailModal(false)}
        title="审批详情"
        size="xl"
      >
        {selectedApproval && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-dark-700/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getApprovalTypeColor(selectedApproval.type)} flex items-center justify-center`}>
                    {getApprovalTypeIcon(selectedApproval.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedApproval.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge status={selectedApproval.status} />
                      <span className="text-sm text-dark-400">{getTypeText(selectedApproval.type)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-dark-400">申请人：</span>
                  <span className="text-white">{selectedApproval.applicant}</span>
                </div>
                <div>
                  <span className="text-dark-400">申请时间：</span>
                  <span className="text-white">{formatDateTime(selectedApproval.applyTime)}</span>
                </div>
                <div>
                  <span className="text-dark-400">关联产品：</span>
                  <span className="text-white">{selectedApproval.productName}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">申请原因</h4>
              <p className="text-dark-300 p-4 rounded-xl bg-dark-700/30">
                {selectedApproval.reason}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">审批流程</h4>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-700" />
                <div className="space-y-6">
                  {selectedApproval.nodes.map((node, index) => (
                    <div key={node.id} className="relative pl-10">
                      <div
                        className={clsx(
                          'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center',
                          node.status === 'approved'
                            ? 'bg-accent-green'
                            : node.status === 'rejected'
                            ? 'bg-accent-red'
                            : node.status === 'current'
                            ? 'bg-accent-cyan animate-pulse'
                            : 'bg-dark-700'
                        )}
                      >
                        {node.status === 'approved' ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : node.status === 'rejected' ? (
                          <XCircle className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-sm font-medium text-white">{index + 1}</span>
                        )}
                      </div>
                      <div className="p-4 rounded-xl bg-dark-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{node.name}</span>
                            <span className="text-dark-400">·</span>
                            <span className="text-dark-300">{node.approver}</span>
                          </div>
                          <Badge
                            status={
                              node.status === 'approved'
                                ? 'approved'
                                : node.status === 'rejected'
                                ? 'rejected'
                                : node.status === 'current'
                                ? 'pending'
                                : 'current'
                            }
                          />
                        </div>
                        {node.comment && (
                          <p className="text-sm text-dark-300 mb-2">
                            <span className="text-dark-400">审批意见：</span>
                            {node.comment}
                          </p>
                        )}
                        {node.approveTime && (
                          <p className="text-xs text-dark-500">{formatDateTime(node.approveTime)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedApproval.status === 'pending' && selectedApproval.nodes[selectedApproval.currentNode]?.approver === user.name && (
              <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30">
                <h4 className="font-medium text-white mb-3">我的审批</h4>
                <textarea
                  rows={3}
                  placeholder="请输入审批意见..."
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  className="input-field resize-none mb-4"
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    拒绝
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 btn-primary"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    通过
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="拒绝申请"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-dark-300">请输入拒绝原因：</p>
          <textarea
            rows={4}
            placeholder="请详细说明拒绝原因..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            className="input-field resize-none"
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <button onClick={() => setShowRejectModal(false)} className="btn-secondary">
              取消
            </button>
            <button
              onClick={handleReject}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-red text-white hover:bg-accent-red/90 transition-colors"
            >
              <ThumbsDown className="w-4 h-4" />
              确认拒绝
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="发起申请"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">申请类型</label>
            <select className="input-field">
              <option value="">请选择申请类型</option>
              <option value="renewal">续订申请</option>
              <option value="termination">停订申请</option>
              <option value="quota_expand">额度扩容</option>
              <option value="new_subscription">新订申请</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">关联产品</label>
            <select className="input-field">
              <option value="">请选择产品</option>
              <option value="s1">全国企业工商数据</option>
              <option value="s2">宏观经济运行数据</option>
              <option value="s4">金融风险预警数据</option>
              <option value="s5">科技创新成果数据</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">申请标题</label>
            <input
              type="text"
              placeholder="请输入申请标题"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">申请原因</label>
            <textarea
              rows={4}
              placeholder="请详细说明申请原因..."
              className="input-field resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
              取消
            </button>
            <button
              onClick={() => {
                setShowCreateModal(false);
                alert('申请已提交！');
              }}
              className="btn-primary flex items-center gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              提交申请
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
