import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import type { User } from '../types/auth'
import { Loader2, Edit2 } from 'lucide-react'

interface ListResponse {
  data: User[]
  total: number
}

export const Dashboard = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', 'summary'],
    queryFn: async () => {
      const res = await api.get<ListResponse>('/users', {
        params: { page: 1, limit: 1000 },
      })
      return res.data
    },
  })

  const totalUsers = usersData?.total ?? 0
  const downlineCount = usersData?.data.filter((u: User) => u.upline_id === user?.id).length ?? 0

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Welcome, {user?.name}!</h2>
          <p className="mt-1 text-slate-600">Here's an overview of your account.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-content">
              <h3 className="text-sm font-medium text-slate-600 mb-1">Email</h3>
              <p className="text-lg font-semibold text-slate-900 break-all">{user?.email}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <h3 className="text-sm font-medium text-slate-600 mb-1">Role</h3>
              <p className="text-lg font-semibold text-slate-900 uppercase">{user?.role}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <h3 className="text-sm font-medium text-slate-600 mb-1">Status</h3>
              <p className="text-lg font-semibold text-slate-900">{user?.status}</p>
            </div>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-content">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Total Users</h3>
                {isLoading ? (
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                ) : (
                  <p className="text-3xl font-bold text-blue-600">{totalUsers}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {user?.role === 'upline' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-content">
                <h3 className="text-sm font-medium text-slate-600 mb-1">Direct Downlines</h3>
                {isLoading ? (
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                ) : (
                  <p className="text-3xl font-bold text-blue-600">{downlineCount}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Account Information</h3>
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded text-blue-600"
            >
              <Edit2 size={18} />
              <span className="text-sm">Edit Profile</span>
            </button>
          </div>
          <div className="card-content space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Name</label>
                <p className="text-slate-700">{user?.name}</p>
              </div>
              <div>
                <label className="label">Email</label>
                <p className="text-slate-700">{user?.email}</p>
              </div>
              <div>
                <label className="label">IR ID</label>
                <p className="text-slate-700">{user?.ir_id}</p>
              </div>
              <div>
                <label className="label">Phone</label>
                <p className="text-slate-700">{user?.phone}</p>
              </div>
              <div>
                <label className="label">Role</label>
                <p className="text-slate-700 uppercase">{user?.role}</p>
              </div>
              <div>
                <label className="label">Status</label>
                <p className="text-slate-700">{user?.status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditOpen && user && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            setIsEditOpen(false)
            queryClient.invalidateQueries({ queryKey: ['auth'] })
          }}
        />
      )}
    </DashboardLayout>
  )
}

interface EditProfileModalProps {
  user: User
  onClose: () => void
  onSuccess: () => void
}

const EditProfileModal = ({ user, onClose, onSuccess }: EditProfileModalProps) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status || '',
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put<User>(`/users/${user.id}`, form)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900">Edit Profile</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {updateMutation.isError && (
              <div className="text-red-600 text-sm">Failed to update profile</div>
            )}
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
              <label className="label">Status</label>
              <input
                type="text"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="card-footer flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
