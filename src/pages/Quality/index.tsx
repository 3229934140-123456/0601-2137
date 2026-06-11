import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquareWarning,
  Plus,
  Filter,
  Search,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Paperclip,
  Send,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { formatDate } from '../../utils/date';
import { getTypeText, truncateText } from '../../utils/format';
import { clsx } from 'clsx';
import type { QualityFeedback } from '../../data/types';

export const QualityPage = () => {
  const { feedbacks, user, subscriptions, addFeedback, updateFeedback, pushNotification, pendingDetailId, setPendingDetailId } = useStore();
  const [activeTab, setActiveTab] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<QualityFeedback | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const [newFeedback, setNewFeedback] = useState({
    subscriptionId: '',
    type: 'accuracy' as const,
    severity: 'medium' as const,
    title: '',
    description: '',
  });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const tabs = [
    { key: 'all', label: '全部问题' },
    { key: 'processing', label: '处理中' },
    { key: 'resolved', label: '已解决' },
  ];

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || f.status === activeTab;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    return matchesSearch && matchesTab && matchesStatus && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-accent-red/20 text-accent-red border-accent-red';
      case 'high':
        return 'bg-accent-orange/20 text-accent-orange border-accent-orange';
      case 'medium':
        return 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan';
      default:
        return 'bg-dark-600 text-dark-300 border-dark-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4 text-accent-cyan" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-accent-orange" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-accent-green" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-dark-400" />;
      default:
        return <Clock className="w-4 h-4 text-dark-400" />;
    }
  };

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');

  const handleSubmit = () => {
    if (!newFeedback.subscriptionId || !newFeedback.title.trim() || !newFeedback.description.trim()) {
      return;
    }

    const subscription = subscriptions.find((s) => s.id === newFeedback.subscriptionId);
    const newItem: QualityFeedback = {
      id: `f${Date.now()}`,
      subscriptionId: newFeedback.subscriptionId,
      productName: subscription?.productName || '',
      type: newFeedback.type,
      severity: newFeedback.severity,
      title: newFeedback.title,
      description: newFeedback.description,
      attachments: [],
      status: 'submitted',
      submitter: user.name,
      submitTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      processingRecords: [
        {
          timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
          operator: user.name,
          action: '提交反馈',
          remark: '已提交问题反馈',
        },
      ],
    };

    addFeedback(newItem);
    setShowNewModal(false);
    setNewFeedback({
      subscriptionId: '',
      type: 'accuracy',
      severity: 'medium',
      title: '',
      description: '',
    });
    alert('问题反馈已提交！');
  };

  useEffect(() => {
    if (pendingDetailId.quality) {
      const fb = feedbacks.find((f) => f.id === pendingDetailId.quality);
      if (fb) {
        setSelectedFeedback(fb);
        setShowDetailModal(true);
      }
      setPendingDetailId('quality', undefined);
    }
  }, [pendingDetailId.quality, feedbacks]);

  const handleRatingSubmit = () => {
    if (selectedFeedback && rating > 0) {
      const updated = {
        ...selectedFeedback,
        rating,
        comment,
        status: 'closed' as const,
      };
      setSelectedFeedback(updated);
      updateFeedback(updated);

      pushNotification({
        type: 'quality',
        title: '质量问题已关闭',
        message: `【${selectedFeedback.productName}】的问题"${selectedFeedback.title}"已评价并关闭，评分：${rating}星。`,
        page: 'quality',
        params: { id: selectedFeedback.id },
      });

      setRating(0);
      setComment('');
      alert('感谢您的评价！');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="搜索问题..."
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
              className="input-field w-32 py-2"
            >
              <option value="all">全部状态</option>
              <option value="submitted">已提交</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="input-field w-32 py-2"
            >
              <option value="all">全部级别</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">紧急</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          提交反馈
        </button>
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      <div className="grid gap-4">
        {filteredFeedbacks.map((feedback, index) => (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card card-hover p-6 cursor-pointer"
            onClick={() => {
              setSelectedFeedback(feedback);
              setShowDetailModal(true);
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className={clsx(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  getSeverityColor(feedback.severity)
                )}
              >
                <MessageSquareWarning className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{feedback.title}</h3>
                  <Badge status={feedback.status} />
                  <span className={clsx('px-2 py-0.5 rounded text-xs font-medium border', getSeverityColor(feedback.severity))}>
                    {getTypeText(feedback.type)}
                  </span>
                </div>
                <p className="text-sm text-dark-300 mb-3">{truncateText(feedback.description, 100)}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-dark-400">
                    <span className="text-dark-500">产品：</span>
                    <span className="text-dark-200">{feedback.productName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-400">
                    <span className="text-dark-500">提交人：</span>
                    <span className="text-dark-200">{feedback.submitter}</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-400">
                    <span className="text-dark-500">提交时间：</span>
                    <span className="text-dark-200">{feedback.submitTime}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {feedback.status === 'resolved' && !feedback.rating && (
                  <span className="px-3 py-1 rounded-full text-xs bg-accent-orange/20 text-accent-orverage">
                    待评价
                  </span>
                )}
                {feedback.rating && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={clsx(
                          'w-4 h-4',
                          star <= feedback.rating! ? 'text-accent-orange fill-accent-orange' : 'text-dark-500'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="提交质量反馈"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              选择产品 <span className="text-accent-red">*</span>
            </label>
            <select
              value={newFeedback.subscriptionId}
              onChange={(e) => setNewFeedback({ ...newFeedback, subscriptionId: e.target.value })}
              className="input-field"
            >
              <option value="">请选择数据产品</option>
              {activeSubscriptions.map((s) => (
                <option key={s.id} value={s.id}>{s.productName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                问题类型 <span className="text-accent-red">*</span>
              </label>
              <select
                value={newFeedback.type}
                onChange={(e) => setNewFeedback({ ...newFeedback, type: e.target.value as any })}
                className="input-field"
              >
                <option value="accuracy">数据准确性</option>
                <option value="integrity">数据完整性</option>
                <option value="timeliness">数据时效性</option>
                <option value="format">格式问题</option>
                <option value="other">其他问题</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                严重程度 <span className="text-accent-red">*</span>
              </label>
              <select
                value={newFeedback.severity}
                onChange={(e) => setNewFeedback({ ...newFeedback, severity: e.target.value as any })}
                className="input-field"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="critical">紧急</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              问题标题 <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={newFeedback.title}
              onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
              className="input-field"
              placeholder="请简要描述问题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              问题描述 <span className="text-accent-red">*</span>
            </label>
            <textarea
              rows={5}
              value={newFeedback.description}
              onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
              className="input-field resize-none"
              placeholder="请详细描述遇到的问题，包括数据批次、错误现象、影响范围等..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              附件上传
            </label>
            <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center hover:border-accent-cyan/50 transition-colors cursor-pointer">
              <Paperclip className="w-8 h-8 text-dark-400 mx-auto mb-2" />
              <p className="text-sm text-dark-400">点击或拖拽文件到此处上传</p>
              <p className="text-xs text-dark-500 mt-1">支持 xlsx、csv、txt、png、jpg 格式，最大 10MB</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary flex items-center gap-2"
              disabled={!newFeedback.subscriptionId || !newFeedback.title.trim() || !newFeedback.description.trim()}
            >
              <Send className="w-4 h-4" />
              提交反馈
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal && !!selectedFeedback}
        onClose={() => setShowDetailModal(false)}
        title="问题详情"
        size="lg"
      >
        {selectedFeedback && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-white">{selectedFeedback.title}</h3>
                <Badge status={selectedFeedback.status} />
                <span className={clsx('px-2 py-0.5 rounded text-xs font-medium border', getSeverityColor(selectedFeedback.severity))}>
                  {getTypeText(selectedFeedback.type)}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-dark-400">
                <span>产品：{selectedFeedback.productName}</span>
                <span>提交人：{selectedFeedback.submitter}</span>
                <span>提交时间：{selectedFeedback.submitTime}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-dark-700/30">
              <h4 className="font-medium text-white mb-2">问题描述</h4>
              <p className="text-dark-300 whitespace-pre-wrap">{selectedFeedback.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-white mb-4">处理进度</h4>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-dark-600" />
                {selectedFeedback.processingRecords.map((record, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-accent-cyan border-2 border-dark-800" />
                    <div className="p-4 rounded-xl bg-dark-700/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">{record.action}</span>
                        <span className="text-xs text-dark-400">{record.timestamp}</span>
                      </div>
                      <p className="text-sm text-dark-300">{record.remark}</p>
                      <p className="text-xs text-dark-500 mt-1">处理人：{record.operator}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedFeedback.status === 'resolved' && !selectedFeedback.rating && (
              <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30">
                <h4 className="font-medium text-white mb-3">服务评价</h4>
                <div className="mb-3">
                  <p className="text-sm text-dark-300 mb-2">请对本次问题处理进行评分</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={clsx(
                            'w-6 h-6 transition-colors',
                            star <= rating ? 'text-accent-orange fill-accent-orange' : 'text-dark-500 hover:text-dark-300'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-dark-300 mb-2">评价说明（选填）</p>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="input-field resize-none"
                    placeholder="请输入您的评价和建议..."
                  />
                </div>
                <button
                  onClick={handleRatingSubmit}
                  className="btn-primary"
                  disabled={rating === 0}
                >
                  提交评价
                </button>
              </div>
            )}

            {selectedFeedback.rating && (
              <div className="p-4 rounded-xl bg-dark-700/30">
                <h4 className="font-medium text-white mb-3">我的评价</h4>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={clsx(
                        'w-5 h-5',
                        star <= selectedFeedback.rating! ? 'text-accent-orange fill-accent-orange' : 'text-dark-500'
                      )}
                    />
                  ))}
                </div>
                {selectedFeedback.comment && (
                  <p className="text-sm text-dark-300">{selectedFeedback.comment}</p>
                )}
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
    </div>
  );
};
