import { create } from 'zustand';
import type {
  AppState,
  Subscription,
  QualityFeedback,
  ApprovalRequest,
  Notification,
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
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useStore = create<StoreState>((set) => ({
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
}));
