export const formatNumber = (num: number): string => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万';
  }
  return num.toLocaleString();
};

export const formatCurrency = (amount: number): string => {
  return '¥' + amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatPercentage = (value: number): string => {
  return value.toFixed(2) + '%';
};

export const formatFileSize = (size: number, unit: 'MB' | 'GB' | 'TB' = 'MB'): string => {
  if (unit === 'TB') return size.toFixed(2) + ' TB';
  if (unit === 'GB') return size.toFixed(2) + ' GB';
  if (size >= 1024) return (size / 1024).toFixed(2) + ' GB';
  return size.toFixed(2) + ' MB';
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: '运行中',
    pending: '待生效',
    expired: '已过期',
    suspended: '已暂停',
    completed: '已完成',
    delivering: '交付中',
    failed: '交付失败',
    submitted: '已提交',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
    unpaid: '待支付',
    paid: '已支付',
    overdue: '已逾期',
    approved: '已通过',
    rejected: '已拒绝',
    low: '低',
    medium: '中',
    high: '高',
    critical: '紧急',
  };
  return statusMap[status] || status;
};

export const getRoleText = (role: string): string => {
  const roleMap: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    user: '普通成员',
    finance: '财务人员',
  };
  return roleMap[role] || role;
};

export const getTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    accuracy: '数据准确性',
    integrity: '数据完整性',
    timeliness: '数据时效性',
    format: '格式问题',
    other: '其他问题',
    renewal: '续订申请',
    termination: '停订申请',
    quota_expand: '额度扩容',
    new_subscription: '新订申请',
    delivery: '交付通知',
    quota: '额度提醒',
    approval: '审批通知',
    quality: '质量反馈',
    billing: '账单通知',
  };
  return typeMap[type] || type;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
