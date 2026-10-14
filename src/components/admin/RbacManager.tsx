import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  Trash2,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  FileText,
  Search,
  Lock,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface RolePermission {
  id?: number;
  moduleName: string;
  allowedActions: string[];
  requiresHumanApproval?: boolean;
}

interface RoleItem {
  id: number;
  roleKey: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
  requiresTwoFactor: boolean;
  idleTimeoutMinutes: number;
  memberCount: number;
  permissions: RolePermission[];
}

interface PlatformUser {
  id: number;
  uid: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  roleDisplayName: string;
  status: string;
  twoFactorVerified: boolean;
  lastLoginAt: string;
}

const AVAILABLE_MODULES = [
  { key: 'products', label: 'Catalog & Products', actions: ['read', 'create', 'update', 'delete', 'publish'] },
  { key: 'orders', label: 'Orders & Fulfillment', actions: ['read', 'update_status', 'cancel', 'export'] },
  { key: 'wallets', label: 'Merchant Wallets', actions: ['read', 'hold_funds', 'release_hold'] },
  { key: 'payouts', label: 'Settlements & Payouts', actions: ['read', 'execute_payout', 'update_bank'] },
  { key: 'gateways', label: 'Payment Rails & Gateways', actions: ['read', 'update_keys', 'test_connection'] },
  { key: 'returns', label: 'Disputes & Return Desk', actions: ['read', 'approve', 'reject'] },
  { key: 'support', label: 'Support & Help Desk', actions: ['read', 'reply', 'internal_note', 'assign'] },
  { key: 'rbac', label: 'Roles & Governance', actions: ['read', 'create_role', 'update_role', 'delete_role', 'assign_role'] },
  { key: 'seo', label: 'SEO Control Panel', actions: ['read', 'update_seo', 'audit'] },
  { key: 'ads', label: 'Advertising & Campaigns', actions: ['read', 'create_campaign', 'update_campaign', 'pause_campaign', 'delete_campaign'] },
  { key: 'analytics', label: 'Commercial Analytics', actions: ['read', 'export'] },
  { key: 'agent', label: 'Co-Worker Operations Agent', actions: ['read', 'trigger_task', 'approve_action', 'kill_switch'] },
  { key: 'audit_logs', label: 'Immutable Audit Logs', actions: ['read', 'export'] },
];

