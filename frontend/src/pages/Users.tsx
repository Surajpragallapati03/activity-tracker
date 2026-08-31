import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import type { User } from '../types/auth'
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface ListResponse {
  data: User[]
  total: number
  page: number
  limit: number
}

export const Users = () => {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)

  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const res = await api.get<ListResponse>('/users', {
        params: { page, limit, search: search || undefined },
      })
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (req: any) => {
      const res = await api.post<User>('/users', req)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (req: any) => {
      const res = await api.put<User>(`/users/${editingUser!.id}`, req)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteConfirm(null)
    },
    onError: (error: any) => {
      if (error.response?.data?.error) {
        // Error message from backend
      }
    },
  })

  const canCreateUser = !!currentUser
  const canEditUser = (u: User) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true
    if (currentUser.id === u.id) return true
    return downlines.has(u.id)
  }
  const canDeleteUser = (u: User) => {
    if (!currentUser) return false
    if (currentUser.role !== 'admin') return false
    if (currentUser.id === u.id) return false
    return true
  }

  const downlines = useMemo(() => {
    if (!data || !currentUser) return new Set()
    const result = new Set<string>()
    const buildMap = (userId: string) => {
      data.data.forEach((u: User) => {
        if (u.upline_id === userId) {
          result.add(u.id)
          buildMap(u.id)
        }
      })
    }
    buildMap(currentUser.id)
    return result
  }, [data, currentUser])

  const isDownline = (u: User) => downlines.has(u.id)

  const visibleUsers = useMemo(() => {
    if (!data || !currentUser) return data?.data || []
    if (currentUser.role === 'admin') return data.data
    return data.data.filter((u) => u.id === currentUser.id || isDownline(u))
  }, [data, currentUser])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Users</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Manage users and permissions</p>
          </div>
          {canCreateUser && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary gap-2"
            >
              <Plus size={20} />
              <span>Add User</span>
            </button>
          )}
        </div>

        <div className="card">
          <div className="card-content border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <Search size={20} className="text-slate-400 flex-shrink-0 mt-1" />
              <input
                type="text"
                placeholder="Search by name, email, or IR ID..."
                value={search}
                onChange={handleSearch}
                className="input"
              />
            </div>
          </div>

          {error && (
            <div className="card-content bg-red-50 text-red-700 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>Failed to load users</span>
            </div>
          )}

          {isLoading ? (
            <div className="card-content flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="card-content text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">IR ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Plans Shown</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">DRs Hit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:bg-slate-800">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{u.ir_id}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{u.status || 'NA'}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">{u.plans_shown ?? 0}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">{u.drs_hit ?? 0}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setViewingUser(u)}
                              className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                              title="View user"
                            >
                              <Eye size={18} />
                            </button>
                            {canEditUser(u) && (
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-2 hover:bg-blue-50 rounded text-blue-600"
                                title="Edit user"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {canDeleteUser(u) && (
                              <button
                                onClick={() => setDeleteConfirm(u)}
                                className="p-2 hover:bg-red-50 rounded text-red-600"
                                title="Delete user"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data && data.total > limit && (
                <div className="card-footer flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-3 py-2 text-sm font-medium">{page}</span>
                    <button
                      onClick={() => setPage((p) => (data && p * limit < data.total ? p + 1 : p))}
                      disabled={!data || page * limit >= data.total}
                      className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <CreateUserModal
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.isError ? 'Failed to create user' : null}
        />
      )}

      {viewingUser && (
        <ViewUserModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
          error={updateMutation.isError ? 'Failed to update user' : null}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          user={deleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          isLoading={deleteMutation.isPending}
          error={deleteMutation.isError ? 'Failed to delete user' : null}
        />
      )}
    </DashboardLayout>
  )
}

interface ViewUserModalProps {
  user: User
  onClose: () => void
}

const ViewUserModal = ({ user, onClose }: ViewUserModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">User Details</h3>
        </div>
        <div className="card-content space-y-4">
          <div>
            <label className="label">Name</label>
            <p className="text-slate-700 dark:text-slate-300">{user.name}</p>
          </div>
          <div>
            <label className="label">Email</label>
            <p className="text-slate-700 dark:text-slate-300 break-all">{user.email}</p>
          </div>
          <div>
            <label className="label">IR ID</label>
            <p className="text-slate-700 dark:text-slate-300">{user.ir_id}</p>
          </div>
          <div>
            <label className="label">Phone</label>
            <p className="text-slate-700 dark:text-slate-300">{user.phone}</p>
          </div>
          <div>
            <label className="label">Role</label>
            <p className="text-slate-700 dark:text-slate-300 uppercase">{user.role}</p>
          </div>
          <div>
            <label className="label">Status</label>
            <p className="text-slate-700 dark:text-slate-300">{user.status || 'NA'}</p>
          </div>
          <div>
            <label className="label">Upline ID</label>
            <p className="text-slate-700 dark:text-slate-300">{user.upline_id || 'NA'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Plans Shown</label>
              <p className="text-slate-700 dark:text-slate-300">{user.plans_shown ?? 0}</p>
            </div>
            <div>
              <label className="label">DRs Hit</label>
              <p className="text-slate-700 dark:text-slate-300">{user.drs_hit ?? 0}</p>
            </div>
          </div>
          {user.created_at && (
            <div>
              <label className="label">Created</label>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{new Date(user.created_at).toLocaleString()}</p>
            </div>
          )}
          {user.updated_at && (
            <div>
              <label className="label">Updated</label>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{new Date(user.updated_at).toLocaleString()}</p>
            </div>
          )}
        </div>
        <div className="card-footer flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

interface CreateUserModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  error: string | null
}

const CreateUserModal = ({ onClose, onSubmit, isLoading, error }: CreateUserModalProps) => {
  const { user: currentUser } = useAuth()
  const { data: allUsers } = useQuery({
    queryKey: ['users-for-selector'],
    queryFn: async () => {
      const res = await api.get<ListResponse>('/users', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const [form, setForm] = useState({
    ir_id: '',
    name: '',
    email: '',
    phone: '',
    role: 'ir' as 'admin' | 'upline' | 'ir',
    upline_id: currentUser?.id || '',
    status: '',
    password: '',
    plans_shown: 0,
    drs_hit: 0,
  })
  const [showPassword, setShowPassword] = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...form,
      upline_id: form.upline_id || null,
    }
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create User</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label className="label">IR ID *</label>
              <input
                type="text"
                required
                value={form.ir_id}
                onChange={(e) => setForm({ ...form, ir_id: e.target.value })}
                className="input"
                placeholder="Unique IR identifier"
              />
            </div>
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Role *</label>
              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'upline' | 'ir' })}
                className="input"
              >
                <option value="admin">Admin</option>
                <option value="upline">Upline</option>
                <option value="ir">IR</option>
              </select>
            </div>
            <div>
              <label className="label">Upline</label>
              {isAdmin ? (
                <select
                  value={form.upline_id}
                  onChange={(e) => setForm({ ...form, upline_id: e.target.value })}
                  className="input"
                >
                  <option value="">No Upline</option>
                  {allUsers?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.ir_id})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">
                  {currentUser?.name} ({currentUser?.ir_id})
                </div>
              )}
            </div>
            <div>
              <label className="label">Password (Optional)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pr-10"
                  placeholder="Leave blank to skip password setup"
                />
                {form.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <input
                type="text"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Plans Shown</label>
                <input
                  type="number"
                  min="0"
                  value={form.plans_shown}
                  onChange={(e) => setForm({ ...form, plans_shown: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">DRs Hit</label>
                <input
                  type="number"
                  min="0"
                  value={form.drs_hit}
                  onChange={(e) => setForm({ ...form, drs_hit: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>
            </div>
          </div>
          <div className="card-footer flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditUserModalProps {
  user: User
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  error: string | null
}

const EditUserModal = ({ user, onClose, onSubmit, isLoading, error }: EditUserModalProps) => {
  const { user: currentUser } = useAuth()
  const { data: allUsers } = useQuery({
    queryKey: ['users-for-selector'],
    queryFn: async () => {
      const res = await api.get<ListResponse>('/users', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as 'admin' | 'upline' | 'ir',
    upline_id: user.upline_id || '',
    status: user.status || '',
    password: '',
    plans_shown: user.plans_shown ?? 0,
    drs_hit: user.drs_hit ?? 0,
  })
  const [showPassword, setShowPassword] = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...form,
      upline_id: form.upline_id || null,
    }
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit User</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Role *</label>
              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'upline' | 'ir' })}
                className="input"
              >
                <option value="admin">Admin</option>
                <option value="upline">Upline</option>
                <option value="ir">IR</option>
              </select>
            </div>
            {isAdmin && (
              <div>
                <label className="label">Upline</label>
                <select
                  value={form.upline_id}
                  onChange={(e) => setForm({ ...form, upline_id: e.target.value })}
                  className="input"
                >
                  <option value="">No Upline</option>
                  {allUsers?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.ir_id})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label">New Password (Optional)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pr-10"
                  placeholder="Leave blank to keep current password"
                />
                {form.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <input
                type="text"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Plans Shown</label>
                <input
                  type="number"
                  min="0"
                  value={form.plans_shown}
                  onChange={(e) => setForm({ ...form, plans_shown: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">DRs Hit</label>
                <input
                  type="number"
                  min="0"
                  value={form.drs_hit}
                  onChange={(e) => setForm({ ...form, drs_hit: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>
            </div>
          </div>
          <div className="card-footer flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DeleteConfirmModalProps {
  user: User
  onCancel: () => void
  onConfirm: () => void
  isLoading: boolean
  error: string | null
}

const DeleteConfirmModal = ({ user, onCancel, onConfirm, isLoading, error }: DeleteConfirmModalProps) => {
  const { user: currentUser } = useAuth()
  const isSelfDelete = currentUser?.id === user.id

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-red-600">Delete User</h3>
        </div>
        <div className="card-content space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {isSelfDelete && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              Users cannot delete themselves.
            </div>
          )}
          {currentUser?.role !== 'admin' && !isSelfDelete && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              Only admin can delete users.
            </div>
          )}
          {!isSelfDelete && currentUser?.role === 'admin' && (
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong>{user.name}</strong>? Their downlines will be re-parented to their upline. This action cannot be undone.
            </p>
          )}
        </div>
        <div className="card-footer flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || isSelfDelete || currentUser?.role !== 'admin'}
            className="btn-danger"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
