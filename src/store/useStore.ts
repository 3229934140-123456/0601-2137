import { create } from 'zustand';
import type {
  AppState,
  Subscription,
  QualityFeedback,
  ApprovalRequest,
  Notification,
  Member,
  Quota,
  Receiver,
  Permission,
  ApprovalTemplate,
  ApprovalTemplateKey,
  ApprovalTrail,
  ApprovalNode,
} from '../data/types';
import {
  mockProducts,
  mockSubscriptions,
  mockDeliveries,
  mockQuotas,
  mockFeedbacks,
  mockBills,
  mockMembers,
  mockApprovals,
  mockNotifications,
  mockCurrentUser,
  mockMonthlyExpenses,
} from '../data/mockData';
import { formatDate } from '../utils/date';

interface StoreState extends AppState {
  monthlyExpenses: { month: string; amount: number }[];
  rolePermissionsMap: Record<string, Permission[]>;
  activeApprover: string;
  pendingDetailId: { approval?: string; quality?: string };
  approvalTemplates: ApprovalTemplate[];
  setSubscriptions: (subscriptions: Subscription[]) => void;
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (subscription: Subscription) => void;
  addFeedback: (feedback: QualityFeedback) => void;
  updateFeedback: (feedback: QualityFeedback) => void;
  addApproval: (approval: ApprovalRequest) => void;
  addApprovalWithTemplate: (args: {
    type: ApprovalRequest['type'];
    subscriptionId: string;
    productName: string;
    title: string;
    reason: string;
    applicant: string;
    templateKey?: ApprovalTemplateKey;
    amount?: number;
  }) => ApprovalRequest;
  updateApproval: (approval: ApprovalRequest) => void;
  updateMember: (member: Member) => void;
  updateQuota: (quota: Quota) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  approveAndApplyEffect: (approval: ApprovalRequest) => void;
  batchApproveLowRisk: (approvalIds: string[]) => void;
  previewBatchImpact: (approvalIds: string[]) => {
    products: string[];
    quotaIncrease: number;
    subscriptionActivate: string[];
    renewalExtend: string[];
    termination: string[];
  };
  updateRolePermissions: (role: string, permissions: Permission[]) => void;
  applyRolePermissionsToMembers: (role: string) => void;
  pushNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  setActiveApprover: (name: string) => void;
  setPendingDetailId: (key: 'approval' | 'quality', id: string | undefined) => void;
  autoSelectTemplate: (type: ApprovalRequest['type'], amount?: number) => ApprovalTemplateKey;
}

export const defaultRolePermissions: Record<string, Permission[]> = {
  super_admin: [
    { module: 'subscription', actions: ['view', 'create', 'update', 'delete'] },
    { module: 'delivery', actions: ['view', 'download'] },
    { module: 'quota', actions: ['view', 'expand'] },
    { module: 'quality', actions: ['view', 'create', 'update'] },
    { module: 'billing', actions: ['view', 'export'] },
    { module: 'members', actions: ['view', 'create', 'update', 'delete'] },
    { module: 'approval', actions: ['view', 'approve', 'reject'] },
  ],
  admin: [
    { module: 'subscription', actions: ['view', 'create'] },
    { module: 'delivery', actions: ['view', 'download'] },
    { module: 'quota', actions: ['view', 'expand'] },
    { module: 'quality', actions: ['view', 'create', 'update'] },
    { module: 'billing', actions: ['view'] },
    { module: 'members', actions: ['view'] },
    { module: 'approval', actions: ['view'] },
  ],
  user: [
    { module: 'subscription', actions: ['view'] },
    { module: 'delivery', actions: ['view', 'download'] },
    { module: 'quota', actions: ['view'] },
    { module: 'quality', actions: ['view', 'create'] },
    { module: 'billing', actions: ['view'] },
    { module: 'members', actions: ['view'] },
    { module: 'approval', actions: ['view'] },
  ],
  finance: [
    { module: 'subscription', actions: ['view'] },
    { module: 'delivery', actions: ['view'] },
    { module: 'quota', actions: ['view'] },
    { module: 'quality', actions: ['view'] },
    { module: 'billing', actions: ['view', 'export', 'pay'] },
    { module: 'members', actions: ['view'] },
    { module: 'approval', actions: ['view', 'approve'] },
  ],
};

