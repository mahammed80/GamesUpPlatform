import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, UserPlus, Shield } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { rolesAPI } from '../../utils/api';

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: {
    [key: string]: boolean;
  };
  created_at?: string;
}

const permissionKeys = [
  'dashboard', 'products', 'orders', 'pos', 'analytics', 
  'customers', 'banners', 'outlook', 'hr', 'tasks', 
  'team', 'roles', 'system', 'delivery', 'settings'
];

const permissionLabels: { [key: string]: string } = {
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  pos: 'Point of Sale',
  analytics: 'Analytics',
  customers: 'Customers',
  banners: 'Banners',
  outlook: 'Outlook Accounts',
  hr: 'HR & Attendance',
  tasks: 'Tasks',
  team: 'Team Members',
  roles: 'Roles & Access',
  system: 'System',
  delivery: 'Delivery Options',
  settings: 'Settings',
};

export function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: permissionKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as any),
  });

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesAPI.getAll();
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      await rolesAPI.create(roleFormData);
      await loadRoles();
      setIsRoleModalOpen(false);
      setRoleFormData({
        name: '',
        description: '',
        permissions: permissionKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as any),
      });
    } catch (error) {
      console.error('Error creating role:', error);
      alert('Failed to create role');
    }
  };

  const handleCreateUser = async () => {
    try {
      await rolesAPI.createAdminUser(userFormData);
      alert('User created successfully');
      setIsUserModalOpen(false);
      setUserFormData({
        name: '',
        email: '',
        password: '',
        role: '',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Email might be taken.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Access</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage user roles and permissions</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsUserModalOpen(true)} variant="outline" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Create User Account
          </Button>
          <Button onClick={() => setIsRoleModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white">
            <Shield className="w-4 h-4" />
            Create New Role
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading roles...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {role.name}
                    {role.name === 'admin' && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">System</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role.description}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permissions (Sidebar Access)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {permissionKeys.map((key) => {
                    const hasPermission = role.permissions && role.permissions[key];
                    return (
                      <div 
                        key={key} 
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                          hasPermission 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                            : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {hasPermission ? (
                          <Check className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="truncate" title={permissionLabels[key]}>{permissionLabels[key]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Create New Role"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name</label>
            <input
              type="text"
              value={roleFormData.name}
              onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
              placeholder="e.g. Sales Associate"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
              placeholder="Brief description of the role"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {permissionKeys.map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={roleFormData.permissions[key]}
                    onChange={(e) => setRoleFormData({
                      ...roleFormData,
                      permissions: { ...roleFormData.permissions, [key]: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{permissionLabels[key]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRole} className="bg-red-600 text-white hover:bg-red-700">Create Role</Button>
          </div>
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Create User Account"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Role</label>
            <select
              value={userFormData.role}
              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} className="bg-red-600 text-white hover:bg-red-700">Create Account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
