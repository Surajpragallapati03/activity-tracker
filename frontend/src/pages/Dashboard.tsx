import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import type { User } from '../types/auth'
import { Loader2, Edit2, Users, TrendingUp, Target } from 'lucide-react'
import { PasswordChangeModal } from '../components/PasswordChangeModal'

interface ListResponse {
  data: User[]
  total: number
}

export const Dashboard = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  const { data: currentUserProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['users', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const res = await api.get<User>(`/users/${user.id}`)
      return res.data
    },
    enabled: !!user?.id,
  })

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
  const displayUser = currentUserProfile || user

  return (
    <DashboardLayout
      onProfileClick={() => setIsEditOpen(true)}
      onPasswordClick={() => setIsPasswordOpen(true)}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name}!</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Here's an overview of your account.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10">
            <div className="card-content space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">System Count</h3>
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              {isLoading ? (
                <Loader2 size={24} className="animate-spin text-slate-400" />
              ) : (
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalUsers}</p>
              )}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10">
            <div className="card-content space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Plans Shown</h3>
                <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
              </div>
              {isLoadingProfile ? (
                <Loader2 size={24} className="animate-spin text-slate-400" />
              ) : (
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">{displayUser?.plans_shown ?? 0}</p>
              )}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/20 dark:to-purple-950/10">
            <div className="card-content space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">DRs Hit</h3>
                <Target size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              {isLoadingProfile ? (
                <Loader2 size={24} className="animate-spin text-slate-400" />
              ) : (
                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{displayUser?.drs_hit ?? 0}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Account Information</h3>
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-2 p-2 hover:bg-blue-50 dark:hover:bg-blue-950 rounded text-blue-600 dark:text-blue-400 transition-colors"
            >
              <Edit2 size={18} />
              <span className="text-sm">Edit Profile</span>
            </button>
          </div>
          <div className="card-content space-y-4">
            {isLoadingProfile && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            )}
            {!isLoadingProfile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Name</label>
                  <p className="text-slate-700 dark:text-slate-300">{displayUser?.name}</p>
                </div>
                <div>
                  <label className="label">Email</label>
                  <p className="text-slate-700 dark:text-slate-300">{displayUser?.email}</p>
                </div>
                <div>
                  <label className="label">IR ID</label>
                  <p className="text-slate-700 dark:text-slate-300">{displayUser?.ir_id}</p>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <p className="text-slate-700 dark:text-slate-300">{displayUser?.phone}</p>
                </div>
                <div>
                  <label className="label">Role</label>
                  <p className="text-slate-700 dark:text-slate-300 uppercase">{displayUser?.role}</p>
                </div>
                <div>
                  <label className="label">Status</label>
                  <p className="text-slate-700 dark:text-slate-300">{displayUser?.status}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditOpen && displayUser && (
        <EditProfileModal
          user={displayUser}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            setIsEditOpen(false)
            queryClient.invalidateQueries({ queryKey: ['users', user?.id] })
          }}
        />
      )}

      {isPasswordOpen && (
        <PasswordChangeModal
          hasPassword={!!(displayUser?.password_hash || user?.password_hash)}
          onClose={() => setIsPasswordOpen(false)}
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
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Profile</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {updateMutation.isError && (
              <div className="text-red-600 dark:text-red-400 text-sm">Failed to update profile</div>
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
