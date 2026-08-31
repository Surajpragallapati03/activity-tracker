import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import type { Info, Invite, Plan } from '../types/auth'
import { Edit2, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface ListResponse {
  data: Plan[]
  total: number
  page: number
  limit: number
}

interface InfoListResponse {
  data: Info[]
  total: number
  page: number
  limit: number
}

interface InviteListResponse {
  data: Invite[]
  total: number
  page: number
  limit: number
}

export const KIV = () => {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['kiv-plans', page, currentUser?.ir_id],
    queryFn: async () => {
      if (!currentUser) return { data: [], total: 0, page: 1, limit }
      const params: any = { page, limit, pipeline_status: 'kiv', ir_id: currentUser.ir_id }
      const res = await api.get<ListResponse>('/plans', { params })
      return res.data
    },
    enabled: !!currentUser,
  })


  const { data: allInfos } = useQuery({
    queryKey: ['infos-for-kiv'],
    queryFn: async () => {
      const res = await api.get<InfoListResponse>('/infos', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const { data: allInvites } = useQuery({
    queryKey: ['invites-for-kiv'],
    queryFn: async () => {
      const res = await api.get<InviteListResponse>('/invites', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (req: any) => {
      const res = await api.put<Plan>(`/plans/${editingPlan!.id}`, req)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kiv-plans'] })
      setEditingPlan(null)
    },
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">KIV Plans</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Keep in view plans</p>
        </div>

        <div className="card">
          {error && (
            <div className="card-content bg-red-50 text-red-700 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>Failed to load KIV plans</span>
            </div>
          )}

          {isLoading ? (
            <div className="card-content flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="card-content text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No KIV plans</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Prospect Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Expected UV</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">IR ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Remarks</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.data.map((plan) => {
                      const invite = allInvites?.find((i) => i.id === plan.invite_id)
                      const info = allInfos?.find((i) => i.id === invite?.info_id)
                      return (
                        <tr key={plan.id} className="hover:bg-slate-50 dark:bg-slate-800">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{info?.prospect_name || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.expected_uvs || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.ir_id}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">{plan.remarks || 'NA'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setEditingPlan(plan)}
                              className="p-2 hover:bg-blue-50 rounded text-blue-600"
                              title="Edit pipeline status"
                            >
                              <Edit2 size={18} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
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

      {editingPlan && (
        <UpdateKIVStatusModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSubmit={(pipelineStatus) => updateMutation.mutate({ pipeline_status: pipelineStatus })}
          isLoading={updateMutation.isPending}
          error={updateMutation.isError ? 'Failed to update plan' : null}
        />
      )}
    </DashboardLayout>
  )
}

interface UpdateKIVStatusModalProps {
  plan: Plan
  onClose: () => void
  onSubmit: (pipelineStatus: string) => void
  isLoading: boolean
  error: string | null
}

const UpdateKIVStatusModal = ({ plan, onClose, onSubmit, isLoading, error }: UpdateKIVStatusModalProps) => {
  const [newStatus, setNewStatus] = useState(plan.pipeline_status || 'kiv')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(newStatus)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Update Pipeline Status</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label className="label">Current Status: {plan.pipeline_status}</label>
            </div>
            <div>
              <label className="label">New Status *</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input">
                <option value="tentative">Tentative</option>
                <option value="strong">Strong</option>
                <option value="sureshot">Sureshot</option>
                <option value="done">Done</option>
                <option value="kiv">KIV</option>
              </select>
            </div>
          </div>
          <div className="card-footer flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading || newStatus === plan.pipeline_status} className="btn-primary">
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
