import { useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Settings,
  Shield,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/date';
import { getRoleText, getStatusText } from '../../utils/format';
import type { Member, Permission } from '../../data/types';

const moduleLabels: Record<string, string> = {
  subscription: '产品订阅',
  delivery: '交付日历',
  quota: '调用额度',
  quality: '质量反馈',
  billing: '费用账单',
  members: '权限成员',
  approval: '续订审批',
};

const actionLabels: Record<string, string> = {
  view: '查看',
  create: '创建',
  update: '编辑',
  delete: '删除',
  download: '下载',
  expand: '扩容',
  export: '导出',
  approve: '审批',
  reject: '拒绝',
  pay: '支付',
};

export const MembersPage = () => {
  const { members, user } = useStore();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const activeCount = members.filter((m) => m.status === 'active').length;
  const adminCount = members.filter((m) => m.role === 'super_admin' || m.role === 'admin').length;
  const departmentCount = new Set(members.map((m) => m.department)).size;

  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const tabs = [
    { key: 'list', label: '成员列表' },
    { key: 'roles', label: '角色管理' },
    { key: 'permissions', label: '权限矩阵' },
  ];

  const roles = [
    {
      key: 'super_admin',
      name: '超级管理员',
      description: '拥有系统所有功能的完整权限',
      count: members.filter((m) => m.role === 'super_admin').length,
      color: 'from-accent-red to-accent-orange',
    },
    {
      key: 'admin',
      name: '管理员',
      description: '可以管理订阅、提交反馈、申请扩容等',
      count: members.filter((m) => m.role === 'admin').length,
      color: 'from-accent-purple to-accent-cyan',
    },
    {
      key: 'user',
      name: '普通成员',
      description: '可以查看数据、下载交付、提交反馈',
      count: members.filter((m) => m.role === 'user').length,
      color: 'from-accent-cyan to-accent-green',
    },
    {
      key: 'finance',
      name: '财务人员',
      description: '可以查看账单、导出数据、审批费用',
      count: members.filter((m) => m.role === 'finance').length,
      color: 'from-accent-orange to-accent-purple',
    },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'text-accent-red bg-accent-red/10';
      case 'admin':
        return 'text-accent-purple bg-accent-purple/10';
      case 'user':
        return 'text-accent-cyan bg-accent-cyan/10';
      case 'finance':
        return 'text-accent-orange bg-accent-orange/10';
      default:
        return 'text-dark-400 bg-dark-700';
    }
  };

  const hasPermission = (permissions: Permission[], module: string, action: string) => {
    const perm = permissions.find((p) => p.module === module);
    return perm?.actions.includes(action) || false;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="团队成员"
          value={members.length}
          icon={Users}
          gradient="from-accent-cyan/20 to-accent-purple/20"
          trend={{ value: 2, isPositive: true }}
          delay={0}
        />
        <StatCard
          title="活跃用户"
          value={activeCount}
          icon={Check}
          gradient="from-accent-green/20 to-accent-cyan/20"
          delay={0.1}
        />
        <StatCard
          title="管理人员"
          value={adminCount}
          icon={Shield}
          gradient="from-accent-purple/20 to-accent-red/20"
          delay={0.2}
        />
        <StatCard
          title="涉及部门"
          value={departmentCount}
          icon={Building2}
          gradient="from-accent-orange/20 to-accent-purple/20"
          delay={0.3}
        />
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  placeholder="搜索成员姓名、邮箱、部门..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 input-field"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-dark-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input-field w-36 py-2"
                >
                  <option value="all">全部角色</option>
                  <option value="super_admin">超级管理员</option>
                  <option value="admin">管理员</option>
                  <option value="user">普通成员</option>
                  <option value="finance">财务人员</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field w-32 py-2"
                >
                  <option value="all">全部状态</option>
                  <option value="active">正常</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              添加成员
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="card card-hover p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-14 h-14 rounded-xl"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{member.name}</h3>
                        {member.status === 'active' ? (
                          <span className="w-2 h-2 rounded-full bg-accent-green" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-dark-500" />
                        )}
                      </div>
                      <span className={clsx('inline-block px-2 py-0.5 text-xs rounded-full', getRoleColor(member.role))}>
                        {getRoleText(member.role)}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-dark-400" />
                    <span className="text-dark-300 truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-dark-400" />
                    <span className="text-dark-300">{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="w-4 h-4 text-dark-400" />
                    <span className="text-dark-300">{member.department}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-dark-400" />
                    <span className="text-dark-300">加入 {formatDate(member.joinDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-700">
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    查看权限
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setShowEditModal(true);
                    }}
                    className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-dark-400 hover:text-accent-red hover:bg-accent-red/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-2 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="card card-hover p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center`}>
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 text-sm rounded-full bg-dark-700 text-dark-300">
                  {role.count} 人
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{role.name}</h3>
              <p className="text-sm text-dark-400 mb-6">{role.description}</p>

              <div className="space-y-3">
                {Object.entries(moduleLabels).map(([key, label]) => {
                  const sampleMember = members.find((m) => m.role === role.key);
                  const canView = sampleMember ? hasPermission(sampleMember.permissions, key, 'view') : false;
                  const canEdit = sampleMember ? hasPermission(sampleMember.permissions, key, 'update') : false;
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                      <span className="text-dark-300">{label}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {canView ? (
                            <Check className="w-4 h-4 text-accent-green" />
                          ) : (
                            <X className="w-4 h-4 text-dark-600" />
                          )}
                          <span className="text-xs text-dark-400">查看</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {canEdit ? (
                            <Check className="w-4 h-4 text-accent-green" />
                          ) : (
                            <X className="w-4 h-4 text-dark-600" />
                          )}
                          <span className="text-xs text-dark-400">编辑</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="w-full mt-6 btn-secondary">
                编辑角色权限
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-dark-300 sticky left-0 bg-dark-800">
                    功能模块
                  </th>
                  {members.slice(0, 5).map((member) => (
                    <th key={member.id} className="text-center px-4 py-4 text-sm font-medium text-dark-300 min-w-[120px]">
                      <div className="flex flex-col items-center gap-2">
                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-lg" />
                        <span className="text-white">{member.name}</span>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full', getRoleColor(member.role))}>
                          {getRoleText(member.role)}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {Object.entries(moduleLabels).map(([moduleKey, moduleLabel], moduleIndex) => (
                  <tr key={moduleKey} className="hover:bg-dark-700/30">
                    <td className="px-6 py-4 font-medium text-white sticky left-0 bg-dark-800">
                      {moduleLabel}
                    </td>
                    {members.slice(0, 5).map((member) => {
                      const perm = member.permissions.find((p) => p.module === moduleKey);
                      return (
                        <td key={member.id} className="px-4 py-4">
                          <div className="flex flex-wrap justify-center gap-1">
                            {perm?.actions.map((action) => (
                              <span
                                key={action}
                                className="px-2 py-1 text-xs rounded bg-accent-cyan/10 text-accent-cyan"
                              >
                                {actionLabels[action] || action}
                              </span>
                            ))}
                            {!perm?.actions.length && (
                              <span className="text-dark-500 text-xs">无权限</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDetailModal && !!selectedMember}
        onClose={() => setShowDetailModal(false)}
        title="成员权限详情"
        size="lg"
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-dark-700/30">
              <img
                src={selectedMember.avatar}
                alt={selectedMember.name}
                className="w-16 h-16 rounded-xl"
              />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-white">{selectedMember.name}</h3>
                  <span className={clsx('px-2 py-0.5 text-xs rounded-full', getRoleColor(selectedMember.role))}>
                    {getRoleText(selectedMember.role)}
                  </span>
                  <Badge status={selectedMember.status} />
                </div>
                <p className="text-sm text-dark-400">{selectedMember.department} · {selectedMember.email}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">权限配置</h4>
              <div className="space-y-3">
                {Object.entries(moduleLabels).map(([key, label]) => {
                  const perm = selectedMember.permissions.find((p) => p.module === key);
                  return (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-dark-700/30">
                      <span className="text-dark-200">{label}</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {perm?.actions.map((action) => (
                          <span
                            key={action}
                            className="px-2 py-1 text-xs rounded bg-accent-cyan/10 text-accent-cyan"
                          >
                            {actionLabels[action] || action}
                          </span>
                        ))}
                        {!perm?.actions.length && (
                          <span className="text-dark-500 text-xs">无权限</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">
                关闭
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowEditModal(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                编辑权限
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showEditModal && !!selectedMember}
        onClose={() => setShowEditModal(false)}
        title="编辑成员信息"
        size="lg"
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">姓名</label>
                <input
                  type="text"
                  defaultValue={selectedMember.name}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">部门</label>
                <input
                  type="text"
                  defaultValue={selectedMember.department}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">邮箱</label>
                <input
                  type="email"
                  defaultValue={selectedMember.email}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">手机号</label>
                <input
                  type="tel"
                  defaultValue={selectedMember.phone}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">角色</label>
                <select defaultValue={selectedMember.role} className="input-field">
                  <option value="super_admin">超级管理员</option>
                  <option value="admin">管理员</option>
                  <option value="user">普通成员</option>
                  <option value="finance">财务人员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">状态</label>
                <select defaultValue={selectedMember.status} className="input-field">
                  <option value="active">正常</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  alert('保存成功！');
                }}
                className="btn-primary"
              >
                保存修改
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
