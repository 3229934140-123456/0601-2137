import { useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useStore, defaultRolePermissions } from '../../store/useStore';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/date';
import { getRoleText } from '../../utils/format';
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

const allModules = Object.keys(moduleLabels);

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

const moduleAvailableActions: Record<string, string[]> = {
  subscription: ['view', 'create', 'update', 'delete'],
  delivery: ['view', 'download'],
  quota: ['view', 'expand'],
  quality: ['view', 'create', 'update'],
  billing: ['view', 'export', 'pay'],
  members: ['view', 'create', 'update', 'delete'],
  approval: ['view', 'approve', 'reject'],
};

export const MembersPage = () => {
  const {
    members,
    user,
    updateMember,
    rolePermissionsMap,
    updateRolePermissions,
  } = useStore();

  const [activeTab, setActiveTab] = useState('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'user' as Member['role'],
    status: 'active' as Member['status'],
  });

  const [matrixPage, setMatrixPage] = useState(0);
  const MATRIX_PAGE_SIZE = 6;

  const [showRoleEditModal, setShowRoleEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<string>('');
  const [editingRolePerms, setEditingRolePerms] = useState<Record<string, string[]>>({});

  const activeCount = members.filter((m) => m.status === 'active').length;
  const adminCount = members.filter(
    (m) => m.role === 'super_admin' || m.role === 'admin'
  ).length;
  const departmentCount = new Set(members.map((m) => m.department)).size;

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const roles = useMemo(
    () => [
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
    ],
    [members]
  );

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

  const permListToMap = (perms: Permission[]): Record<string, string[]> => {
    const map: Record<string, string[]> = {};
    perms.forEach((p) => {
      map[p.module] = [...p.actions];
    });
    return map;
  };

  const permMapToList = (map: Record<string, string[]>): Permission[] => {
    return Object.entries(map)
      .filter(([, acts]) => acts.length > 0)
      .map(([module, actions]) => ({ module, actions }));
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      department: member.department,
      role: member.role,
      status: member.status,
    });
    setShowEditModal(true);
  };

  const handleSaveMember = () => {
    if (!selectedMember) return;
    const newPermissions =
      rolePermissionsMap[editForm.role] || selectedMember.permissions;
    updateMember({
      ...selectedMember,
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      department: editForm.department,
      role: editForm.role,
      status: editForm.status,
      permissions: JSON.parse(JSON.stringify(newPermissions)),
    });
    setShowEditModal(false);
    alert('成员信息已更新！');
  };

  const openRoleEditModal = (roleKey: string) => {
    setEditingRole(roleKey);
    const perms = rolePermissionsMap[roleKey] || defaultRolePermissions[roleKey] || [];
    setEditingRolePerms(permListToMap(perms));
    setShowRoleEditModal(true);
  };

  const toggleRoleAction = (module: string, action: string) => {
    setEditingRolePerms((prev) => {
      const current = prev[module] || [];
      const hasIt = current.includes(action);
      const updated = hasIt
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [module]: updated };
    });
  };

  const handleSaveRole = () => {
    if (!editingRole) return;
    const list = permMapToList(editingRolePerms);
    updateRolePermissions(editingRole, list);
    setShowRoleEditModal(false);
    setEditingRole('');
    alert('角色权限已更新，已同步到对应成员！');
  };

  const matrixMembers = useMemo(() => {
    const start = matrixPage * MATRIX_PAGE_SIZE;
    return members.slice(start, start + MATRIX_PAGE_SIZE);
  }, [members, matrixPage]);

  const totalMatrixPages = Math.max(1, Math.ceil(members.length / MATRIX_PAGE_SIZE));

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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
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
              <div className="flex items-center gap-2 flex-wrap">
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
                      <span
                        className={clsx(
                          'inline-block px-2 py-0.5 text-xs rounded-full',
                          getRoleColor(member.role)
                        )}
                      >
                        {getRoleText(member.role)}
                      </span>
                    </div>
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
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {member.permissions.slice(0, 4).map((p) => (
                      <span
                        key={p.module}
                        className="px-2 py-0.5 text-xs rounded bg-dark-700/50 text-dark-300"
                      >
                        {moduleLabels[p.module] || p.module}
                      </span>
                    ))}
                    {member.permissions.length > 4 && (
                      <span className="px-2 py-0.5 text-xs rounded bg-dark-700/50 text-dark-400">
                        +{member.permissions.length - 4}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const m = members.find((x) => x.id === member.id);
                        setSelectedMember(m || member);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 btn-secondary text-sm py-2"
                    >
                      查看权限
                    </button>
                    <button
                      onClick={() => {
                        const m = members.find((x) => x.id === member.id);
                        if (m) openEditModal(m);
                      }}
                      className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                      title="编辑成员"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg text-dark-400 hover:text-accent-red hover:bg-accent-red/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredMembers.length === 0 && (
              <div className="col-span-3 card p-12 text-center text-dark-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>暂无匹配的成员</p>
              </div>
            )}
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
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center`}
                  >
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {role.name}
                    </h3>
                    <p className="text-sm text-dark-400 mb-2">{role.description}</p>
                    <span className="px-3 py-1 text-sm rounded-full bg-dark-700 text-dark-300">
                      {role.count} 人
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {Object.entries(moduleLabels).map(([key, label]) => {
                  const rp = rolePermissionsMap[role.key] || [];
                  const perm = rp.find((p) => p.module === key);
                  const actions = moduleAvailableActions[key] || [];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
                    >
                      <span className="text-dark-300 text-sm">{label}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {actions.map((act) =>
                          perm?.actions.includes(act) ? (
                            <span
                              key={act}
                              className="px-1.5 py-0.5 text-xs rounded bg-accent-green/10 text-accent-green"
                            >
                              {actionLabels[act] || act}
                            </span>
                          ) : null
                        )}
                        {!perm?.actions.length && (
                          <span className="text-xs text-dark-500">无</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => openRoleEditModal(role.key)}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                编辑角色权限
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent-cyan" />
                权限矩阵（全部成员）
              </h3>
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <span>
                  共 {members.length} 位成员，第 {matrixPage + 1}/
                  {totalMatrixPages} 页
                </span>
                <button
                  onClick={() => setMatrixPage((p) => Math.max(0, p - 1))}
                  disabled={matrixPage === 0}
                  className="p-1.5 rounded-lg hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setMatrixPage((p) => Math.min(totalMatrixPages - 1, p + 1))
                  }
                  disabled={matrixPage >= totalMatrixPages - 1}
                  className="p-1.5 rounded-lg hover:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-700/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-dark-300 sticky left-0 bg-dark-800 z-10 min-w-[140px]">
                      功能模块
                    </th>
                    {matrixMembers.map((member) => (
                      <th
                        key={member.id}
                        className="text-center px-4 py-4 text-sm font-medium text-dark-300 min-w-[130px]"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-lg"
                          />
                          <span className="text-white">{member.name}</span>
                          <span
                            className={clsx(
                              'text-xs px-2 py-0.5 rounded-full',
                              getRoleColor(member.role)
                            )}
                          >
                            {getRoleText(member.role)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {Object.entries(moduleLabels).map(([moduleKey, moduleLabel]) => (
                    <tr key={moduleKey} className="hover:bg-dark-700/30">
                      <td className="px-6 py-4 font-medium text-white sticky left-0 bg-dark-800">
                        {moduleLabel}
                      </td>
                      {matrixMembers.map((member) => {
                        const perm = member.permissions.find(
                          (p) => p.module === moduleKey
                        );
                        return (
                          <td key={member.id} className="px-4 py-4">
                            <div className="flex flex-wrap justify-center gap-1">
                              {perm?.actions.map((action) => (
                                <span
                                  key={action}
                                  className="px-2 py-1 text-xs rounded bg-accent-cyan/10 text-accent-cyan"
                                  title={`${moduleLabel} - ${
                                    actionLabels[action] || action
                                  }`}
                                >
                                  {actionLabels[action] || action}
                                </span>
                              ))}
                              {!perm?.actions.length && (
                                <span className="text-dark-500 text-xs flex items-center gap-1">
                                  <X className="w-3 h-3" />
                                  无权限
                                </span>
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
                  <h3 className="text-lg font-semibold text-white">
                    {selectedMember.name}
                  </h3>
                  <span
                    className={clsx(
                      'px-2 py-0.5 text-xs rounded-full',
                      getRoleColor(selectedMember.role)
                    )}
                  >
                    {getRoleText(selectedMember.role)}
                  </span>
                  <Badge status={selectedMember.status} />
                </div>
                <p className="text-sm text-dark-400">
                  {selectedMember.department} · {selectedMember.email}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">权限配置</h4>
              <div className="space-y-3">
                {Object.entries(moduleLabels).map(([key, label]) => {
                  const perm = selectedMember.permissions.find(
                    (p) => p.module === key
                  );
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg bg-dark-700/30"
                    >
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
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  const m = members.find((x) => x.id === selectedMember.id);
                  if (m) openEditModal(m);
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
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  部门
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm({ ...editForm, department: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  手机号
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  角色
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value as Member['role'],
                    })
                  }
                  className="input-field"
                >
                  <option value="super_admin">超级管理员</option>
                  <option value="admin">管理员</option>
                  <option value="user">普通成员</option>
                  <option value="finance">财务人员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  状态
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value as Member['status'],
                    })
                  }
                  className="input-field"
                >
                  <option value="active">正常</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-dark-700/30">
              <div className="flex items-center gap-2 text-sm text-dark-300 mb-3">
                <AlertCircle className="w-4 h-4 text-accent-cyan" />
                新角色的权限模板将自动应用
              </div>
              <div className="space-y-2">
                {Object.entries(moduleLabels).map(([key, label]) => {
                  const rp = rolePermissionsMap[editForm.role] || [];
                  const perm = rp.find((p) => p.module === key);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between py-1.5 text-xs"
                    >
                      <span className="text-dark-400">{label}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {perm?.actions.map((act) => (
                          <span
                            key={act}
                            className="px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green"
                          >
                            {actionLabels[act] || act}
                          </span>
                        ))}
                        {!perm?.actions.length && (
                          <span className="text-dark-500">无</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleSaveMember}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRoleEditModal}
        onClose={() => {
          setShowRoleEditModal(false);
          setEditingRole('');
        }}
        title={`编辑角色权限 - ${
          roles.find((r) => r.key === editingRole)?.name || ''
        }`}
        size="xl"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
              <div className="text-sm text-dark-200">
                修改角色权限后，将自动应用到所有拥有该角色的成员。
                当前角色共{' '}
                <span className="text-accent-cyan font-medium">
                  {roles.find((r) => r.key === editingRole)?.count || 0}
                </span>{' '}
                位成员。
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(moduleLabels).map(([modKey, modLabel]) => {
              const actions = moduleAvailableActions[modKey] || ['view'];
              const selected = editingRolePerms[modKey] || [];
              return (
                <div
                  key={modKey}
                  className="p-4 rounded-xl bg-dark-700/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-white">{modLabel}</span>
                    <span className="text-xs text-dark-400">
                      已选 {selected.length}/{actions.length} 项权限
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {actions.map((act) => {
                      const checked = selected.includes(act);
                      return (
                        <button
                          key={act}
                          onClick={() => toggleRoleAction(modKey, act)}
                          className={clsx(
                            'px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all',
                            checked
                              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                              : 'bg-dark-700 text-dark-300 border border-dark-600 hover:border-dark-500'
                          )}
                        >
                          {checked ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5 opacity-30" />
                          )}
                          {actionLabels[act] || act}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <button
              onClick={() => {
                setShowRoleEditModal(false);
                setEditingRole('');
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={() => {
                const defaults =
                  defaultRolePermissions[editingRole] || [];
                setEditingRolePerms(permListToMap(defaults));
              }}
              className="px-4 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors text-sm"
            >
              恢复默认
            </button>
            <button
              onClick={handleSaveRole}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存并应用
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
