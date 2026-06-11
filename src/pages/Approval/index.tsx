import { useState, useMemo, useEffect } from 'react';
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
  AlertOctagon,
  ShieldAlert,
  Shield,
  ListChecks,
  History,
  BarChart3,
  TrendingDown,
  TimerReset,
  Sparkles,
  EyeOff,
  Workflow,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatDateTime } from '../../utils/date';
import { getStatusText, getTypeText, formatNumber } from '../../utils/format';
import type { ApprovalRequest, ApprovalTemplateKey } from '../../data/types';

export const ApprovalPage = () => {
  const {
    approvals,
    user,
    approveAndApplyEffect,
    batchApproveLowRisk,
    subscriptions,
    addApprovalWithTemplate,
    approvalTemplates,
    autoSelectTemplate,
    activeApprover,
    setActiveApprover,
    pendingDetailId,
    setPendingDetailId,
    previewBatchImpact,
  } = useStore();

  const [activeTab, setActiveTab] = useState('workbench');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [applicantFilter, setApplicantFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approverFilter, setApproverFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [overdueFilter, setOverdueFilter] = useState<string>('all');
  const [approveComment, setApproveComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [pendingFilterSet, setPendingFilterSet] = useState<null | Record<string, string>>(null);

  const [createForm, setCreateForm] = useState({
    type: 'renewal' as ApprovalRequest['type'],
    subscriptionId: '',
    title: '',
    reason: '',
    templateKey: '' as ApprovalTemplateKey | '',
    amount: 0,
  });

  const allProducts = useMemo(
    () => Array.from(new Set(approvals.map((a) => a.productName))).sort(),
    [approvals]
  );
  const allApplicants = useMemo(
    () => Array.from(new Set(approvals.map((a) => a.applicant))).sort(),
    [approvals]
  );
  const allApprovers = useMemo(() => {
    const set = new Set<string>();
    approvals.forEach((a) => a.nodes.forEach((n) => set.add(n.approver)));
    return Array.from(set).sort();
  }, [approvals]);

  const isOverdue = (a: ApprovalRequest) => {
    if (a.status !== 'pending' || !a.deadline) return false;
    return new Date(a.deadline.replace(/-/g, '/')).getTime() < Date.now();
  };

  const todoApprovals = approvals.filter(
    (a) => a.status === 'pending' && a.nodes[a.currentNode]?.approver === activeApprover
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
    const matchesApprover = approverFilter === 'all' || a.nodes[a.currentNode]?.approver === approverFilter;
    const matchesRisk = riskFilter === 'all' || a.riskLevel === riskFilter;
    const matchesOverdue = overdueFilter === 'all' || (overdueFilter === 'yes' ? isOverdue(a) : !isOverdue(a));

    let matchesTab = true;
    if (activeTab === 'todo') {
      matchesTab = a.status === 'pending' && a.nodes[a.currentNode]?.approver === activeApprover;
    } else if (activeTab === 'pending') {
      matchesTab = a.status === 'pending';
    } else if (activeTab === 'approved') {
      matchesTab = a.status === 'approved';
    } else if (activeTab === 'rejected') {
      matchesTab = a.status === 'rejected';
    } else if (activeTab === 'my') {
      matchesTab = a.applicant === user.name;
    }

    if (pendingFilterSet) {
      for (const [k, v] of Object.entries(pendingFilterSet)) {
        if (k === 'type' && a.type !== v) return false;
        if (k === 'riskLevel' && a.riskLevel !== v) return false;
        if (k === 'currentApprover' && a.nodes[a.currentNode]?.approver !== v) return false;
        if (k === 'overdue' && (v === 'yes' ? !isOverdue(a) : isOverdue(a))) return false;
      }
    }

    return (
      matchesSearch &&
      matchesType &&
      matchesProduct &&
      matchesApplicant &&
      matchesStatus &&
      matchesApprover &&
      matchesRisk &&
      matchesOverdue &&
      matchesTab
    );
  });

  const lowRiskIds = useMemo(() => {
    return filteredApprovals
      .filter((a) => {
        if (a.status !== 'pending') return false;
        if (a.nodes[a.currentNode]?.approver !== activeApprover) return false;
        if (a.type === 'new_subscription') return false;
        if (a.type === 'termination') return false;
        if (a.type === 'quota_expand') {
          const m = a.reason.match(/扩容额度[：:]\s*(\d+)/);
          const amt = m ? parseInt(m[1], 10) : a.amount || 0;
          return amt <= 50000;
        }
        return true;
      })
      .map((a) => a.id);
  }, [filteredApprovals, activeApprover]);

  const getRejectReason = (approval: ApprovalRequest) => {
    if (approval.status !== 'rejected') return '';
    const rejectNode = [...approval.nodes].reverse().find((n) => n.status === 'rejected');
    return rejectNode?.comment || '';
  };

  useEffect(() => {
    if (pendingDetailId.approval) {
      const approval = approvals.find((a) => a.id === pendingDetailId.approval);
      if (approval) {
        setSelectedApproval(approval);
        setShowDetailModal(true);
      }
      setPendingDetailId('approval', undefined);
    }
  }, [pendingDetailId.approval, approvals]);

  const getRiskColor = (lvl?: string) => {
    if (lvl === 'high') return 'bg-accent-red/10 text-accent-red border-accent-red';
    if (lvl === 'low') return 'bg-accent-green/10 text-accent-green border-accent-green';
    return 'bg-accent-orange/10 text-accent-orange border-accent-orange';
  };
  const getRiskIcon = (lvl?: string) => {
    if (lvl === 'high') return <ShieldAlert className="w-3 h-3" />;
    if (lvl === 'low') return <Shield className="w-3 h-3" />;
    return <AlertTriangle className="w-3 h-3" />;
  };
  const getRiskText = (lvl?: string) =>
    lvl === 'high' ? '高风险' : lvl === 'low' ? '低风险' : '中风险';

  // 工作台统计
  const workbenchStats = useMemo(() => {
    const todo = approvals.filter((a) => a.status === 'pending' && a.nodes[a.currentNode]?.approver === activeApprover);
    const byType: Record<string, number> = { renewal: 0, termination: 0, quota_expand: 0, new_subscription: 0 };
    const byRisk: Record<string, number> = { low: 0, medium: 0, high: 0 };
    const byApprover: Record<string, number> = {};
    let overdue = 0;
    todo.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
      const r = a.riskLevel || 'medium';
      byRisk[r] = (byRisk[r] || 0) + 1;
      const ap = a.nodes[a.currentNode]?.approver || '未知';
      byApprover[ap] = (byApprover[ap] || 0) + 1;
      if (isOverdue(a)) overdue += 1;
    });
    return { total: todo.length, byType, byRisk, byApprover, overdue };
  }, [approvals, activeApprover]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const selectable = filteredApprovals.filter(
      (a) => a.status === 'pending' && a.nodes[a.currentNode]?.approver === activeApprover
    ).map((a) => a.id);
    const allSelected = selectable.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : selectable);
  };

  const handleApprove = () => {
    if (!selectedApproval) return;
    const updatedApproval: ApprovalRequest = JSON.parse(JSON.stringify(selectedApproval));
    const currentNode = updatedApproval.nodes[updatedApproval.currentNode];
    const nowStr = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
    if (currentNode) {
      currentNode.status = 'approved';
      currentNode.comment = approveComment || '同意';
      currentNode.approveTime = nowStr;
    }
    if (updatedApproval.currentNode < updatedApproval.nodes.length - 1) {
      updatedApproval.currentNode++;
      updatedApproval.nodes[updatedApproval.currentNode].status = 'current';
      updatedApproval.nodes[updatedApproval.currentNode].arriveTime = nowStr;
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
    const nowStr = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
    if (currentNode) {
      currentNode.status = 'rejected';
      currentNode.comment = rejectComment || '拒绝';
      currentNode.approveTime = nowStr;
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
    const updatedApproval: ApprovalRequest = JSON.parse(JSON.stringify(approval));
    const currentNode = updatedApproval.nodes[updatedApproval.currentNode];
    const nowStr = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
    if (currentNode) {
      currentNode.status = 'approved';
      currentNode.comment = '快速审批通过';
      currentNode.approveTime = nowStr;
    }
    if (updatedApproval.currentNode < updatedApproval.nodes.length - 1) {
      updatedApproval.currentNode++;
      updatedApproval.nodes[updatedApproval.currentNode].status = 'current';
      updatedApproval.nodes[updatedApproval.currentNode].arriveTime = nowStr;
    } else {
      updatedApproval.status = 'approved';
    }
    approveAndApplyEffect(updatedApproval);
  };

  const handleQuickPassLowRisk = () => {
    if (lowRiskIds.length === 0) return;
    if (!confirm(`确定一键通过全部 ${lowRiskIds.length} 条低风险申请吗？这会立刻更新额度、订阅状态。`)) return;
    batchApproveLowRisk(lowRiskIds);
    setSelectedIds([]);
    setBatchMode(false);
  };

  const handleCreateSubmit = () => {
    if (!createForm.subscriptionId || !createForm.title.trim() || !createForm.reason.trim()) {
      alert('请填写完整信息');
      return;
    }
    const sub = subscriptions.find((s) => s.id === createForm.subscriptionId);
    if (!sub) return;
    addApprovalWithTemplate({
      type: createForm.type,
      subscriptionId: sub.id,
      productName: sub.productName,
      title: createForm.title,
      reason: createForm.reason,
      applicant: user.name,
      templateKey: (createForm.templateKey || undefined) as ApprovalTemplateKey | undefined,
      amount: createForm.amount || undefined,
    });
    setShowCreateModal(false);
    setCreateForm({ type: 'renewal', subscriptionId: '', title: '', reason: '', templateKey: '', amount: 0 });
    alert('申请已提交！');
  };

  useEffect(() => {
    if (pendingFilterSet) {
      // 切换到待我审批 Tab 让卡片筛选生效
      setActiveTab('todo');
    }
  }, [pendingFilterSet]);

  const resetFilters = () => {
    setTypeFilter('all');
    setProductFilter('all');
    setApplicantFilter('all');
    setStatusFilter('all');
    setApproverFilter('all');
    setRiskFilter('all');
    setOverdueFilter('all');
    setSearchQuery('');
    setPendingFilterSet(null);
  };

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (productFilter !== 'all' ? 1 : 0) +
    (applicantFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (approverFilter !== 'all' ? 1 : 0) +
    (riskFilter !== 'all' ? 1 : 0) +
    (overdueFilter !== 'all' ? 1 : 0) +
    (pendingFilterSet ? Object.keys(pendingFilterSet).length : 0);

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

  const tabs = [
    { key: 'workbench', label: '审批工作台' },
    { key: 'todo', label: `待我审批 (${todoApprovals.length})` },
    { key: 'pending', label: '全部待办' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'my', label: '我的申请' },
    { key: 'all', label: '全部' },
  ];

  const batchImpact = previewBatchImpact(selectedIds);

  return (
    <div className="space-y-6">
      {/* 顶部概览统计 */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          title="待我审批"
          value={todoApprovals.length}
          icon={Clock}
          gradient="from-accent-orange/20 to-accent-red/20"
          trend={{ value: todoApprovals.length, isPositive: todoApprovals.length === 0 }}
          delay={0}
        />
        <StatCard
          title="全部待办"
          value={pendingCount}
          icon={ListChecks}
          gradient="from-accent-cyan/20 to-accent-purple/20"
          delay={0.05}
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
          delay={0.15}
        />
        <StatCard
          title="我的申请"
          value={myCount}
          icon={FileCheck}
          gradient="from-accent-purple/20 to-primary-500/20"
          delay={0.2}
        />
      </div>

      {/* 工作台：多维统计卡片（仅工作台 Tab 显示） */}
      {activeTab === 'workbench' && (
        <>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent-cyan" />
                我的待办汇总（按身份：{activeApprover}）
              </h3>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/30 border border-dark-600">
                <User className="w-4 h-4 text-dark-400" />
                <select
                  value={activeApprover}
                  onChange={(e) => setActiveApprover(e.target.value)}
                  className="bg-transparent text-sm text-white border-none outline-none cursor-pointer"
                >
                  {allApprovers.map((name) => (
                    <option key={name} value={name} className="bg-dark-800">
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setPendingFilterSet({ type: 'quota_expand' })}
                className="text-left card card-hover p-4 bg-gradient-to-br from-accent-orange/10 to-accent-yellow/10 border border-accent-orange/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <Zap className="w-5 h-5 text-accent-orange" />
                  <span className="text-xs px-2 py-0.5 rounded bg-accent-orange/10 text-accent-orange">扩容</span>
                </div>
                <p className="text-2xl font-bold font-display text-white mb-1">{workbenchStats.byType.quota_expand || 0}</p>
                <p className="text-xs text-dark-400">待处理扩容申请</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setPendingFilterSet({ type: 'new_subscription' })}
                className="text-left card card-hover p-4 bg-gradient-to-br from-accent-purple/10 to-accent-cyan/10 border border-accent-purple/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <Database className="w-5 h-5 text-accent-purple" />
                  <span className="text-xs px-2 py-0.5 rounded bg-accent-purple/10 text-accent-purple">新订</span>
                </div>
                <p className="text-2xl font-bold font-display text-white mb-1">{workbenchStats.byType.new_subscription || 0}</p>
                <p className="text-xs text-dark-400">待处理新订申请</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setPendingFilterSet({ type: 'renewal' })}
                className="text-left card card-hover p-4 bg-gradient-to-br from-accent-cyan/10 to-accent-green/10 border border-accent-cyan/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <RefreshCw className="w-5 h-5 text-accent-cyan" />
                  <span className="text-xs px-2 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan">续订</span>
                </div>
                <p className="text-2xl font-bold font-display text-white mb-1">{workbenchStats.byType.renewal || 0}</p>
                <p className="text-xs text-dark-400">待处理续订申请</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setPendingFilterSet({ type: 'termination' })}
                className="text-left card card-hover p-4 bg-gradient-to-br from-accent-red/10 to-accent-orange/10 border border-accent-red/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <Ban className="w-5 h-5 text-accent-red" />
                  <span className="text-xs px-2 py-0.5 rounded bg-accent-red/10 text-accent-red">停订</span>
                </div>
                <p className="text-2xl font-bold font-display text-white mb-1">{workbenchStats.byType.termination || 0}</p>
                <p className="text-xs text-dark-400">待处理停订申请</p>
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setPendingFilterSet({ riskLevel: 'high' })}
              className="text-left card p-5 bg-gradient-to-br from-accent-red/10 to-accent-orange/5 border border-accent-red/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent-red/20 flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5 text-accent-red" />
                </div>
                <div>
                  <p className="font-semibold text-white">高风险待办</p>
                  <p className="text-xs text-dark-400">需要优先处理</p>
                </div>
                <div className="ml-auto text-3xl font-bold font-display text-accent-red">
                  {workbenchStats.byRisk.high || 0}
                </div>
              </div>
              <p className="text-xs text-dark-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                涉及大额扩容/停订/合规审批
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setPendingFilterSet({ riskLevel: 'low' })}
              className="text-left card p-5 bg-gradient-to-br from-accent-green/10 to-accent-cyan/5 border border-accent-green/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent-green/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent-green" />
                </div>
                <div>
                  <p className="font-semibold text-white">低风险待办</p>
                  <p className="text-xs text-dark-400">可一键批量通过</p>
                </div>
                <div className="ml-auto text-3xl font-bold font-display text-accent-green">
                  {workbenchStats.byRisk.low || 0}
                </div>
              </div>
              <p className="text-xs text-dark-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                低金额日常申请，建议快速处理
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setPendingFilterSet({ overdue: 'yes' })}
              className="text-left card p-5 bg-gradient-to-br from-accent-orange/15 to-accent-red/5 border border-accent-orange/30"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent-orange/20 flex items-center justify-center">
                  <TimerReset className="w-5 h-5 text-accent-orange" />
                </div>
                <div>
                  <p className="font-semibold text-white">超时 / 即将到期</p>
                  <p className="text-xs text-dark-400">已超过处理时限</p>
                </div>
                <div className="ml-auto text-3xl font-bold font-display text-accent-orange">
                  {workbenchStats.overdue || 0}
                </div>
              </div>
              <p className="text-xs text-dark-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                请关注这些高优先级申请，避免影响业务
              </p>
            </motion.button>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-accent-cyan" />
              按当前审批人分布（点击查看对应节点的待办）
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(workbenchStats.byApprover)
                .filter(([, n]) => n > 0)
                .map(([approver, count]) => (
                  <motion.button
                    key={approver}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setPendingFilterSet({ currentApprover: approver })}
                    className="p-4 rounded-xl bg-dark-700/30 border border-dark-600 hover:border-accent-cyan/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 flex items-center justify-center font-semibold text-accent-cyan">
                        {approver[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{approver}</p>
                        <p className="text-xs text-dark-400">当前节点审批人</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold font-display text-accent-cyan">{count}</p>
                    <p className="text-xs text-dark-400 mt-1">条待此节点处理</p>
                  </motion.button>
                ))}
              {Object.values(workbenchStats.byApprover).every((n) => !n) && (
                <div className="col-span-5 py-8 text-center text-dark-400">暂无待办 🎉</div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-accent-cyan" />
                我的待办列表（点击统计卡片后会按条件筛选到这里）
              </h3>
              {pendingFilterSet && (
                <button
                  onClick={() => setPendingFilterSet(null)}
                  className="text-xs text-accent-cyan hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  清除卡片筛选
                </button>
              )}
            </div>
            {pendingFilterSet && (
              <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(pendingFilterSet).map(([k, v]) => (
                  <span
                    key={k}
                    className="px-3 py-1 text-xs rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                  >
                    {k === 'type' && `类型: ${getTypeText(v)}`}
                    {k === 'riskLevel' && `风险: ${getRiskText(v)}`}
                    {k === 'currentApprover' && `当前审批人: ${v}`}
                    {k === 'overdue' && (v === 'yes' ? '已超时' : '未超时')}
                  </span>
                ))}
              </div>
            )}
            <ApprovalList
              approvals={filteredApprovals}
              activeApprover={activeApprover}
              lowRiskIds={lowRiskIds}
              isMyTurnCheck={(a) => a.status === 'pending' && a.nodes[a.currentNode]?.approver === activeApprover}
              getRejectReason={getRejectReason}
              onViewDetail={(a) => { setSelectedApproval(a); setShowDetailModal(true); }}
              onQuickApprove={handleQuickApprove}
              onOpenApprove={(a) => { setSelectedApproval(a); setApproveComment(''); setShowDetailModal(true); }}
              onOpenReject={(a) => { setSelectedApproval(a); setRejectComment(''); setShowRejectModal(true); }}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              getApprovalTypeIcon={getApprovalTypeIcon}
              getApprovalTypeColor={getApprovalTypeColor}
              getRiskColor={getRiskColor}
              getRiskIcon={getRiskIcon}
              getRiskText={getRiskText}
              isOverdue={isOverdue}
            />
          </div>
        </>
      )}

      {/* Tab 切换栏 + 顶栏操作 */}
      <div className="flex items-center justify-between">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={(k) => { setActiveTab(k); setPendingFilterSet(null); }} />
        <div className="flex items-center gap-2">
          {activeTab !== 'workbench' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700/30 border border-dark-600">
              <User className="w-4 h-4 text-dark-400" />
              <span className="text-sm text-dark-400">审批身份：</span>
              <select
                value={activeApprover}
                onChange={(e) => setActiveApprover(e.target.value)}
                className="bg-transparent text-sm text-white border-none outline-none cursor-pointer"
              >
                {allApprovers.map((name) => (
                  <option key={name} value={name} className="bg-dark-800">
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {(activeTab === 'todo' || activeTab === 'workbench') && (
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
                  onClick={handleQuickPassLowRisk}
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

      {/* 筛选栏 */}
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
                {allProducts.map((p) => (<option key={p} value={p}>{p}</option>))}
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
                {allApplicants.map((a) => (<option key={a} value={a}>{a}</option>))}
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
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">当前审批人</label>
              <select
                value={approverFilter}
                onChange={(e) => setApproverFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">全部审批人</option>
                {allApprovers.map((a) => (<option key={a} value={a}>{a}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">风险等级</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">全部等级</option>
                <option value="low">低风险</option>
                <option value="medium">中风险</option>
                <option value="high">高风险</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">超时情况</label>
              <select
                value={overdueFilter}
                onChange={(e) => setOverdueFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">全部</option>
                <option value="yes">已超时</option>
                <option value="no">未超时</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* 批量审批栏 */}
      {batchMode && (activeTab === 'todo' || activeTab === 'workbench') && (
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
                  a.nodes[a.currentNode]?.approver === activeApprover
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
              onClick={() => setShowPreviewModal(true)}
              disabled={selectedIds.length === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-40"
            >
              <Eye className="w-4 h-4" />
              预览影响
            </button>
            <button
              onClick={() => { setSelectedIds([]); setBatchMode(false); }}
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

      {/* 列表（非工作台显示） */}
      {activeTab !== 'workbench' && (
        <ApprovalList
          approvals={filteredApprovals}
          activeApprover={activeApprover}
          lowRiskIds={lowRiskIds}
          isMyTurnCheck={(a) => a.status === 'pending' && a.nodes[a.currentNode]?.approver === activeApprover}
          getRejectReason={getRejectReason}
          onViewDetail={(a) => { setSelectedApproval(a); setShowDetailModal(true); }}
          onQuickApprove={handleQuickApprove}
          onOpenApprove={(a) => { setSelectedApproval(a); setApproveComment(''); setShowDetailModal(true); }}
          onOpenReject={(a) => { setSelectedApproval(a); setRejectComment(''); setShowRejectModal(true); }}
          batchMode={batchMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          getApprovalTypeIcon={getApprovalTypeIcon}
          getApprovalTypeColor={getApprovalTypeColor}
          getRiskColor={getRiskColor}
          getRiskIcon={getRiskIcon}
          getRiskText={getRiskText}
          isOverdue={isOverdue}
        />
      )}

      {/* 详情弹窗 */}
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
                      {selectedApproval.riskLevel && (
                        <span className={clsx(
                          'px-2 py-0.5 text-xs rounded-full border flex items-center gap-1',
                          getRiskColor(selectedApproval.riskLevel)
                        )}>
                          {getRiskIcon(selectedApproval.riskLevel)}
                          {getRiskText(selectedApproval.riskLevel)}
                        </span>
                      )}
                      {isOverdue(selectedApproval) && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-accent-red/10 text-accent-red border border-accent-red/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          已超时
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
                {selectedApproval.templateName && (
                  <div>
                    <span className="text-dark-400">审批流程：</span>
                    <span className="text-white">{selectedApproval.templateName}</span>
                  </div>
                )}
                {selectedApproval.deadline && (
                  <div>
                    <span className="text-dark-400">处理时限：</span>
                    <span className={clsx(isOverdue(selectedApproval) ? 'text-accent-red' : 'text-white')}>
                      {formatDateTime(selectedApproval.deadline)}
                    </span>
                  </div>
                )}
                {selectedApproval.amount && selectedApproval.amount > 0 && (
                  <div>
                    <span className="text-dark-400">涉及额度：</span>
                    <span className="text-accent-cyan">{formatNumber(selectedApproval.amount)} 次</span>
                  </div>
                )}
              </div>
              {selectedApproval.templateName && (
                <div className="mt-4 p-3 rounded-lg bg-accent-cyan/5 border border-accent-cyan/20">
                  <div className="flex items-center gap-2 text-accent-cyan text-sm mb-1">
                    <Workflow className="w-4 h-4" />
                    为什么走这个流程？
                  </div>
                  <p className="text-xs text-dark-300">
                    {approvalTemplates.find((t) => t.key === selectedApproval.templateKey)?.description ||
                      '根据申请类型和金额自动匹配审批模板'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">申请原因</h4>
              <p className="text-dark-300 p-4 rounded-xl bg-dark-700/30 whitespace-pre-wrap">
                {selectedApproval.reason}
              </p>
            </div>

            {selectedApproval.status === 'rejected' && getRejectReason(selectedApproval) && (
              <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/30">
                <div className="flex items-center gap-2 text-accent-red font-medium mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  拒绝原因
                </div>
                <p className="text-dark-200">{getRejectReason(selectedApproval)}</p>
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
                            <span className={clsx(
                              'text-dark-300',
                              node.status === 'current' && node.approver === activeApprover && 'text-accent-cyan font-medium'
                            )}>
                              {node.approver}
                              {node.status === 'current' && node.approver === activeApprover && '（轮到我处理）'}
                            </span>
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

            {/* 操作轨迹与耗时 */}
            {selectedApproval.trails && selectedApproval.trails.length > 0 && (
              <div>
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-accent-cyan" />
                  操作轨迹与耗时
                </h4>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-700" />
                  <div className="space-y-4">
                    {selectedApproval.trails.map((trail, idx) => (
                      <div key={idx} className="relative pl-10">
                        <div className="absolute left-0 w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs text-accent-cyan font-medium">
                          {idx + 1}
                        </div>
                        <div className="p-3 rounded-lg bg-dark-700/30 border border-dark-600/50">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white text-sm">{trail.action}</span>
                              {trail.nodeName && (
                                <span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-dark-300">
                                  {trail.nodeName}
                                </span>
                              )}
                              {trail.duration && (
                                <span className="text-xs px-2 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan">
                                  耗时 {trail.duration}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-dark-400">{formatDateTime(trail.timestamp)}</span>
                          </div>
                          <p className="text-xs text-dark-300">
                            <span className="text-dark-500">操作人：</span>
                            {trail.operator}
                            {trail.remark && <span className="text-dark-500"> · {trail.remark}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedApproval.status === 'pending' &&
              selectedApproval.nodes[selectedApproval.currentNode]?.approver ===
                activeApprover && (
                <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30">
                  <h4 className="font-medium text-white mb-3">我的审批（当前节点：{selectedApproval.nodes[selectedApproval.currentNode].name}）</h4>
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

      {/* 拒绝弹窗 */}
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

      {/* 发起申请弹窗 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({ type: 'renewal', subscriptionId: '', title: '', reason: '', templateKey: '', amount: 0 });
        }}
        title="发起申请"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">申请类型</label>
            <select
              value={createForm.type}
              onChange={(e) => {
                const t = e.target.value as ApprovalRequest['type'];
                setCreateForm({
                  ...createForm,
                  type: t,
                  templateKey: autoSelectTemplate(t, createForm.amount),
                });
              }}
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
          {(createForm.type === 'quota_expand' || createForm.type === 'new_subscription') && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                申请额度/金额 <span className="text-dark-500">（超过50000会自动选用高金额三级流程）</span>
              </label>
              <input
                type="number"
                value={createForm.amount || ''}
                onChange={(e) => {
                  const amt = Number(e.target.value) || 0;
                  setCreateForm({
                    ...createForm,
                    amount: amt,
                    templateKey: autoSelectTemplate(createForm.type, amt),
                  });
                }}
                className="input-field"
                placeholder="请输入额度/金额（单位：次）"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">审批模板</label>
            <select
              value={createForm.templateKey}
              onChange={(e) => setCreateForm({ ...createForm, templateKey: e.target.value as ApprovalTemplateKey })}
              className="input-field"
            >
              <option value="">自动选择（推荐）</option>
              {approvalTemplates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name} — {t.description}
                </option>
              ))}
            </select>
            {createForm.templateKey && (
              <div className="mt-2 p-3 rounded-lg bg-dark-700/30 border border-dark-600">
                <p className="text-xs text-dark-400 mb-1">流程预览：</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {approvalTemplates
                    .find((t) => t.key === createForm.templateKey)
                    ?.levels.map((lvl, idx, arr) => (
                      <span key={idx} className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-accent-cyan/10 text-accent-cyan">
                          {lvl.name} · {lvl.approver}
                        </span>
                        {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 text-dark-500" />}
                      </span>
                    ))}
                </div>
              </div>
            )}
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
                setCreateForm({ type: 'renewal', subscriptionId: '', title: '', reason: '', templateKey: '', amount: 0 });
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

      {/* 批量预览影响 */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="批量审批影响预览"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20">
            <p className="text-sm text-dark-200">
              本次批量通过共 <span className="text-accent-cyan font-semibold">{selectedIds.length}</span> 条申请，会带来以下联动影响：
            </p>
          </div>
          <div className="space-y-3">
            {batchImpact.products.length > 0 && (
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-2">涉及产品</p>
                <div className="flex flex-wrap gap-2">
                  {batchImpact.products.map((p) => (
                    <span key={p} className="text-xs px-3 py-1 rounded-full bg-dark-700 text-white">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {batchImpact.quotaIncrease > 0 && (
              <div className="p-4 rounded-xl bg-accent-orange/10 border border-accent-orange/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-dark-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent-orange" />
                    额度扩容合计
                  </p>
                  <p className="text-lg font-bold font-display text-accent-orange">
                    +{formatNumber(batchImpact.quotaIncrease)} 次
                  </p>
                </div>
                <p className="text-xs text-dark-400 mt-2">
                  额度总览、产品对比、产品订阅的额度数字会同时增加
                </p>
              </div>
            )}
            {batchImpact.subscriptionActivate.length > 0 && (
              <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/20">
                <p className="text-sm text-dark-200 flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-accent-green" />
                  激活以下待生效订阅
                </p>
                <div className="flex flex-wrap gap-2">
                  {batchImpact.subscriptionActivate.map((p, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {batchImpact.renewalExtend.length > 0 && (
              <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20">
                <p className="text-sm text-dark-200 flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-accent-cyan" />
                  以下订阅期限 +12 个月
                </p>
                <div className="flex flex-wrap gap-2">
                  {batchImpact.renewalExtend.map((p, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {batchImpact.termination.length > 0 && (
              <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/20">
                <p className="text-sm text-dark-200 flex items-center gap-2 mb-2">
                  <Ban className="w-4 h-4 text-accent-red" />
                  以下订阅将被停订
                </p>
                <div className="flex flex-wrap gap-2">
                  {batchImpact.termination.map((p, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/20">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="btn-secondary"
            >
              关闭
            </button>
            <button
              onClick={() => { setShowPreviewModal(false); handleBatchApprove(); }}
              className="btn-primary flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              确认批量通过
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// 审批列表组件（抽离复用）
interface ApprovalListProps {
  approvals: ApprovalRequest[];
  activeApprover: string;
  lowRiskIds: string[];
  isMyTurnCheck: (a: ApprovalRequest) => boolean;
  getRejectReason: (a: ApprovalRequest) => string;
  onViewDetail: (a: ApprovalRequest) => void;
  onQuickApprove: (a: ApprovalRequest) => void;
  onOpenApprove: (a: ApprovalRequest) => void;
  onOpenReject: (a: ApprovalRequest) => void;
  batchMode: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  getApprovalTypeIcon: (t: string) => JSX.Element;
  getApprovalTypeColor: (t: string) => string;
  getRiskColor: (lvl?: string) => string;
  getRiskIcon: (lvl?: string) => JSX.Element;
  getRiskText: (lvl?: string) => string;
  isOverdue: (a: ApprovalRequest) => boolean;
}

function ApprovalList({
  approvals,
  activeApprover,
  lowRiskIds,
  isMyTurnCheck,
  getRejectReason,
  onViewDetail,
  onQuickApprove,
  onOpenApprove,
  onOpenReject,
  batchMode,
  selectedIds,
  onToggleSelect,
  getApprovalTypeIcon,
  getApprovalTypeColor,
  getRiskColor,
  getRiskIcon,
  getRiskText,
  isOverdue,
}: ApprovalListProps) {
  if (approvals.length === 0) {
    return (
      <div className="card p-12 text-center text-dark-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>暂无匹配的审批记录</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {approvals.map((approval, index) => {
        const isMyTurn = isMyTurnCheck(approval);
        const isSelectable = batchMode && isMyTurn;
        const rejectReason = getRejectReason(approval);
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
                  <button onClick={() => onToggleSelect(approval.id)} className="mt-1">
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
                    {approval.riskLevel && (
                      <span className={clsx(
                        'px-2 py-0.5 text-xs rounded-full border flex items-center gap-1',
                        getRiskColor(approval.riskLevel)
                      )}>
                        {getRiskIcon(approval.riskLevel)}
                        {getRiskText(approval.riskLevel)}
                      </span>
                    )}
                    {isOverdue(approval) && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-accent-red/10 text-accent-red border border-accent-red/20 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        已超时
                      </span>
                    )}
                    {approval.templateName && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-dark-700/50 text-dark-300 border border-dark-600 flex items-center gap-1">
                        <Workflow className="w-3 h-3" />
                        {approval.templateName}
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
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-dark-400" />
                      <span className="text-dark-300">
                        当前：{approval.nodes[approval.currentNode]?.name}（
                        <span className={clsx(
                          approval.nodes[approval.currentNode]?.approver === activeApprover
                            ? 'text-accent-cyan font-medium'
                            : 'text-dark-300'
                        )}>
                          {approval.nodes[approval.currentNode]?.approver}
                        </span>
                        ）
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
                              ? clsx(
                                'bg-accent-cyan text-white',
                                node.approver === activeApprover ? 'animate-pulse ring-2 ring-accent-cyan/50' : 'animate-pulse'
                              )
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
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onViewDetail(approval)}
                  className="flex items-center gap-2 btn-secondary"
                >
                  <Eye className="w-4 h-4" />
                  查看详情
                </button>
                {isMyTurn && !batchMode && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onQuickApprove(approval)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/30 transition-colors"
                      title="快速通过（无需勾选）"
                    >
                      <Zap className="w-4 h-4" />
                      快速通过
                    </button>
                    <button
                      onClick={() => onOpenApprove(approval)}
                      className="flex items-center gap-2 btn-primary"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      通过
                    </button>
                    <button
                      onClick={() => onOpenReject(approval)}
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
    </div>
  );
}
