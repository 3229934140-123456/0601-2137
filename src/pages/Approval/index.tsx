import { useState, useMemo } from 'react';
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
  CheckSquare,
  Square,
  SlidersHorizontal,
  X,
  AlertTriangle,
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
  const {
    approvals,
    user,
    approveAndApplyEffect,
    batchApproveLowRisk,
    subscriptions,
    addApproval,
  } = useStore();

  const [activeTab, setActiveTab] = useState('todo');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [applicantFilter, setApplicantFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approveComment, setApproveComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);

  const [createForm, setCreateForm] = useState({
    type: 'renewal' as ApprovalRequest['type'],
    subscriptionId: '',
    title: '',
    reason: '',
  });

  const allProducts = useMemo(
    () => Array.from(new Set(approvals.map((a) => a.productName))).sort(),
    [approvals]
  );
  const allApplicants = useMemo(
    () => Array.from(new Set(approvals.map((a) => a.applicant))).sort(),
    [approvals]
  );

  const todoApprovals = approvals.filter(
    (a) => a.status === 'pending' && a.nodes[a.currentNode]?.approver === user.name
  );
  const pendingCount = approvals.filter((a) => a.status === 'pending').length;
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const rejectedCount = approvals.filter((a) => a.status === 'rejected').length;
  const myCount = approvals.filter((a) => a.applicant === user.name).length;

  const filteredApprovals = approvals.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    const matchesProduct = productFilter === 'all' || a.productName === productFilter;
    const matchesApplicant = applicantFilter === 'all' || a.applicant === applicantFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

    let matchesTab = true;
    if (activeTab === 'todo') {
      matchesTab = a.status === 'pending' && a.nodes[a.currentNode]?.approver === user.name;
    } else if (activeTab === 'pending') {
      matchesTab = a.status === 'pending';
    } else if (activeTab === 'approved') {
      matchesTab = a.status === 'approved';
    } else if (activeTab === 'rejected') {
      matchesTab = a.status === 'rejected';
    } else if (activeTab === 'my') {
      matchesTab = a.applicant === user.name;
    }

    return (
      matchesSearch &&
      matchesType &&
      matchesProduct &&
      matchesApplicant &&
      matchesStatus &&
      matchesTab
    );
  });

  const lowRiskIds = useMemo(() => {
    return filteredApprovals
      .filter((a) => {
        if (a.status !== 'pending') return false;
        if (a.nodes[a.currentNode]?.approver !== user.name) return false;
        if (a.type === 'new_subscription') return false;
        if (a.type === 'termination') return false;
        if (a.type === 'quota_expand') {
          const m = a.reason.match(/扩容额度[：:]\s*(\d+)/);
          const amt = m ? parseInt(m[1], 10) : 0;
          return amt <= 50000;
        }
        return true;
      })
      .map((a) => a.id);
  }, [filteredApprovals, user.name]);

  const tabs = [
    { key: 'todo', label: `待我审批 (${todoApprovals.length})` },
    { key: 'pending', label: '全部待办' },
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const selectable = filteredApprovals.filter(
      (a) => a.status === 'pending' && a.nodes[a.currentNode]?.approver === user.name
    ).map((a) => a.id);
    const allSelected = selectable.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : selectable);
  };

  const handleApprove = () => {
    if (!selectedApproval) return;
    const updatedApproval: ApprovalRequest = JSON.parse(JSON.stringify(selectedApproval));
    const currentNode = updatedApproval.nodes[updatedApproval.currentNode];
    if (currentNode) {
      currentNode.status = 'approved';
      currentNode.comment = approveComment || '同意';
      currentNode.approveTime = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
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
    const updatedApproval: ApprovalRequest = JSON.parse(JSON.stringify(selectedApproval));
    const currentNode = updatedApproval.nodes[updatedApproval.currentNode];
    if (currentNode) {
      currentNode.status = 'rejected';
      currentNode.comment = rejectComment || '拒绝';
      currentNode.approveTime = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
    }
    updatedApproval.status = 'rejected';
    approveAndApplyEffect(updatedApproval);
    setShowRejectModal(false);
    setShowDetailModal(false);
    setRejectComment('');
    alert('审批已拒绝！');
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定批量通过 ${selectedIds.length} 条申请吗？`)) return;
    batchApproveLowRisk(selectedIds);
    setSelectedIds([]);
    setBatchMode(false);
  };

  const handleQuickApprove = (approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    const updatedApproval: ApprovalRequest = JSON.parse(JSON.stringify(approval));
    const currentNode = updatedApproval.nodes[updatedApproval.currentNode];
    if (currentNode) {
      currentNode.status = 'approved';
      currentNode.comment = '快速审批通过';
      currentNode.approveTime = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
    }
    if (updatedApproval.currentNode < updatedApproval.nodes.length - 1) {
      updatedApproval.currentNode++;
      updatedApproval.nodes[updatedApproval.currentNode].status = 'current';
    } else {
      updatedApproval.status = 'approved';
    }
    approveAndApplyEffect(updatedApproval);
  };

  const handleCreateSubmit = () => {
    if (!createForm.subscriptionId || !createForm.title.trim() || !createForm.reason.trim()) {
      alert('请填写完整信息');
      return;
    }
    const sub = subscriptions.find((s) => s.id === createForm.subscriptionId);
    if (!sub) return;
    addApproval({
      id: `a_${Date.now()}`,
      type: createForm.type,
      title: createForm.title,
      subscriptionId: sub.id,
      productName: sub.productName,
      applicant: user.name,
      applyTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      reason: createForm.reason,
      status: 'pending',
      currentNode: 0,
      nodes: [
        { id: `n_${Date.now()}_1`, name: '部门主管审批', approver: '王总', status: 'current' },
        { id: `n_${Date.now()}_2`, name: '财务审核', approver: '赵丽', status: 'pending' },
      ],
    });
    setShowCreateModal(false);
    setCreateForm({ type: 'renewal', subscriptionId: '', title: '', reason: '' });
    alert('申请已提交！');
  };

  const rejectReason = selectedApproval?.status === 'rejected'
    ? (() => {
        const rejectNode = [...selectedApproval.nodes].reverse().find((n) => n.status === 'rejected');
        return rejectNode?.comment || '';
      })()
    : '';

  const resetFilters = () => {
    setTypeFilter('all');
    setProductFilter('all');
    setApplicantFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (productFilter !== 'all' ? 1 : 0) +
    (applicantFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="待我审批"
          value={todoApprovals.length}
          icon={Clock}
          gradient="from-accent-orange/20 to-accent-red/20"
          trend={{ value: todoApprovals.length, isPositive: todoApprovals.length === 0 }}
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
        <div className="flex items-center gap-2">
          {activeTab === 'todo' && (
            <>
              <button
                onClick={() => setBatchMode(!batchMode)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  batchMode
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                    : 'btn-secondary'
                )}
              >
                <CheckSquare className="w-4 h-4" />
                批量审批
              </button>
              {lowRiskIds.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedIds(lowRiskIds);
                    handleBatchApprove();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/30 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  一键通过低风险 ({lowRiskIds.length})
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            发起申请
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="搜索申请标题、产品、申请人、原因..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 input-field"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative',
              showFilterPanel || activeFilterCount > 0
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                : 'btn-secondary'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            高级筛选
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
            >
              <X className="w-4 h-4" />
              重置
            </button>
          )}
        </div>
      </div>

      {showFilterPanel && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">产品</label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">全部产品</option>
                {allProducts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">申请人</label>
              <select
                value={applicantFilter}
                onChange={(e) => setApplicantFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">全部申请人</option>
                {allApplicants.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">状态</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">全部状态</option>
                <option value="pending">待审批</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {batchMode && activeTab === 'todo' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors"
            >
              {selectedIds.length ===
              filteredApprovals.filter(
                (a) =>
                  a.status === 'pending' &&
                  a.nodes[a.currentNode]?.approver === user.name
              ).length ? (
                <CheckSquare className="w-5 h-5 text-accent-cyan" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              全选
            </button>
            <span className="text-dark-400 text-sm">
              已选 <span className="text-accent-cyan font-medium">{selectedIds.length}</span> 条
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedIds([]);
                setBatchMode(false);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleBatchApprove}
              disabled={selectedIds.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-40"
            >
              <ThumbsUp className="w-4 h-4" />
              批量通过
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {filteredApprovals.map((approval, index) => {
          const isMyTurn =
            approval.status === 'pending' &&
            approval.nodes[approval.currentNode]?.approver === user.name;
          const isSelectable = batchMode && isMyTurn;
          return (
            <motion.div
              key={approval.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={clsx(
                'card p-6 transition-all',
                isSelectable && selectedIds.includes(approval.id)
                  ? 'ring-2 ring-accent-cyan bg-accent-cyan/5'
                  : 'card-hover'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {isSelectable && (
                    <button
                      onClick={() => toggleSelect(approval.id)}
                      className="mt-1"
                    >
                      {selectedIds.includes(approval.id) ? (
                        <CheckSquare className="w-5 h-5 text-accent-cyan" />
                      ) : (
                        <Square className="w-5 h-5 text-dark-500" />
                      )}
                    </button>
                  )}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getApprovalTypeColor(
                      approval.type
                    )} flex items-center justify-center flex-shrink-0`}
                  >
                    {getApprovalTypeIcon(approval.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">{approval.title}</h3>
                      <Badge status={approval.status} />
                      <span className="px-2 py-0.5 text-xs rounded-full bg-dark-700 text-dark-300">
                        {getTypeText(approval.type)}
                      </span>
                      {lowRiskIds.includes(approval.id) && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-accent-green/10 text-accent-green flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          低风险
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-400 mb-3">{approval.productName}</p>
                    <div className="flex items-center gap-6 text-sm flex-wrap">
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
                        <span className="text-dark-300">
                          {approval.nodes.length} 个审批节点
                        </span>
                      </div>
                    </div>

                    {approval.status === 'rejected' && rejectReason && (
                      <div className="mt-3 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30">
                        <div className="flex items-center gap-2 text-accent-red text-sm font-medium mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          拒绝原因
                        </div>
                        <p className="text-sm text-dark-300">{rejectReason}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2 flex-wrap">
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
                            title={`${node.name} - ${node.approver}${
                              node.comment ? `：${node.comment}` : ''
                            }`}
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
                                node.status === 'approved'
                                  ? 'bg-accent-green'
                                  : 'bg-dark-700'
                              )}
                            />
                          )}
                        </div>
                      ))}
                      <span className="ml-2 text-sm text-dark-400">
                        当前：{approval.nodes[approval.currentNode]?.name}（
                        {approval.nodes[approval.currentNode]?.approver}）
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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
                  {isMyTurn && !batchMode && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickApprove(approval)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/30 transition-colors"
                        title="快速通过（无意见）"
                      >
                        <Zap className="w-4 h-4" />
                        快速通过
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApproval(approval);
                          setApproveComment('');
                          setShowDetailModal(true);
                        }}
                        className="flex items-center gap-2 btn-primary"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        通过
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApproval(approval);
                          setRejectComment('');
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
          );
        })}
        {filteredApprovals.length === 0 && (
          <div className="card p-12 text-center text-dark-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>暂无匹配的审批记录</p>
          </div>
        )}
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
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getApprovalTypeColor(
                      selectedApproval.type
                    )} flex items-center justify-center`}
                  >
                    {getApprovalTypeIcon(selectedApproval.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedApproval.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge status={selectedApproval.status} />
                      <span className="text-sm text-dark-400">
                        {getTypeText(selectedApproval.type)}
                      </span>
                      {lowRiskIds.includes(selectedApproval.id) && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-accent-green/10 text-accent-green flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          低风险
                        </span>
                      )}
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
                  <span className="text-white">
                    {formatDateTime(selectedApproval.applyTime)}
                  </span>
                </div>
                <div>
                  <span className="text-dark-400">关联产品：</span>
                  <span className="text-white">{selectedApproval.productName}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">申请原因</h4>
              <p className="text-dark-300 p-4 rounded-xl bg-dark-700/30 whitespace-pre-wrap">
                {selectedApproval.reason}
              </p>
            </div>

            {selectedApproval.status === 'rejected' && rejectReason && (
              <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/30">
                <div className="flex items-center gap-2 text-accent-red font-medium mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  拒绝原因
                </div>
                <p className="text-dark-200">{rejectReason}</p>
              </div>
            )}

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
                          <p className="text-xs text-dark-500">
                            {formatDateTime(node.approveTime)}
                          </p>
                        )}
                        {!node.comment && !node.approveTime && node.status === 'pending' && (
                          <p className="text-xs text-dark-500">等待处理</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedApproval.status === 'pending' &&
              selectedApproval.nodes[selectedApproval.currentNode]?.approver ===
                user.name && (
                <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30">
                  <h4 className="font-medium text-white mb-3">我的审批</h4>
                  <textarea
                    rows={3}
                    placeholder="请输入审批意见（选填）..."
                    value={approveComment}
                    onChange={(e) => setApproveComment(e.target.value)}
                    className="input-field resize-none mb-4"
                  />
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setRejectComment('');
                        setShowRejectModal(true);
                      }}
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
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
              >
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
            placeholder="请详细说明拒绝原因，这会通知到申请人..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            className="input-field resize-none"
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <button
              onClick={() => setShowRejectModal(false)}
              className="btn-secondary"
            >
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
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({ type: 'renewal', subscriptionId: '', title: '', reason: '' });
        }}
        title="发起申请"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">申请类型</label>
            <select
              value={createForm.type}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  type: e.target.value as ApprovalRequest['type'],
                })
              }
              className="input-field"
            >
              <option value="renewal">续订申请</option>
              <option value="termination">停订申请</option>
              <option value="quota_expand">额度扩容</option>
              <option value="new_subscription">新订申请</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">关联产品</label>
            <select
              value={createForm.subscriptionId}
              onChange={(e) => setCreateForm({ ...createForm, subscriptionId: e.target.value })}
              className="input-field"
            >
              <option value="">请选择产品</option>
              {subscriptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.productName}（{s.status === 'active' ? '运行中' : s.status === 'pending' ? '待生效' : s.status === 'expired' ? '已过期' : '已暂停'}）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">申请标题</label>
            <input
              type="text"
              placeholder="请输入申请标题"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">申请原因</label>
            <textarea
              rows={4}
              placeholder="请详细说明申请原因..."
              value={createForm.reason}
              onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
              className="input-field resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm({ type: 'renewal', subscriptionId: '', title: '', reason: '' });
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleCreateSubmit}
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
