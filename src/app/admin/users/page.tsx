'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { UsersIcon, PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'USER' as 'ADMIN' | 'USER',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        // If users API doesn't exist yet, just set empty array
        if (response.status === 404) {
          setUsers([]);
          return;
        }
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Users API not fully implemented yet:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast.error('Password is required for new users');
      return;
    }

    setIsCreating(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const body = editingUser 
        ? { email: formData.email, role: formData.role }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save user');
      }

      const user = await response.json();
      
      if (editingUser) {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        toast.success('User updated successfully');
        setEditingUser(null);
      } else {
        setUsers(prev => [...prev, user]);
        toast.success('User created successfully');
      }

      setFormData({ email: '', role: 'USER', password: '' });
      setShowForm(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        toast.error('Users API not fully implemented yet');
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to save user');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      role: user.role,
      password: '', // Don't show existing password
    });
    setShowForm(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setFormData({ email: '', role: 'USER', password: '' });
    setShowForm(false);
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    
    if (newRole === 'ADMIN') {
      if (!confirm(`Are you sure you want to make "${user.email}" an admin? This will give them full access to the admin panel.`)) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...user, role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New User
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* User Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="user@example.com"
                required
              />
            </div>

            {!editingUser && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter password"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-200 mb-2">
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'USER' }))}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">System Users</h2>
        
        {users.length > 0 ? (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-white">{user.email}</h3>
                      <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                        user.role === 'ADMIN' 
                          ? 'bg-red-600/20 text-red-300' 
                          : 'bg-blue-600/20 text-blue-300'
                      }`}>
                        {user.role === 'ADMIN' && <ShieldCheckIcon className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                      {user.updatedAt !== user.createdAt && (
                        <span className="ml-2">
                          • Updated: {new Date(user.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleRole(user)}
                      className={`px-3 py-1 text-sm rounded ${
                        user.role === 'ADMIN'
                          ? 'text-blue-300 bg-blue-600/20 hover:bg-blue-600/30'
                          : 'text-red-300 bg-red-600/20 hover:bg-red-600/30'
                      }`}
                    >
                      {user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1 text-sm text-blue-300 bg-blue-600/20 rounded hover:bg-blue-600/30"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="px-3 py-1 text-sm text-red-300 bg-red-600/20 rounded hover:bg-red-600/30"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">No users yet</div>
            <p className="text-gray-500 mb-4">Create user accounts to manage access to your site</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create First User
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 