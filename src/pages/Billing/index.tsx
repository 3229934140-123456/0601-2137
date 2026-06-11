import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  CreditCard,
  AlertCircle,
  TrendingUp,
  PieChart,
  Download,
  Eye,
  Calendar,
  Search,
  Filter,
  X,
  CheckCircle2,
  Clock,
  Building2,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/date';
import { formatCurrency, formatNumber, getStatusText } from '../../utils/format';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { Bill } from '../../data/types';

const CHART_COLORS = ['#06B6D4', '#8B5CF6', '#F97316', '#10B981', '#EF4444', '#3B82F6'];

export const BillingPage = () => {
  const { bills, monthlyExpenses } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const totalUnpaid = bills.filter((b) => b.status === 'unpaid').reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaid = bills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + b.totalAmount, 0);
  const currentMonthBill = bills.find((b) => b.status === 'unpaid');
  const departmentCount = currentMonthBill?.departmentSummary.length || 0;

  const filteredBills = bills.filter((b) => {
    const matchesSearch = b.period.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tabs = [
    { key: 'overview', label: '费用总览' },
    { key: 'bills', label: '账单列表' },
    { key: 'department', label: '部门成本' },
  ];

  const chartData = monthlyExpenses.map((item) => ({
    ...item,
    month: item.month.slice(5) + '月',
  }));

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'unpaid':
        return 'warning';
      case 'overdue':
        return 'danger';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="累计已支付"
          value={formatCurrency(totalPaid)}
          icon={CheckCircle2}
          gradient="from-accent-green/20 to-accent-cyan/20"
          trend={{ value: 8.5, isPositive: false }}
          delay={0}
        />
        <StatCard
          title="待支付金额"
          value={formatCurrency(totalUnpaid)}
          icon={AlertCircle}
          gradient="from-accent-orange/20 to-accent-red/20"
          trend={{ value: 12, isPositive: true }}
          delay={0.1}
        />
        <StatCard
          title="本月账单"
          value={currentMonthBill ? formatCurrency(currentMonthBill.totalAmount) : '¥0.00'}
          icon={CreditCard}
          gradient="from-accent-cyan/20 to-accent-purple/20"
          delay={0.2}
        />
        <StatCard
          title="涉及部门"
          value={departmentCount}
          icon={Building2}
          gradient="from-accent-purple/20 to-primary-500/20"
          delay={0.3}
        />
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">费用趋势</h3>
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <TrendingUp className="w-4 h-4" />
                <span>近12个月</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => value / 1000 + 'k'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '金额']}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#06B6D4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">部门成本分布</h3>
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <PieChart className="w-4 h-4" />
                <span>本月</span>
              </div>
            </div>
            <div className="h-72">
              {currentMonthBill && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={currentMonthBill.departmentSummary}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="department"
                      label={({ department, percentage }) => `${department} ${percentage}%`}
                      labelLine={false}
                    >
                      {currentMonthBill.departmentSummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '金额']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="搜索账期（如 2026-06）..."
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
                className="input-field w-40 py-2"
              >
                <option value="all">全部状态</option>
                <option value="paid">已支付</option>
                <option value="unpaid">待支付</option>
                <option value="overdue">已逾期</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-700/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">账期</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">账单金额</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">出账日期</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">支付截止</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-dark-300">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredBills.map((bill, index) => (
                  <motion.tr
                    key={bill.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-dark-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-accent-cyan" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{bill.period}</p>
                          <p className="text-xs text-dark-400">共 {bill.items.length} 项</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-semibold font-display text-white">
                        {formatCurrency(bill.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={bill.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-dark-300">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(bill.issueDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${bill.status === 'unpaid' ? 'text-accent-orange' : 'text-dark-400'}`} />
                        <span className={bill.status === 'unpaid' ? 'text-accent-orange' : 'text-dark-300'}>
                          {formatDate(bill.dueDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowDetailModal(true);
                          }}
                          className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                          title="查看明细"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                          title="下载账单"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {bill.status === 'unpaid' && (
                          <button className="btn-primary text-sm py-1.5 px-3">去支付</button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'department' && (
        <div className="space-y-4">
          {currentMonthBill && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{currentMonthBill.period} 部门成本汇总</h3>
                <span className="text-dark-400">总计：{formatCurrency(currentMonthBill.totalAmount)}</span>
              </div>
              <div className="grid gap-4">
                {currentMonthBill.departmentSummary.map((dept, index) => (
                  <motion.div
                    key={dept.department}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="card p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}20` }}
                        >
                          <Building2
                            className="w-6 h-6"
                            style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{dept.department}</h4>
                          <p className="text-sm text-dark-400">占比 {dept.percentage}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold font-display text-white">
                          {formatCurrency(dept.amount)}
                        </p>
                        <p className="text-sm text-dark-400">
                          {currentMonthBill.items.filter((i) => i.department === dept.department).length} 项订阅
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dept.percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-dark-700">
                      <p className="text-sm text-dark-400 mb-2">明细项目：</p>
                      <div className="space-y-2">
                        {currentMonthBill.items
                          .filter((i) => i.department === dept.department)
                          .map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-dark-300">{item.productName}</span>
                              <span className="text-white">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        isOpen={showDetailModal && !!selectedBill}
        onClose={() => setShowDetailModal(false)}
        title="账单明细"
        size="xl"
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30">
              <div>
                <p className="text-sm text-dark-400">账期</p>
                <p className="text-lg font-semibold text-white">{selectedBill.period}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-dark-400">账单金额</p>
                <p className="text-2xl font-bold font-display text-accent-cyan">
                  {formatCurrency(selectedBill.totalAmount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-1">出账日期</p>
                <p className="text-white font-medium">{formatDate(selectedBill.issueDate)}</p>
              </div>
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-1">支付截止</p>
                <p className="text-white font-medium">{formatDate(selectedBill.dueDate)}</p>
              </div>
              <div className="p-4 rounded-xl bg-dark-700/30">
                <p className="text-sm text-dark-400 mb-1">支付状态</p>
                <Badge status={selectedBill.status} />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">消费明细</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-700/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">产品名称</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">部门</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-dark-300">数量</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-dark-300">单价</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-dark-300">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {selectedBill.items.map((item) => (
                      <tr key={item.id} className="hover:bg-dark-700/30">
                        <td className="px-4 py-3 text-white">{item.productName}</td>
                        <td className="px-4 py-3 text-dark-300">{item.department}</td>
                        <td className="px-4 py-3 text-right text-dark-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-dark-300">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-medium text-white">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-dark-700/50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-medium text-white">
                        合计
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-accent-cyan">
                        {formatCurrency(selectedBill.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">
                关闭
              </button>
              <button className="btn-primary flex items-center gap-2">
                <Download className="w-4 h-4" />
                下载账单
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