export const approvalTemplates: ApprovalTemplate[] = [
  {
    key: 'low_risk',
    name: '低风险两级审批',
    description: '适用于低金额、低风险日常申请：部门主管 → 财务',
    levels: [
      { name: '部门主管审批', approver: '王总' },
      { name: '财务复核', approver: '赵丽' },
    ],
  },
  {
    key: 'standard_3',
    name: '标准三级审批',
    description: '适用于常规订阅开通：部门主管 → 财务 → 总经理',
    levels: [
      { name: '部门主管审批', approver: '王总' },
      { name: '财务审核', approver: '赵丽' },
      { name: '总经理审批', approver: '李总' },
    ],
  },
  {
    key: 'high_amount',
    name: '高金额三级审批',
    description: '适用于高金额扩容（>50000次）或高价值新订：部门主管 → 财务 → 总经理',
    levels: [
      { name: '部门主管审批', approver: '王总' },
      { name: '财务审核（高金额）', approver: '赵丽' },
      { name: '总经理审批', approver: '李总' },
    ],
  },
  {
    key: 'termination_special',
    name: '停订专项审批',
    description: '停订涉及数据留存和合规，额外走合规岗：部门主管 → 合规 → 总经理',
    levels: [
      { name: '部门主管审批', approver: '王总' },
      { name: '合规审核', approver: '周敏' },
      { name: '总经理审批', approver: '李总' },
    ],
  },
  {
    key: 'renewal_standard',
    name: '续订标准两级审批',
    description: '标准续订流程：部门主管 → 财务',
    levels: [
      { name: '部门主管审批', approver: '王总' },
      { name: '财务审核', approver: '赵丽' },
    ],
  },
];

const calcDuration = (from: string, to: string) => {
  const diffMs = Math.abs(new Date(to.replace(/-/g, '/')).getTime() - new Date(from.replace(/-/g, '/')).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} 分钟`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时 ${mins % 60} 分`;
  const days = Math.floor(hrs / 24);
  return `${days} 天 ${hrs % 24} 小时`;
};