export default function RbacManager() {
  const { authFetch } = useAuth();
  const [subTab, setSubTab] = useState<'roles' | 'assignments' | 'simulator' | 'audit'>('roles');
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State for Create/Edit Role
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoleKey, setSelectedRoleKey] = useState('');
  const [roleKeyInput, setRoleKeyInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [twoFactorInput, setTwoFactorInput] = useState(false);
  const [idleTimeoutInput, setIdleTimeoutInput] = useState(30);
  const [matrixState, setMatrixState] = useState<Record<string, string[]>>({});

  // User Assignment State
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserRole, setSelectedUserRole] = useState<Record<string, string>>({});

  // Simulator State
  const [simUserUid, setSimUserUid] = useState('seller-velora-uid');
  const [simModule, setSimModule] = useState('rbac');
  const [simAction, setSimAction] = useState('create_role');
  const [simTesting, setSimTesting] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes, auditRes] = await Promise.all([
        authFetch('/api/admin/roles'),
        authFetch('/api/admin/users'),
        authFetch('/api/admin/rbac/audit'),
      ]);
      const rolesData = await rolesRes.json();
      const usersData = await usersRes.json();
      const auditData = await auditRes.json();

      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setAuditLogs(Array.isArray(auditData) ? auditData : []);

      // Initialize selectedUserRole map
      const initialMap: Record<string, string> = {};
      if (Array.isArray(usersData)) {
        usersData.forEach((u: PlatformUser) => {
          initialMap[u.uid] = u.role;
        });
      }
      setSelectedUserRole(initialMap);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load roles and permissions data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedRoleKey('');
    setRoleKeyInput('');
    setDisplayNameInput('');
    setDescriptionInput('');
    setTwoFactorInput(false);
    setIdleTimeoutInput(30);

    const initialMatrix: Record<string, string[]> = {};
    AVAILABLE_MODULES.forEach((m) => {
      initialMatrix[m.key] = ['read'];
    });
    setMatrixState(initialMatrix);
    setModalOpen(true);
  };

  const openEditModal = (role: RoleItem) => {
    setIsEditing(true);
    setSelectedRoleKey(role.roleKey);
    setRoleKeyInput(role.roleKey);
    setDisplayNameInput(role.displayName);
    setDescriptionInput(role.description);
    setTwoFactorInput(role.requiresTwoFactor);
    setIdleTimeoutInput(role.idleTimeoutMinutes);

    const initialMatrix: Record<string, string[]> = {};
    AVAILABLE_MODULES.forEach((m) => {
      const perm = role.permissions.find((p) => p.moduleName === m.key);
      initialMatrix[m.key] = perm ? [...perm.allowedActions] : [];
    });
    setMatrixState(initialMatrix);
    setModalOpen(true);
  };

  const handleToggleAction = (moduleKey: string, action: string) => {
    setMatrixState((prev) => {
      const current = prev[moduleKey] || [];
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [moduleKey]: next };
    });
  };

  const handleSelectAllForModule = (moduleKey: string, allActions: string[]) => {
    setMatrixState((prev) => {
      const current = prev[moduleKey] || [];
      const next = current.length === allActions.length ? [] : [...allActions];
      return { ...prev, [moduleKey]: next };
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg('');
    setErrorMsg('');

    const formattedPermissions = Object.entries(matrixState)
      .filter(([_, actions]) => actions.length > 0)
      .map(([moduleName, allowedActions]) => ({
        moduleName,
        allowedActions,
      }));

    try {
      if (isEditing) {
        const res = await authFetch(`/api/admin/roles/${selectedRoleKey}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: displayNameInput,
            description: descriptionInput,
            requiresTwoFactor: twoFactorInput,
            idleTimeoutMinutes: Number(idleTimeoutInput),
            permissions: formattedPermissions,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update role.');
        setActionMsg(`Role "${selectedRoleKey}" updated successfully.`);
      } else {
        const res = await authFetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleKey: roleKeyInput,
            displayName: displayNameInput,
            description: descriptionInput,
            requiresTwoFactor: twoFactorInput,
            idleTimeoutMinutes: Number(idleTimeoutInput),
            permissions: formattedPermissions,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create role.');
        setActionMsg(`Custom role "${roleKeyInput}" created with persistent permission matrix.`);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Role operation failed.');
    }
  };

  const handleToggleRoleStatus = async (roleKey: string) => {
    setActionMsg('');
    setErrorMsg('');
    try {
      const res = await authFetch(`/api/admin/roles/${roleKey}/toggle-status`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status.');
      setActionMsg(`Role "${roleKey}" status set to ${data.isActive ? 'Active' : 'Deactivated'}.`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Status toggle failed.');
    }
  };

  const handleDeleteRole = async (roleKey: string) => {
    if (!confirm(`Are you sure you want to delete role "${roleKey}"? This action cannot be undone.`)) return;
    setActionMsg('');
    setErrorMsg('');
    try {
      const res = await authFetch(`/api/admin/roles/${roleKey}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete role.');
      setActionMsg(`Role "${roleKey}" deleted from database and audit log recorded.`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Role deletion failed.');
    }
  };

  const handleAssignRoleToUser = async (userUid: string) => {
    const targetRole = selectedUserRole[userUid];
    if (!targetRole) return;
    setActionMsg('');
    setErrorMsg('');

    try {
      const res = await authFetch(`/api/admin/users/${userUid}/assign-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleKey: targetRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Role assignment failed.');
      setActionMsg(`User ${data.uid} successfully reassigned to role "${data.newRole}". Audit entry recorded.`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'User role assignment failed.');
    }
  };

  const handleTestSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimTesting(true);
    setSimResult(null);
    try {
      const res = await authFetch('/api/admin/rbac/test-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: simModule,
          action: simAction,
        }),
      });
      const data = await res.json();
      setSimResult({
        status: res.status,
        data,
      });
    } catch (err: any) {
      setSimResult({
        status: 500,
        data: { error: err.message || 'Simulator request failed.' },
      });
    } finally {
      setSimTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-navigation */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#2563EB]" />
              <h2 className="font-display text-lg font-bold text-[#111827]">
                Roles & Permissions (RBAC) Governance Center
              </h2>
            </div>
            <p className="text-xs text-[#6B7280]">
              Configure granular module-by-action permission matrices, manage user assignments, test authorization rules, and review immutable audit histories.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-[8px] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E5E7EB] text-xs">
          <button
            type="button"
            onClick={() => setSubTab('roles')}
            className={`px-3 py-1.5 rounded-[6px] font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'roles'
                ? 'bg-[#111827] text-white'
                : 'bg-[#F8FAFC] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Roles & Matrix ({roles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('assignments')}
            className={`px-3 py-1.5 rounded-[6px] font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'assignments'
                ? 'bg-[#111827] text-white'
                : 'bg-[#F8FAFC] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>User Assignments ({users.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('simulator')}
            className={`px-3 py-1.5 rounded-[6px] font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'simulator'
                ? 'bg-[#111827] text-white'
                : 'bg-[#F8FAFC] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Server Permission Simulator</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 rounded-[6px] font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'audit'
                ? 'bg-[#111827] text-white'
                : 'bg-[#F8FAFC] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>RBAC Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[8px] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-[8px] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUBTAB 1: ROLES & PERMISSION MATRIX                                  */}
      {/* =================================================================== */}
      {subTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase px-2 py-0.5 bg-blue-50 text-[#2563EB] border border-blue-200 rounded font-bold">
                      {r.roleKey}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {r.isSystemRole && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-[#4B5563] border border-gray-200 rounded">
                          SYSTEM PROTECTED
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          r.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {r.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-sm text-[#111827]">{r.displayName}</h3>
                    <p className="text-xs text-[#6B7280] line-clamp-2 mt-0.5">{r.description}</p>
                  </div>

                  <div className="pt-2 border-t border-[#F1F5F9] grid grid-cols-2 gap-2 text-[11px] text-[#4B5563]">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span>{r.memberCount} active member{r.memberCount === 1 ? '' : 's'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span>{r.idleTimeoutMinutes}m idle timeout</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span>2FA: {r.requiresTwoFactor ? 'Mandatory TOTP' : 'Optional'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(r)}
                    className="flex-1 py-1.5 px-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#111827] border border-[#E5E7EB] font-semibold rounded-[6px] text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Permissions</span>
                  </button>

                  {!r.isSystemRole && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleRoleStatus(r.roleKey)}
                        title={r.isActive ? 'Deactivate Role' : 'Activate Role'}
                        className={`p-1.5 border rounded-[6px] transition-colors ${
                          r.isActive
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRole(r.roleKey)}
                        disabled={r.memberCount > 0}
                        title={r.memberCount > 0 ? 'Cannot delete role with assigned members' : 'Delete Role'}
                        className={`p-1.5 border rounded-[6px] transition-colors ${
                          r.memberCount > 0
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUBTAB 2: USER ROLE ASSIGNMENTS                                      */}
      {/* =================================================================== */}
      {subTab === 'assignments' && (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-sm text-[#111827]">
                User-to-Role Assignment & Access Control
              </h3>
              <p className="text-xs text-[#6B7280]">
                Assign, upgrade, or reassign operational roles for platform members. Last administrator cannot be demoted.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by email / name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-[#E5E7EB] rounded-[8px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#4B5563]">
                  <th className="py-2.5 px-3 font-semibold">User</th>
                  <th className="py-2.5 px-3 font-semibold">Current Role</th>
                  <th className="py-2.5 px-3 font-semibold">Status / 2FA</th>
                  <th className="py-2.5 px-3 font-semibold">Reassign Role</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {users
                  .filter((u) =>
                    userSearch
                      ? u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.username.toLowerCase().includes(userSearch.toLowerCase())
                      : true
                  )
                  .map((u) => {
                    const isSelectedDifferent = selectedUserRole[u.uid] !== u.role;
                    return (
                      <tr key={u.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#111827]">{u.fullName}</div>
                          <div className="text-[11px] text-[#6B7280] font-mono">{u.email}</div>
                          <div className="text-[10px] text-[#9CA3AF] font-mono">UID: {u.uid}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 bg-blue-50 text-[#2563EB] border border-blue-200 rounded">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            <span className="capitalize">{u.status}</span>
                            {u.twoFactorVerified && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                2FA ✓
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={selectedUserRole[u.uid] || u.role}
                            onChange={(e) =>
                              setSelectedUserRole((prev) => ({
                                ...prev,
                                [u.uid]: e.target.value,
                              }))
                            }
                            className="px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs font-semibold"
                          >
                            {roles.map((r) => (
                              <option key={r.roleKey} value={r.roleKey} disabled={!r.isActive}>
                                {r.displayName} ({r.roleKey}) {!r.isActive ? '[Deactivated]' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleAssignRoleToUser(u.uid)}
                            disabled={!isSelectedDifferent}
                            className={`px-3 py-1.5 rounded-[6px] font-semibold text-xs transition-colors ${
                              isSelectedDifferent
                                ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Assign Role
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUBTAB 3: PERMISSION SIMULATOR                                       */}
      {/* =================================================================== */}
      {subTab === 'simulator' && (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-5 text-xs">
          <div>
            <h3 className="font-display font-bold text-sm text-[#111827]">
              Live Server Authorization Simulator
            </h3>
            <p className="text-[#6B7280]">
              Execute direct server authorization checks through <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">/api/admin/rbac/test-permission</code> to verify fail-closed RBAC barrier behavior.
            </p>
          </div>

          <form onSubmit={handleTestSimulator} className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Target Persona</label>
                <select
                  value={simUserUid}
                  onChange={(e) => setSimUserUid(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-[6px]"
                >
                  <option value="seller-velora-uid">Ananya Verma (Role: seller)</option>
                  <option value="admin-console-root">Governance Root (Role: admin)</option>
                  <option value="agent-ops-copilot">Operations Co-Worker (Role: agent)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Target Module</label>
                <select
                  value={simModule}
                  onChange={(e) => setSimModule(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-[6px]"
                >
                  {AVAILABLE_MODULES.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({m.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Target Action</label>
                <select
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-[6px]"
                >
                  {AVAILABLE_MODULES.find((m) => m.key === simModule)?.actions.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={simTesting}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-[6px] flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{simTesting ? 'Executing Server Check...' : 'Test Server Authorization Check'}</span>
            </button>
          </form>

          {simResult && (
            <div
              className={`p-4 rounded-[8px] border text-xs space-y-2 ${
                simResult.status === 200
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {simResult.status === 200 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>200 OK — ACCESS AUTHORIZED</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>{simResult.status} FORBIDDEN — ACCESS REJECTED BY SERVER</span>
                  </>
                )}
              </div>
              <p>{simResult.data?.message || simResult.data?.error}</p>
              <pre className="p-2.5 bg-white/70 rounded font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(simResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SUBTAB 4: RBAC AUDIT TRAIL                                           */}
      {/* =================================================================== */}
      {subTab === 'audit' && (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4 text-xs">
          <div>
            <h3 className="font-display font-bold text-sm text-[#111827]">
              Immutable RBAC Audit Trail
            </h3>
            <p className="text-[#6B7280]">
              Every role creation, permission modification, deactivation, and user assignment is cryptographically recorded in the platform audit log.
            </p>
          </div>

          <div className="overflow-x-auto border border-[#E5E7EB] rounded-[8px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#4B5563]">
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Actor</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                  <th className="py-2.5 px-3 font-semibold">Target</th>
                  <th className="py-2.5 px-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold">{log.actorUid}</div>
                      <span className="font-mono text-[10px] text-[#2563EB] uppercase">{log.actorRole}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-gray-100 rounded font-semibold">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold">{log.targetRef}</td>
                    <td className="py-2.5 px-3 text-[#4B5563]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE / EDIT ROLE & PERMISSION MATRIX                        */}
      {/* =================================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[16px] max-w-3xl w-full p-6 space-y-5 my-8 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-display font-bold text-base text-[#111827]">
                  {isEditing ? `Edit Role: ${selectedRoleKey}` : 'Create Custom Role & Permission Matrix'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-5 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">
                    Role Key (Machine Identifier)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="e.g. inventory_specialist"
                    value={roleKeyInput}
                    onChange={(e) => setRoleKeyInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inventory & Stock Specialist"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#374151] mb-1">
                    Role Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe the scope of responsibility for this role..."
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#374151] mb-1">
                    Session Idle Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={idleTimeoutInput}
                    onChange={(e) => setIdleTimeoutInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactorInput}
                      onChange={(e) => setTwoFactorInput(e.target.checked)}
                      className="rounded text-[#2563EB]"
                    />
                    <span>Require Mandatory TOTP 2FA Verification</span>
                  </label>
                </div>
              </div>

              {/* Granular Permission Matrix */}
              <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-[#111827]">
                    Module Permission Matrix
                  </h4>
                  <span className="text-[11px] text-[#6B7280]">Check individual actions to grant granular privilege</span>
                </div>

                <div className="space-y-3 border border-[#E5E7EB] rounded-[8px] p-4 divide-y divide-[#F1F5F9]">
                  {AVAILABLE_MODULES.map((m) => {
                    const currentActions = matrixState[m.key] || [];
                    const allSelected = currentActions.length === m.actions.length;

                    return (
                      <div key={m.key} className="pt-3 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#111827]">{m.label}</span>
                          <button
                            type="button"
                            onClick={() => handleSelectAllForModule(m.key, m.actions)}
                            className="text-[11px] text-[#2563EB] hover:underline"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {m.actions.map((act) => {
                            const isChecked = currentActions.includes(act);
                            return (
                              <label
                                key={act}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-[11px] cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-blue-50 border-blue-200 text-[#2563EB] font-semibold'
                                    : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#4B5563]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleAction(m.key, act)}
                                  className="rounded text-[#2563EB] w-3 h-3"
                                />
                                <span className="font-mono">{act}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB] shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E7EB] text-[#4B5563] font-semibold rounded-[8px] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-[8px]"
                >
                  {isEditing ? 'Save Role Changes' : 'Create Custom Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
