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

interface StoreState extends AppState {
  monthlyExpenses: { month: string; amount: number }[];
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
}

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
    const updatedApprovals = state.approvals.map((a) =>
      a.id === approval.id ? approval : a
    );

    if (approval.status === 'approved' && approval.type === 'quota_expand') {
      const matchReason = approval.reason.match(/扩容额度[：:]\s*(\d+)/);
      const expandAmount = matchReason ? parseInt(matchReason[1], 10) : 0;

      if (expandAmount > 0) {
        const updatedQuotas = state.quotas.map((q) => {
          if (q.subscriptionId === approval.subscriptionId) {
            return { ...q, totalQuota: q.totalQuota + expandAmount };
          }
          return q;
        });
        const updatedSubscriptions = state.subscriptions.map((s) => {
          if (s.id === approval.subscriptionId) {
            return { ...s, quota: s.quota + expandAmount };
          }
          return s;
        });
        set({
          approvals: updatedApprovals,
          quotas: updatedQuotas,
          subscriptions: updatedSubscriptions,
        });
        return;
      }
    }

    if (approval.status === 'approved' && approval.type === 'new_subscription') {
      const updatedSubscriptions = state.subscriptions.map((s) => {
        if (s.id === approval.subscriptionId && s.status === 'pending') {
          return { ...s, status: 'active' as const };
        }
        return s;
      });
      set({
        approvals: updatedApprovals,
        subscriptions: updatedSubscriptions,
      });
      return;
    }

    set({ approvals: updatedApprovals });
  },
}));