export const useStore = create<StoreState>((set, get) => ({
  user: mockCurrentUser,
  subscriptions: mockSubscriptions,
  products: mockProducts,
  deliveries: mockDeliveries,
  quotas: mockQuotas,
  feedbacks: mockFeedbacks,
  bills: mockBills,
  members: mockMembers,
  approvals: mockApprovals,
  notifications: mockNotifications,
  monthlyExpenses: mockMonthlyExpenses,
  rolePermissionsMap: defaultRolePermissions,
  activeApprover: mockCurrentUser.name,
  pendingDetailId: {},
  approvalTemplates,

  setActiveApprover: (name) => set({ activeApprover: name }),

  setPendingDetailId: (key, id) =>
    set((state) => ({
      pendingDetailId: { ...state.pendingDetailId, [key]: id },
    })),

  autoSelectTemplate: (type, amount) => {
    if (type === 'termination') return 'termination_special';
    if (type === 'renewal') return 'renewal_standard';
    if (type === 'quota_expand') {
      return (amount || 0) > 50000 ? 'high_amount' : 'low_risk';
    }
    if (type === 'new_subscription') {
      return (amount || 0) > 50000 ? 'high_amount' : 'standard_3';
    }
    return 'standard_3';
  },

  addApprovalWithTemplate: ({ type, subscriptionId, productName, title, reason, applicant, templateKey, amount }) => {
    const now = new Date();
    const nowStr = formatDate(now, 'YYYY-MM-DD HH:mm:ss');
    const tplKey = templateKey || get().autoSelectTemplate(type, amount);
    const tpl = get().approvalTemplates.find((t) => t.key === tplKey) || get().approvalTemplates[0];

    let riskLevel: ApprovalRequest['riskLevel'] = 'medium';
    if (type === 'termination') riskLevel = 'high';
    else if (type === 'quota_expand') riskLevel = (amount || 0) > 50000 ? 'high' : 'low';
    else if (type === 'new_subscription') riskLevel = (amount || 0) > 50000 ? 'high' : 'medium';
    else if (type === 'renewal') riskLevel = 'low';

    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + (riskLevel === 'high' ? 1 : 3));

    const id = `a_${Date.now()}`;
    const nodes: ApprovalNode[] = tpl.levels.map((lvl, idx) => ({
      id: `${id}_n${idx + 1}`,
      name: lvl.name,
      approver: lvl.approver,
      status: idx === 0 ? 'current' : 'pending',
      arriveTime: idx === 0 ? nowStr : undefined,
    }));

    const trails: ApprovalTrail[] = [
      {
        timestamp: nowStr,
        operator: applicant,
        action: '提交申请',
        remark: `选用流程「${tpl.name}」：${tpl.description}`,
      },
    ];

    const approval: ApprovalRequest = {
      id,
      type,
      title,
      subscriptionId,
      productName,
      applicant,
      applyTime: nowStr,
      reason,
      status: 'pending',
      currentNode: 0,
      nodes,
      templateKey: tpl.key,
      templateName: tpl.name,
      amount,
      trails,
      riskLevel,
      deadline: formatDate(deadline, 'YYYY-MM-DD HH:mm:ss'),
    };

    set((state) => ({ approvals: [approval, ...state.approvals] }));
    return approval;
  },

  previewBatchImpact: (approvalIds) => {
    const products: string[] = [];
    let quotaIncrease = 0;
    const subscriptionActivate: string[] = [];
    const renewalExtend: string[] = [];
    const termination: string[] = [];
    const state = get();
    state.approvals.forEach((a) => {
      if (!approvalIds.includes(a.id) || a.status !== 'pending') return;
      if (!products.includes(a.productName)) products.push(a.productName);
      if (a.type === 'quota_expand') {
        const m = a.reason.match(/扩容额度[：:]\s*(\d+)/);
        quotaIncrease += m ? parseInt(m[1], 10) : a.amount || 0;
      } else if (a.type === 'new_subscription') {
        subscriptionActivate.push(a.productName);
      } else if (a.type === 'renewal') {
        renewalExtend.push(a.productName);
      } else if (a.type === 'termination') {
        termination.push(a.productName);
      }
    });
    return { products, quotaIncrease, subscriptionActivate, renewalExtend, termination };
  },

  pushNotification: (n) => {
    const state = get();
    const newN: Notification = {
      ...n,
      id: `nt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      createdAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
    };
    set({ notifications: [newN, ...state.notifications] });
  },

  setSubscriptions: (subscriptions) => set({ subscriptions }),

  addSubscription: (subscription) =>
    set((state) => ({
      subscriptions: [...state.subscriptions, subscription],
    })),

  updateSubscription: (subscription) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === subscription.id ? subscription : s
      ),
    })),

  addFeedback: (feedback) =>
    set((state) => ({
      feedbacks: [feedback, ...state.feedbacks],
    })),

  updateFeedback: (feedback) =>
    set((state) => ({
      feedbacks: state.feedbacks.map((f) =>
        f.id === feedback.id ? feedback : f
      ),
    })),

  addApproval: (approval) =>
    set((state) => ({
      approvals: [approval, ...state.approvals],
    })),

  updateApproval: (approval) =>
    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === approval.id ? approval : a
      ),
    })),

  updateMember: (member) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === member.id ? member : m
      ),
    })),

  updateQuota: (quota) =>
    set((state) => ({
      quotas: state.quotas.map((q) =>
        q.id === quota.id ? quota : q
      ),
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  approveAndApplyEffect: (approval) => {
    const state = get();
    const nowStr = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
    let updatedQuotas = state.quotas;
    let updatedSubscriptions = state.subscriptions;

    const cloneApproval: ApprovalRequest = JSON.parse(JSON.stringify(approval));
    const oldApproval = state.approvals.find((a) => a.id === approval.id);
    const trails: ApprovalTrail[] = oldApproval?.trails ? JSON.parse(JSON.stringify(oldApproval.trails)) : [{ timestamp: oldApproval?.applyTime || cloneApproval.applyTime, operator: oldApproval?.applicant || cloneApproval.applicant, action: '提交申请' }];

    cloneApproval.nodes.forEach((node, idx) => {
      if (node.status === 'approved' && oldApproval?.nodes[idx]?.status !== 'approved') {
        const duration = (oldApproval?.nodes[idx]?.arriveTime || oldApproval?.applyTime)
          ? calcDuration(oldApproval.nodes[idx]?.arriveTime || oldApproval.applyTime, node.approveTime || nowStr)
          : undefined;
        trails.push({
          timestamp: node.approveTime || nowStr,
          operator: node.approver,
          action: '通过',
          nodeName: node.name,
          remark: node.comment || '通过审批',
          duration,
        });
        if (idx < cloneApproval.nodes.length - 1 && cloneApproval.currentNode === idx + 1) {
          const next = cloneApproval.nodes[idx + 1];
          if (!next.arriveTime) next.arriveTime = nowStr;
          trails.push({
            timestamp: nowStr,
            operator: '系统',
            action: '流转到下一节点',
            nodeName: next.name,
            remark: `交由 ${next.approver} 处理`,
          });
        }
      }
      if (node.status === 'rejected' && oldApproval?.nodes[idx]?.status !== 'rejected') {
        const duration = (oldApproval?.nodes[idx]?.arriveTime || oldApproval?.applyTime)
          ? calcDuration(oldApproval.nodes[idx]?.arriveTime || oldApproval.applyTime, node.approveTime || nowStr)
          : undefined;
        trails.push({
          timestamp: node.approveTime || nowStr,
          operator: node.approver,
          action: '拒绝',
          nodeName: node.name,
          remark: node.comment || '拒绝申请',
          duration,
        });
      }
    });

    if (cloneApproval.status === 'approved') {
      trails.push({ timestamp: nowStr, operator: '系统', action: '审批完成', remark: '全部节点通过，申请生效' });
    }
    if (cloneApproval.status === 'rejected') {
      trails.push({ timestamp: nowStr, operator: '系统', action: '审批终止', remark: '申请被拒绝，流程结束' });
    }

    cloneApproval.trails = trails;

    if (cloneApproval.status === 'approved' && cloneApproval.type === 'quota_expand') {
      const matchReason = cloneApproval.reason.match(/扩容额度[：:]\s*(\d+)/);
      const expandAmount = (cloneApproval.amount || 0) > 0 ? cloneApproval.amount : (matchReason ? parseInt(matchReason[1], 10) : 0);

      if (expandAmount > 0) {
        updatedQuotas = state.quotas.map((q) => {
          if (q.subscriptionId === cloneApproval.subscriptionId) {
            return { ...q, totalQuota: q.totalQuota + expandAmount };
          }
          return q;
        });
        updatedSubscriptions = state.subscriptions.map((s) => {
          if (s.id === cloneApproval.subscriptionId) {
            return { ...s, quota: s.quota + expandAmount };
          }
          return s;
        });
      }
    }

    if (cloneApproval.status === 'approved' && cloneApproval.type === 'new_subscription') {
      updatedSubscriptions = state.subscriptions.map((s) => {
        if (s.id === cloneApproval.subscriptionId && s.status === 'pending') {
          return { ...s, status: 'active' as const };
        }
        return s;
      });
    }

    if (cloneApproval.status === 'approved' && cloneApproval.type === 'renewal') {
      updatedSubscriptions = state.subscriptions.map((s) => {
        if (s.id === cloneApproval.subscriptionId) {
          const endDate = new Date(s.endDate);
          endDate.setMonth(endDate.getMonth() + 12);
          return {
            ...s,
            endDate: formatDate(endDate),
            status: 'active' as const,
          };
        }
        return s;
      });
    }

    if (cloneApproval.status === 'approved' && cloneApproval.type === 'termination') {
      updatedSubscriptions = state.subscriptions.map((s) => {
        if (s.id === cloneApproval.subscriptionId) {
          return { ...s, status: 'expired' as const, endDate: formatDate(new Date()) };
        }
        return s;
      });
    }

    const updatedApprovals = state.approvals.map((a) =>
      a.id === cloneApproval.id ? cloneApproval : a
    );

    set({
      approvals: updatedApprovals,
      quotas: updatedQuotas,
      subscriptions: updatedSubscriptions,
    });

    if (cloneApproval.status === 'approved') {
      const typeText: Record<string, string> = {
        quota_expand: '额度扩容',
        new_subscription: '新订申请',
        renewal: '续订申请',
        termination: '停订申请',
      };
      get().pushNotification({
        type: 'approval',
        title: `${typeText[cloneApproval.type] || '申请'}已通过`,
        message: `【${cloneApproval.productName}】的申请已通过审批，相关数据已同步更新。`,
        page: 'approval',
        params: { id: cloneApproval.id },
      });
    } else if (cloneApproval.status === 'rejected') {
      const lastNode = cloneApproval.nodes[cloneApproval.nodes.length - 1];
      const rejectNode = [...cloneApproval.nodes].reverse().find((n) => n.status === 'rejected');
      const rejectMsg = rejectNode?.comment || lastNode?.comment || '未填写拒绝原因';
      const typeText: Record<string, string> = {
        quota_expand: '额度扩容',
        new_subscription: '新订申请',
        renewal: '续订申请',
        termination: '停订申请',
      };
      get().pushNotification({
        type: 'approval',
        title: `${typeText[cloneApproval.type] || '申请'}被拒绝`,
        message: `【${cloneApproval.productName}】申请被拒绝：${rejectMsg}`,
        page: 'approval',
        params: { id: cloneApproval.id },
      });
    }
  },

  batchApproveLowRisk: (approvalIds) => {
    const state = get();
    const now = new Date();
    const nowStr = formatDate(now, 'YYYY-MM-DD HH:mm:ss');
    let updatedSubscriptions = state.subscriptions;
    let updatedQuotas = state.quotas;

    const updatedApprovals = state.approvals.map((a) => {
      if (!approvalIds.includes(a.id)) return a;
      if (a.status !== 'pending') return a;

      const clone: ApprovalRequest = JSON.parse(JSON.stringify(a));
      clone.nodes.forEach((node) => {
        node.status = 'approved';
        node.comment = node.comment || '批量审批通过';
        node.approveTime = node.approveTime || nowStr;
      });
      clone.currentNode = clone.nodes.length - 1;
      clone.status = 'approved';

      if (clone.type === 'quota_expand') {
        const matchReason = clone.reason.match(/扩容额度[：:]\s*(\d+)/);
        const expandAmount = matchReason ? parseInt(matchReason[1], 10) : 0;
        if (expandAmount > 0) {
          updatedQuotas = updatedQuotas.map((q) => {
            if (q.subscriptionId === clone.subscriptionId) {
              return { ...q, totalQuota: q.totalQuota + expandAmount };
            }
            return q;
          });
          updatedSubscriptions = updatedSubscriptions.map((s) => {
            if (s.id === clone.subscriptionId) {
              return { ...s, quota: s.quota + expandAmount };
            }
            return s;
          });
        }
      }
      if (clone.type === 'new_subscription') {
        updatedSubscriptions = updatedSubscriptions.map((s) => {
          if (s.id === clone.subscriptionId && s.status === 'pending') {
            return { ...s, status: 'active' as const };
          }
          return s;
        });
      }
      if (clone.type === 'renewal') {
        updatedSubscriptions = updatedSubscriptions.map((s) => {
          if (s.id === clone.subscriptionId) {
            const endDate = new Date(s.endDate);
            endDate.setMonth(endDate.getMonth() + 12);
            return { ...s, endDate: formatDate(endDate), status: 'active' as const };
          }
          return s;
        });
      }
      if (clone.type === 'termination') {
        updatedSubscriptions = updatedSubscriptions.map((s) => {
          if (s.id === clone.subscriptionId) {
            return { ...s, status: 'expired' as const, endDate: formatDate(new Date()) };
          }
          return s;
        });
      }
      return clone;
    });

    set({
      approvals: updatedApprovals,
      quotas: updatedQuotas,
      subscriptions: updatedSubscriptions,
    });

    get().pushNotification({
      type: 'approval',
      title: '批量审批完成',
      message: `共 ${approvalIds.length} 条申请已通过批量审批。`,
      page: 'approval',
    });
  },

  updateRolePermissions: (role, permissions) => {
    const state = get();
    const newMap = { ...state.rolePermissionsMap, [role]: permissions };
    set({ rolePermissionsMap: newMap });
    get().applyRolePermissionsToMembers(role);
  },

  applyRolePermissionsToMembers: (role) => {
    const state = get();
    const perms = state.rolePermissionsMap[role];
    if (!perms) return;
    const updatedMembers = state.members.map((m) => {
      if (m.role === role) {
        return { ...m, permissions: JSON.parse(JSON.stringify(perms)) };
      }
      return m;
    });
    set({ members: updatedMembers });
  },
}));
