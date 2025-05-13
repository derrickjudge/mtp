'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error loading users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset form
  const resetForm = () => {
    setNewUser({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setShowAddForm(false);
    setEditUser(null);
    setFormError('');
    setFormSuccess('');
  };

  // Add new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setFormError('All fields are required');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      setFormSuccess('User created successfully');
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Error creating user');
      console.error(err);
    }
  };

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!editUser || !editUser.username.trim() || !editUser.email.trim()) {
      setFormError('Username and email are required');
      return;
    }

    try {
      const response = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editUser.username,
          email: editUser.email,
          role: editUser.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      setFormSuccess('User updated successfully');
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Error updating user');
      console.error(err);
    }
  };

  // Delete user
  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }

      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error deleting user');
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>User Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
        >
          {showAddForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {formError && (
        <div className="alert alert-error">
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="alert alert-success">
          {formSuccess}
        </div>
      )}

      {/* Add/Edit User Form */}
      {(showAddForm || editUser) && (
        <div className="admin-card" style={{ marginBottom: '2rem' }}>
          <h2>{editUser ? 'Edit User' : 'Add New User'}</h2>
          <form className="admin-form" onSubmit={editUser ? handleUpdateUser : handleAddUser}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={editUser ? editUser.username : newUser.username}
                onChange={(e) => 
                  editUser 
                    ? setEditUser({ ...editUser, username: e.target.value })
                    : setNewUser({ ...newUser, username: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={editUser ? editUser.email : newUser.email}
                onChange={(e) => 
                  editUser 
                    ? setEditUser({ ...editUser, email: e.target.value })
                    : setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </div>
            {!editUser && (
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={editUser ? editUser.role : newUser.role}
                onChange={(e) => 
                  editUser 
                    ? setEditUser({ ...editUser, role: e.target.value })
                    : setNewUser({ ...newUser, role: e.target.value })
                }
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editUser ? 'Update User' : 'Add User'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <div className="admin-card">
          <p>No users found. Add a user to get started.</p>
        </div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setEditUser(user)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                        disabled={user.role === 'admin'} // Prevent deleting admin users
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
