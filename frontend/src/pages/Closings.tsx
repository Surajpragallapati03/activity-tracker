import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import type { User, Info, Invite, Plan, Closing } from '../types/auth'
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, Eye, ChevronDown } from 'lucide-react'

interface ListResponse {
  data: Closing[]
  total: number
  page: number
  limit: number
}

interface UserListResponse {
  data: User[]
  total: number
  page: number
  limit: number
}

interface PlanListResponse {
  data: Plan[]
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

interface InfoListResponse {
  data: Info[]
  total: number
  page: number
  limit: number
}

export const Closings = () => {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedOwnerIrId, setSelectedOwnerIrId] = useState<string | 'all'>('all')
  const [ownerSearchInput, setOwnerSearchInput] = useState('')
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingClosing, setEditingClosing] = useState<Closing | null>(null)
  const [viewingClosing, setViewingClosing] = useState<Closing | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Closing | null>(null)

  const limit = 20
  const ownerDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target as Node)) {
        setShowOwnerDropdown(false)
      }
    }

    if (showOwnerDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOwnerDropdown])

  const { data, isLoading, error } = useQuery({
    queryKey: ['closings', page, search, selectedOwnerIrId],
    queryFn: async () => {
      const params: any = { page, limit, search: search || undefined }
      if (selectedOwnerIrId !== 'all') {
        params.ir_id = selectedOwnerIrId
      }
      const res = await api.get<ListResponse>('/closings', { params })
      return res.data
    },
  })

  const { data: allUsers } = useQuery({
    queryKey: ['users-for-closing-selector'],
    queryFn: async () => {
      const res = await api.get<UserListResponse>('/users', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const { data: allPlans } = useQuery({
    queryKey: ['plans-for-closing-selector'],
    queryFn: async () => {
      const res = await api.get<PlanListResponse>('/plans', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const { data: allInvites } = useQuery({
    queryKey: ['invites-for-closing-selector'],
    queryFn: async () => {
      const res = await api.get<InviteListResponse>('/invites', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const { data: allInfos } = useQuery({
    queryKey: ['infos-for-closing-selector'],
    queryFn: async () => {
      const res = await api.get<InfoListResponse>('/infos', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (req: any) => {
      const res = await api.post<Closing>('/closings', req)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closings'] })
      setIsCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (req: any) => {
      const res = await api.put<Closing>(`/closings/${editingClosing!.id}`, req)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closings'] })
      setEditingClosing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/closings/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closings'] })
      setDeleteConfirm(null)
    },
  })

  const downlines = useMemo(() => {
    if (!allUsers || !currentUser) return new Set()
    const result = new Set<string>()
    const buildMap = (userId: string) => {
      allUsers.forEach((u: User) => {
        if (u.upline_id === userId) {
          result.add(u.id)
          buildMap(u.id)
        }
      })
    }
    buildMap(currentUser.id)
    return result
  }, [allUsers, currentUser])

  const isDownline = (u: User) => downlines.has(u.id)

  const getOwnersForActivitySelector = useMemo(() => {
    if (!allUsers || !currentUser) return []
    if (currentUser.role === 'admin') return allUsers
    return allUsers.filter((u) => u.id === currentUser.id || isDownline(u))
  }, [allUsers, currentUser])

  const filteredOwners = useMemo(() => {
    if (!ownerSearchInput) return getOwnersForActivitySelector
    return getOwnersForActivitySelector.filter(
      (u) => u.name.toLowerCase().includes(ownerSearchInput.toLowerCase()) || u.ir_id.includes(ownerSearchInput)
    )
  }, [getOwnersForActivitySelector, ownerSearchInput])

  const selectedOwner = useMemo(() => {
    if (selectedOwnerIrId === 'all') return null
    return getOwnersForActivitySelector.find((u) => u.ir_id === selectedOwnerIrId)
  }, [selectedOwnerIrId, getOwnersForActivitySelector])

  const handleOwnerSelect = (irId: string | 'all') => {
    setSelectedOwnerIrId(irId)
    setPage(1)
    setShowOwnerDropdown(false)
    setOwnerSearchInput('')
  }

  const canCreateClosing = !!currentUser
  const canEditClosing = (closing: Closing) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true
    const owner = allUsers?.find((u) => u.ir_id === closing.ir_id)
    if (!owner) return false
    return owner.id === currentUser.id || downlines.has(owner.id)
  }
  const canDeleteClosing = (closing: Closing) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true
    const owner = allUsers?.find((u) => u.ir_id === closing.ir_id)
    if (!owner) return false
    return owner.id === currentUser.id || downlines.has(owner.id)
  }

  const visibleClosings = useMemo(() => {
    if (!data || !currentUser || !allUsers) return data?.data || []
    if (currentUser.role === 'admin') return data.data
    const accessibleIRs = new Set<string>()
    accessibleIRs.add(currentUser.ir_id)
    downlines.forEach((userId) => {
      const user = allUsers.find((u) => u.id === userId)
      if (user) accessibleIRs.add(user.ir_id)
    })
    return data.data.filter((closing) => accessibleIRs.has(closing.ir_id))
  }, [data, currentUser, allUsers, downlines])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Closings</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Manage prospect closings</p>
          </div>
          {canCreateClosing && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary gap-2"
            >
              <Plus size={20} />
              <span>Add Closing</span>
            </button>
          )}
        </div>

        <div className="card">
          <div className="card-content border-b border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="label text-sm">Activity Owner</label>
              <div className="relative" ref={ownerDropdownRef}>
                <button
                  onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-left flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="text-slate-900 dark:text-white">
                    {selectedOwnerIrId === 'all' ? 'All' : selectedOwner ? `${selectedOwner.name} (${selectedOwner.ir_id})` : 'Select owner'}
                  </span>
                  <ChevronDown size={18} className="text-slate-400" />
                </button>

                {showOwnerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 p-2 border-b border-slate-200 dark:border-slate-700">
                      <input
                        type="text"
                        placeholder="Search by name or IR ID..."
                        value={ownerSearchInput}
                        onChange={(e) => setOwnerSearchInput(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handleOwnerSelect('all')}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 ${selectedOwnerIrId === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-900 dark:text-white'}`}
                      >
                        All
                      </button>
                    )}
                    {filteredOwners.map((owner) => (
                      <button
                        key={owner.ir_id}
                        onClick={() => handleOwnerSelect(owner.ir_id)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-t border-slate-100 ${selectedOwnerIrId === owner.ir_id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-900 dark:text-white'}`}
                      >
                        <div className="font-medium">{owner.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">{owner.ir_id}</div>
                      </button>
                    ))}
                    {filteredOwners.length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-500 text-center">No owners found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Search size={20} className="text-slate-400 flex-shrink-0 mt-1" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={handleSearch}
                className="input"
              />
            </div>
          </div>

          {error && (
            <div className="card-content bg-red-50 text-red-700 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>Failed to load closings</span>
            </div>
          )}

          {isLoading ? (
            <div className="card-content flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : visibleClosings.length === 0 ? (
            <div className="card-content text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No closings found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Prospect Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Closing Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Remarks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">IR ID</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleClosings.map((closing) => {
                      const plan = allPlans?.find((p) => p.id === closing.plan_id)
                      const invite = allInvites?.find((i) => i.id === plan?.invite_id)
                      const info = allInfos?.find((i) => i.id === invite?.info_id)
                      return (
                        <tr key={closing.id} className="hover:bg-slate-50 dark:bg-slate-800">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{info?.prospect_name || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{closing.closing_date || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{closing.status || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{closing.remarks || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{closing.ir_id}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setViewingClosing(closing)}
                                className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                                title="View closing"
                              >
                                <Eye size={18} />
                              </button>
                              {canEditClosing(closing) && (
                                <button
                                  onClick={() => setEditingClosing(closing)}
                                  className="p-2 hover:bg-blue-50 rounded text-blue-600"
                                  title="Edit closing"
                                >
                                  <Edit2 size={18} />
                                </button>
                              )}
                              {canDeleteClosing(closing) && (
                                <button
                                  onClick={() => setDeleteConfirm(closing)}
                                  className="p-2 hover:bg-red-50 rounded text-red-600"
                                  title="Delete closing"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
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

      {isCreateOpen && (
        <CreateClosingModal
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.isError ? 'Failed to create closing' : null}
          users={getOwnersForActivitySelector}
          plans={allPlans || []}
          invites={allInvites || []}
          infos={allInfos || []}
          currentUser={currentUser}
        />
      )}

      {viewingClosing && (
        <ViewClosingModal
          closing={viewingClosing}
          plan={allPlans?.find((p) => p.id === viewingClosing.plan_id)}
          invite={allInvites?.find((i) => i.id === allPlans?.find((p) => p.id === viewingClosing.plan_id)?.invite_id)}
          info={allInfos?.find((i) => i.id === allInvites?.find((inv) => inv.id === allPlans?.find((p) => p.id === viewingClosing.plan_id)?.invite_id)?.info_id)}
          onClose={() => setViewingClosing(null)}
        />
      )}

      {editingClosing && (
        <EditClosingModal
          closing={editingClosing}
          plan={allPlans?.find((p) => p.id === editingClosing.plan_id)}
          invite={allInvites?.find((i) => i.id === allPlans?.find((p) => p.id === editingClosing.plan_id)?.invite_id)}
          info={allInfos?.find((i) => i.id === allInvites?.find((inv) => inv.id === allPlans?.find((p) => p.id === editingClosing.plan_id)?.invite_id)?.info_id)}
          onClose={() => setEditingClosing(null)}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
          error={updateMutation.isError ? 'Failed to update closing' : null}
          users={getOwnersForActivitySelector}
          currentUser={currentUser}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          info={allInfos?.find((i) => i.id === allInvites?.find((inv) => inv.id === allPlans?.find((p) => p.id === deleteConfirm.plan_id)?.invite_id)?.info_id)}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          isLoading={deleteMutation.isPending}
          error={deleteMutation.isError ? 'Failed to delete closing' : null}
        />
      )}
    </DashboardLayout>
  )
}

interface ViewClosingModalProps {
  closing: Closing
  plan?: Plan
  invite?: Invite
  info?: Info
  onClose: () => void
}

const ViewClosingModal = ({ closing, info, onClose }: ViewClosingModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Closing Details</h3>
        </div>
        <div className="card-content space-y-4">
          <div>
            <label className="label">Prospect Name</label>
            <p className="text-slate-700 dark:text-slate-300">{info?.prospect_name || 'NA'}</p>
          </div>
          <div>
            <label className="label">Closing Date</label>
            <p className="text-slate-700 dark:text-slate-300">{closing.closing_date || 'NA'}</p>
          </div>
          <div>
            <label className="label">Status</label>
            <p className="text-slate-700 dark:text-slate-300">{closing.status || 'NA'}</p>
          </div>
          <div>
            <label className="label">Remarks</label>
            <p className="text-slate-700 dark:text-slate-300">{closing.remarks || 'NA'}</p>
          </div>
          <div>
            <label className="label">IR ID</label>
            <p className="text-slate-700 dark:text-slate-300">{closing.ir_id}</p>
          </div>
          {closing.created_at && (
            <div>
              <label className="label">Created</label>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{new Date(closing.created_at).toLocaleString()}</p>
            </div>
          )}
          {closing.updated_at && (
            <div>
              <label className="label">Updated</label>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{new Date(closing.updated_at).toLocaleString()}</p>
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

interface CreateClosingModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  error: string | null
  users: User[]
  plans: Plan[]
  invites: Invite[]
  infos: Info[]
  currentUser: User | null
}

const CreateClosingModal = ({ onClose, onSubmit, isLoading, error, users, plans, invites, infos, currentUser }: CreateClosingModalProps) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(currentUser?.id || '')
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const [ownerSearchInput, setOwnerSearchInput] = useState('')
  const ownerDropdownRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState({
    plan_id: '',
    closing_date: '',
    status: '',
    remarks: '',
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target as Node)) {
        setShowOwnerDropdown(false)
      }
    }

    if (showOwnerDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOwnerDropdown])

  const selectedOwnerUser = users?.find((u) => u.id === selectedOwnerId)
  const isOwnerSelected = !!selectedOwnerUser

  const filteredOwners = useMemo(() => {
    if (!ownerSearchInput) return users || []
    return (users || []).filter(
      (u) => u.name.toLowerCase().includes(ownerSearchInput.toLowerCase()) || u.ir_id.includes(ownerSearchInput)
    )
  }, [users, ownerSearchInput])

  const authorizingOwners = useMemo(() => {
    if (!currentUser || !users) return []
    if (currentUser.role === 'admin') return users
    const downlines = new Set<string>()
    const buildMap = (userId: string) => {
      users.forEach((u: User) => {
        if (u.upline_id === userId) {
          downlines.add(u.id)
          buildMap(u.id)
        }
      })
    }
    buildMap(currentUser.id)
    return users.filter((u) => u.id === currentUser.id || downlines.has(u.id))
  }, [users, currentUser])

  const sortedOwners = useMemo(() => {
    if (!currentUser) return filteredOwners
    return filteredOwners.sort((a, b) => {
      if (a.id === currentUser.id) return -1
      if (b.id === currentUser.id) return 1
      return 0
    })
  }, [filteredOwners, currentUser])

  const availablePlans = useMemo(() => {
    if (!isOwnerSelected || !selectedOwnerUser) return []
    const ownerPlans = (plans || []).filter((plan) => plan.ir_id === selectedOwnerUser.ir_id)
    const plansWithClosings = new Set<string>()
    const allClosings: any[] = []
    allClosings.forEach((closing) => {
      plansWithClosings.add(closing.plan_id)
    })
    return ownerPlans.filter((plan) => !plansWithClosings.has(plan.id))
  }, [isOwnerSelected, selectedOwnerUser, plans])

  const handleOwnerSelect = (userId: string) => {
    setSelectedOwnerId(userId)
    setForm({ ...form, plan_id: '' })
    setShowOwnerDropdown(false)
    setOwnerSearchInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOwnerUser || !form.plan_id) return
    const submitData = {
      ir_id: selectedOwnerUser.ir_id,
      plan_id: form.plan_id,
      closing_date: form.closing_date || null,
      status: form.status,
      remarks: form.remarks || null,
    }
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Closing</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label className="label">Activity Owner *</label>
              <div className="relative" ref={ownerDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-left flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="text-slate-900 dark:text-white">
                    {selectedOwnerUser ? `${selectedOwnerUser.name}${selectedOwnerUser.id === currentUser?.id ? ' (Me)' : ''}` : 'Select owner'}
                  </span>
                  <ChevronDown size={18} className="text-slate-400" />
                </button>

                {showOwnerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 p-2 border-b border-slate-200 dark:border-slate-700">
                      <input
                        type="text"
                        placeholder="Search by name or IR ID..."
                        value={ownerSearchInput}
                        onChange={(e) => setOwnerSearchInput(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {sortedOwners
                      .filter((u) => authorizingOwners.some((au) => au.id === u.id))
                      .map((owner) => (
                        <button
                          key={owner.id}
                          type="button"
                          onClick={() => handleOwnerSelect(owner.id)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-t border-slate-100 ${selectedOwnerId === owner.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-900 dark:text-white'}`}
                        >
                          <div className="font-medium">
                            {owner.name}
                            {owner.id === currentUser?.id && ' (Me)'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-500">{owner.ir_id}</div>
                        </button>
                      ))}
                    {sortedOwners.filter((u) => authorizingOwners.some((au) => au.id === u.id)).length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-500 text-center">No owners found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isOwnerSelected && (
              <>
                <div>
                  <label className="label">Plan *</label>
                  <select
                    required
                    value={form.plan_id}
                    onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Plan</option>
                    {availablePlans.map((plan) => {
                      const invite = invites?.find((i) => i.id === plan.invite_id)
                      const info = infos?.find((i) => i.id === invite?.info_id)
                      return (
                        <option key={plan.id} value={plan.id}>
                          {info?.prospect_name || 'Unknown'} ({info?.phone || 'N/A'})
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label className="label">Closing Date</label>
                  <input
                    type="date"
                    value={form.closing_date}
                    onChange={(e) => setForm({ ...form, closing_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Status *</label>
                  <select
                    required
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Status</option>
                    <option value="done">Done</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="label">Remarks</label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="input"
                    placeholder="Remarks"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <div className="card-footer flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading || !isOwnerSelected} className="btn-primary">
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditClosingModalProps {
  closing: Closing
  plan?: Plan
  invite?: Invite
  info?: Info
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  error: string | null
  users: User[]
  currentUser: User | null
}

const EditClosingModal = ({ closing, onClose, onSubmit, isLoading, error, users, currentUser }: EditClosingModalProps) => {
  const [form, setForm] = useState({
    ir_id: closing.ir_id,
    closing_date: closing.closing_date || '',
    status: closing.status,
    remarks: closing.remarks || '',
  })

  const isAdmin = currentUser?.role === 'admin'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      closing_date: form.closing_date || null,
      status: form.status,
      remarks: form.remarks || null,
    }
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Closing</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label className="label">Closing Date</label>
              <input
                type="date"
                value={form.closing_date}
                onChange={(e) => setForm({ ...form, closing_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Status *</label>
              <select
                required
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
              >
                <option value="">Select Status</option>
                <option value="done">Done</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
            {isAdmin && (
              <div>
                <label className="label">IR ID</label>
                <select
                  value={form.ir_id}
                  onChange={(e) => setForm({ ...form, ir_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select IR</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.ir_id}>
                      {u.name} ({u.ir_id})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
  info?: Info
  onCancel: () => void
  onConfirm: () => void
  isLoading: boolean
  error: string | null
}

const DeleteConfirmModal = ({ info, onCancel, onConfirm, isLoading, error }: DeleteConfirmModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-red-600">Delete Closing</h3>
        </div>
        <div className="card-content space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete closing for <strong>{info?.prospect_name}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="card-footer flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading} className="btn-danger">
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
