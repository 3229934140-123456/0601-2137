export interface Product {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  price: number;
  priceUnit: 'month' | 'year' | 'times';
  defaultQuota: number;
  dataType: string[];
  updateFrequency: string;
  coverage: string;
  sampleData: string[];
}

export interface Receiver {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
}

export interface Subscription {
  id: string;
  productId: string;
  productName: string;
  provider: string;
  status: 'active' | 'pending' | 'expired' | 'suspended';
  startDate: string;
  endDate: string;
  quota: number;
  usedQuota: number;
  receivers: Receiver[];
  autoRenewal: boolean;
  createdAt: string;
}

export interface DataItem {
  name: string;
  format: string;
  size: number;
  downloadUrl: string;
}

export interface DeliveryLog {
  timestamp: string;
  status: string;
  operator: string;
  remark: string;
}

export interface DeliveryBatch {
  id: string;
  subscriptionId: string;
  productName: string;
  batchNo: string;
  deliveryDate: string;
  dataVolume: number;
  dataUnit: 'MB' | 'GB' | 'TB';
  recordCount: number;
  status: 'pending' | 'delivering' | 'completed' | 'failed';
  dataList: DataItem[];
  deliveryLog: DeliveryLog[];
}

export interface UsageRecord {
  date: string;
  usage: number;
}

export interface Quota {
  id: string;
  subscriptionId: string;
  productName: string;
  totalQuota: number;
  usedQuota: number;
  unit: string;
  resetCycle: 'daily' | 'monthly' | 'yearly';
  lastResetDate: string;
  usageHistory: UsageRecord[];
  alertThreshold: number;
}

export interface ProcessingRecord {
  timestamp: string;
  operator: string;
  action: string;
  remark: string;
}

export interface QualityFeedback {
  id: string;
  subscriptionId: string;
  productName: string;
  type: 'accuracy' | 'integrity' | 'timeliness' | 'format' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  attachments: string[];
  status: 'submitted' | 'processing' | 'resolved' | 'closed';
  submitter: string;
  submitTime: string;
  processingRecords: ProcessingRecord[];
  rating?: number;
  comment?: string;
}

export interface BillItem {
  id: string;
  productName: string;
  subscriptionId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  department: string;
}

export interface DepartmentCost {
  department: string;
  amount: number;
  percentage: number;
}

export interface Bill {
  id: string;
  period: string;
  totalAmount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: BillItem[];
  departmentSummary: DepartmentCost[];
}

export interface Permission {
  module: string;
  actions: string[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'super_admin' | 'admin' | 'user' | 'finance';
  department: string;
  permissions: Permission[];
  status: 'active' | 'inactive';
  joinDate: string;
}

export interface ApprovalNode {
  id: string;
  name: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected' | 'current';
  approveTime?: string;
  comment?: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'renewal' | 'termination' | 'quota_expand' | 'new_subscription';
  title: string;
  subscriptionId: string;
  productName: string;
  applicant: string;
  applyTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  currentNode: number;
  nodes: ApprovalNode[];
}

export interface Notification {
  id: string;
  type: 'delivery' | 'quota' | 'approval' | 'quality' | 'billing' | 'subscription';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  page?: 'subscription' | 'approval' | 'quality' | 'quota' | 'billing' | 'members' | 'delivery';
  params?: Record<string, string>;
}

export interface AppState {
  user: Member;
  subscriptions: Subscription[];
  products: Product[];
  deliveries: DeliveryBatch[];
  quotas: Quota[];
  feedbacks: QualityFeedback[];
  bills: Bill[];
  members: Member[];
  approvals: ApprovalRequest[];
  notifications: Notification[];
}
