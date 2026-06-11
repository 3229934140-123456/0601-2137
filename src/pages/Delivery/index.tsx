import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatDate, getCalendarDays } from '../../utils/date';
import { formatFileSize, formatNumber } from '../../utils/format';
import type { DeliveryBatch } from '../../data/types';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export const DeliveryPage = () => {
  const { deliveries, notifications } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedBatch, setSelectedBatch] = useState<DeliveryBatch | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDeliveriesForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return deliveries.filter((d) => d.deliveryDate === dateStr);
  };

  const getDateStatusColor = (date: Date) => {
    const dateDeliveries = getDeliveriesForDate(date);
    if (dateDeliveries.length === 0) return null;
    if (dateDeliveries.some((d) => d.status === 'failed')) return 'bg-accent-red/30 border-accent-red';
    if (dateDeliveries.some((d) => d.status === 'delivering')) return 'bg-accent-orange/30 border-accent-orange';
    if (dateDeliveries.some((d) => d.status === 'completed')) return 'bg-accent-green/30 border-accent-green';
    if (dateDeliveries.some((d) => d.status === 'pending')) return 'bg-accent-cyan/30 border-accent-cyan';
    return null;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const selectedDateDeliveries = selectedDate ? getDeliveriesForDate(selectedDate) : [];

  const upcomingDeliveries = deliveries
    .filter((d) => d.status === 'pending')
    .slice(0, 5);

  const recentDeliveries = deliveries
    .filter((d) => d.status !== 'pending')
    .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
    .slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-accent-green" />;
      case 'delivering':
        return <Clock className="w-4 h-4 text-accent-orange" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-accent-cyan" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-accent-red" />;
      default:
        return <AlertCircle className="w-4 h-4 text-dark-400" />;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-cyan" />
              {year}年{month + 1}月
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm rounded-lg bg-dark-700/50 text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
              >
                今天
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-dark-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="aspect-square" />;
              const dayDeliveries = getDeliveriesForDate(date);
              const statusColor = getDateStatusColor(date);

              return (
                <motion.button
                  key={date.toISOString()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square p-1 rounded-lg transition-all duration-200 relative ${
                    isSelected(date)
                      ? 'bg-accent-cyan/20 border-2 border-accent-cyan'
                      : isToday(date)
                      ? 'bg-dark-700/50 border border-accent-cyan/50'
                      : 'hover:bg-dark-700/30 border border-transparent'
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday(date) || isSelected(date) ? 'text-white' : 'text-dark-300'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dayDeliveries.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayDeliveries.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${statusColor?.split(' ')[0].replace('bg-', '')}`}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-dark-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-green/30 border border-accent-green" />
              <span className="text-xs text-dark-400">已完成</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-orange/30 border border-accent-orange" />
              <span className="text-xs text-dark-400">交付中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-cyan/30 border border-accent-cyan" />
              <span className="text-xs text-dark-400">待交付</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-red/30 border border-accent-red" />
              <span className="text-xs text-dark-400">交付失败</span>
            </div>
          </div>
        </div>

        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {formatDate(selectedDate)} 交付批次
            </h3>
            {selectedDateDeliveries.length === 0 ? (
              <div className="text-center py-12 text-dark-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>该日期暂无交付批次</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateDeliveries.map((batch, index) => (
                  <motion.div
                    key={batch.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-dark-700/30 border border-dark-600 hover:border-dark-500 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        batch.status === 'completed'
                          ? 'bg-accent-green/20'
                          : batch.status === 'delivering'
                          ? 'bg-accent-orange/20'
                          : batch.status === 'failed'
                          ? 'bg-accent-red/20'
                          : 'bg-accent-cyan/20'
                      }`}
                    >
                      {getStatusIcon(batch.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white">{batch.productName}</p>
                        <Badge status={batch.status} />
                      </div>
                      <p className="text-sm text-dark-400">批次号：{batch.batchNo}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-dark-400">
                        <span>
                          数据量：{formatFileSize(batch.dataVolume, batch.dataUnit)}
                        </span>
                        <span>记录数：{formatNumber(batch.recordCount)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {batch.status === 'completed' && (
                        <button
                          onClick={() => alert('服务报告已开始下载！')}
                          className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                          title="下载服务报告"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedBatch(batch);
                          setShowDetailModal(true);
                        }}
                        className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {batch.status === 'completed' && (
                        <button
                          onClick={() => alert('数据文件已开始下载！')}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          下载
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">待交付提醒</h3>
          <div className="space-y-3">
            {upcomingDeliveries.length === 0 ? (
              <p className="text-sm text-dark-400 text-center py-4">暂无待交付</p>
            ) : (
              upcomingDeliveries.map((delivery, index) => (
                <motion.div
                  key={delivery.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-dark-700/30 border border-dark-600"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-accent-cyan" />
                    <span className="text-sm font-medium text-white">
                      {delivery.productName}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 ml-6">
                    预计交付：{formatDate(delivery.deliveryDate)}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">最近交付</h3>
          <div className="space-y-3">
            {recentDeliveries.map((delivery, index) => (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-700/30 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedBatch(delivery);
                  setShowDetailModal(true);
                }}
              >
                {getStatusIcon(delivery.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {delivery.productName}
                  </p>
                  <p className="text-xs text-dark-400">
                    {formatDate(delivery.deliveryDate)} · {formatFileSize(delivery.dataVolume, delivery.dataUnit)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDetailModal && !!selectedBatch}
        onClose={() => setShowDetailModal(false)}
        title="交付详情"
        size="lg"
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-1">产品名称</p>
                <p className="font-medium text-white">{selectedBatch.productName}</p>
              </div>
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-1">批次号</p>
                <p className="font-medium text-white font-mono">{selectedBatch.batchNo}</p>
              </div>
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-1">交付日期</p>
                <p className="font-medium text-white">{formatDate(selectedBatch.deliveryDate)}</p>
              </div>
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-1">状态</p>
                <Badge status={selectedBatch.status} />
              </div>
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-1">数据量</p>
                <p className="font-medium text-white">
                  {formatFileSize(selectedBatch.dataVolume, selectedBatch.dataUnit)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-1">记录数</p>
                <p className="font-medium text-white">{formatNumber(selectedBatch.recordCount)}</p>
              </div>
            </div>

            {selectedBatch.dataList.length > 0 && (
              <div>
                <h4 className="font-semibold text-white mb-3">数据文件</h4>
                <div className="space-y-2">
                  {selectedBatch.dataList.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30 border border-dark-600"
                    >
                      <FileText className="w-5 h-5 text-accent-cyan" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-xs text-dark-400">
                          {item.format} · {formatFileSize(item.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => alert(`${item.name} 已开始下载！`)}
                        className="p-2 rounded-lg text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBatch.deliveryLog.length > 0 && (
              <div>
                <h4 className="font-semibold text-white mb-3">交付日志</h4>
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-dark-600" />
                  {selectedBatch.deliveryLog.map((log, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-accent-cyan border-2 border-dark-800" />
                      <div className="p-3 rounded-lg bg-dark-700/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{log.status}</span>
                          <span className="text-xs text-dark-400">{log.timestamp}</span>
                        </div>
                        <p className="text-xs text-dark-400">{log.remark}</p>
                        <p className="text-xs text-dark-500 mt-1">操作人：{log.operator}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">
                关闭
              </button>
              {selectedBatch.status === 'completed' && (
                <button
                  onClick={() => alert('服务报告已开始下载！')}
                  className="btn-primary flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  下载服务报告
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
