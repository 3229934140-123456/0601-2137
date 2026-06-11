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
  setSubscriptions: (subscriptions: Subscription[]) => void;
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (subscription: Subscription) => void;
  addFeedback: (feedback: QualityFeedback) => void;
  updateFeedback: (feedback: QualityFeedback) => void;
  addApproval: (approval: ApprovalRequest) => void;
  updateApproval: (approval: ApprovalRequest) => void;
  updateMember: (member: Member) => void;
  updateQuota: (quota: Quota) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  approveAndApplyEffect: (approval: ApprovalRequest) => void;
  batchApproveLowRisk: (approvalIds: string[]) => void;
  updateRolePermissions: (role: string, permissions: Permission[]) => void;
  applyRolePermissionsToMembers: (role: string) => void;
  pushNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
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

    if (approval.status === 'approved' && approval.type === 'quota_expand') {
      const matchReason = approval.reason.match(/扩容额度[：:]\s*(\d+)/);
      const expandAmount = matchReason ? parseInt(matchReason[1], 10) : 0;

      if (expandAmount > 0) {
        updatedQuotas = state.quotas.map((q) => {
          if (q.subscriptionId === approval.subscriptionId) {
            return { ...q, totalQuota: q.totalQuota + expandAmount };
          }
          return q;
        });
        updatedSubscriptions = state.subscriptions.map((s) => {
          if (s.id === approval.subscriptionId) {
            return { ...s, quota: s.quota + expandAmount };
          }
          return s;
        });
      }
    }

    if (approval.status === 'approved' && approval.type === 'new_subscription') {
      updatedSubscriptions = state.subscriptions.map((s) => {
        if (s.id === approval.subscriptionId && s.status === 'pending') {
          return { ...s, status: 'active' as const };
        }
        return s;
      });
    }

    if (approval.status === 'approved' && approval.type === 'renewal') {
      updatedSubscriptions = state.subscriptions.map((s) => {
        if (s.id === approval.subscriptionId) {
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

    if (approval.status === 'approved' && approval.type === 'termination') {
      updatedSubscriptions = state.subscriptions.map((s) => {
        if (s.id === approval.subscriptionId) {
          return { ...s, status: 'expired' as const, endDate: formatDate(new Date()) };
        }
        return s;
      });
    }

    const updatedApprovals = state.approvals.map((a) =>
      a.id === approval.id ? approval : a
    );

    set({
      approvals: updatedApprovals,
      quotas: updatedQuotas,
      subscriptions: updatedSubscriptions,
    });

    if (approval.status === 'approved') {
      const typeText: Record<string, string> = {
        quota_expand: '额度扩容',
        new_subscription: '新订申请',
        renewal: '续订申请',
        termination: '停订申请',
      };
      get().pushNotification({
        type: 'approval',
        title: `${typeText[approval.type] || '申请'}已通过`,
        message: `【${approval.productName}】的申请已通过审批，相关数据已同步更新。`,
        page: 'approval',
        params: { id: approval.id },
      });
    } else if (approval.status === 'rejected') {
      const lastNode = approval.nodes[approval.nodes.length - 1];
      const rejectMsg = lastNode?.comment || '未填写拒绝原因';
      const typeText: Record<string, string> = {
        quota_expand: '额度扩容',
        new_subscription: '新订申请',
        renewal: '续订申请',
        termination: '停订申请',
      };
      get().pushNotification({
        type: 'approval',
        title: `${typeText[approval.type] || '申请'}被拒绝`,
        message: `【${approval.productName}】申请被拒绝：${rejectMsg}`,
        page: 'approval',
        params: { id: approval.id },
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
      clone.nodes.forEach((node, idx) => {
        if (idx <= clone.currentNode) {
          node.status = 'approved';
          node.comment = node.comment || '批量审批通过';
          node.approveTime = node.approveTime || nowStr;
        }
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
