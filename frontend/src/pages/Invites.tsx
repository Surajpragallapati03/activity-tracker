import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import type { User, Info, Invite } from '../types/auth'
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, Eye, ChevronDown } from 'lucide-react'

const toApiTime = (time: string) => {
  if (!time) return undefined
  return time.length === 5 ? `${time}:00` : time
}

interface ListResponse {
  data: Invite[]
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

interface InfoListResponse {
  data: Info[]
  total: number
  page: number
  limit: number
}

export const Invites = () => {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedOwnerIrId, setSelectedOwnerIrId] = useState<string | 'all'>('all')
  const [ownerSearchInput, setOwnerSearchInput] = useState('')
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingInvite, setEditingInvite] = useState<Invite | null>(null)
  const [viewingInvite, setViewingInvite] = useState<Invite | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Invite | null>(null)

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
    queryKey: ['invites', page, search, selectedOwnerIrId],
    queryFn: async () => {
      const params: any = { page, limit, search: search || undefined }
      if (selectedOwnerIrId !== 'all') {
        params.ir_id = selectedOwnerIrId
      }
      const res = await api.get<ListResponse>('/invites', { params })
      return res.data
    },
  })

  const { data: allUsers } = useQuery({
    queryKey: ['users-for-ir-selector'],
    queryFn: async () => {
      const res = await api.get<UserListResponse>('/users', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const { data: allInfos } = useQuery({
    queryKey: ['infos-for-invite-selector'],
    queryFn: async () => {
      const res = await api.get<InfoListResponse>('/infos', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (req: any) => {
      const endpoint = req.use_dkd ? '/invites/create-with-dkd' : '/invites'
      const res = await api.post<Invite>(endpoint, req)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      queryClient.invalidateQueries({ queryKey: ['infos-for-invite-selector'] })
      setIsCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (req: any) => {
      const res = await api.put<Invite>(`/invites/${editingInvite!.id}`, req)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      setEditingInvite(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/invites/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
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

  const canCreateInvite = !!currentUser
  const canEditInvite = (invite: Invite) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true
    const owner = allUsers?.find((u) => u.ir_id === invite.ir_id)
    if (!owner) return false
    return owner.id === currentUser.id || downlines.has(owner.id)
  }
  const canDeleteInvite = (invite: Invite) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true
    const owner = allUsers?.find((u) => u.ir_id === invite.ir_id)
    if (!owner) return false
    return owner.id === currentUser.id || downlines.has(owner.id)
  }

  const visibleInvites = useMemo(() => {
    if (!data || !currentUser || !allUsers) return data?.data || []
    if (currentUser.role === 'admin') return data.data
    const accessibleIRs = new Set<string>()
    accessibleIRs.add(currentUser.ir_id)
    downlines.forEach((userId) => {
      const user = allUsers.find((u) => u.id === userId)
      if (user) accessibleIRs.add(user.ir_id)
    })
    return data.data.filter((invite) => accessibleIRs.has(invite.ir_id))
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
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Invites</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Manage prospect invites</p>
          </div>
          {canCreateInvite && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary gap-2"
            >
              <Plus size={20} />
              <span>Add Invite</span>
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
                placeholder="Search by prospect name or phone..."
                value={search}
                onChange={handleSearch}
                className="input"
              />
            </div>
          </div>

          {error && (
            <div className="card-content bg-red-50 text-red-700 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>Failed to load invites</span>
            </div>
          )}

          {isLoading ? (
            <div className="card-content flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : visibleInvites.length === 0 ? (
            <div className="card-content text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No invites found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Prospect Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Meeting Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Meeting Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Remarks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">IR ID</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleInvites.map((invite) => {
                      const info = allInfos?.find((i) => i.id === invite.info_id)
                      return (
                        <tr key={invite.id} className="hover:bg-slate-50 dark:bg-slate-800">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{info?.prospect_name || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{invite.mode || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{invite.meeting_date || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{invite.meeting_time || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{invite.status || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={invite.remarks || ''}>{invite.remarks || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{invite.ir_id}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setViewingInvite(invite)}
                                className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                                title="View invite"
                              >
                                <Eye size={18} />
                              </button>
                              {canEditInvite(invite) && (
                                <button
                                  onClick={() => setEditingInvite(invite)}
                                  className="p-2 hover:bg-blue-50 rounded text-blue-600"
                                  title="Edit invite"
                                >
                                  <Edit2 size={18} />
                                </button>
                              )}
                              {canDeleteInvite(invite) && (
                                <button
                                  onClick={() => setDeleteConfirm(invite)}
                                  className="p-2 hover:bg-red-50 rounded text-red-600"
                                  title="Delete invite"
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
        <CreateInviteModal
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.isError ? 'Failed to create invite' : null}
          users={getOwnersForActivitySelector}
          infos={allInfos || []}
          currentUser={currentUser}
        />
      )}

      {viewingInvite && (
        <ViewInviteModal
          invite={viewingInvite}
          info={allInfos?.find((i) => i.id === viewingInvite.info_id)}
          onClose={() => setViewingInvite(null)}
        />
      )}

      {editingInvite && (
        <EditInviteModal
          invite={editingInvite}
          onClose={() => setEditingInvite(null)}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
          error={updateMutation.isError ? 'Failed to update invite' : null}
          users={getOwnersForActivitySelector}
          infos={allInfos || []}
          currentUser={currentUser}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          info={allInfos?.find((i) => i.id === deleteConfirm.info_id)}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          isLoading={deleteMutation.isPending}
          error={deleteMutation.isError ? 'Failed to delete invite' : null}
        />
      )}
    </DashboardLayout>
  )
}

interface ViewInviteModalProps {
  invite: Invite
  info?: Info
  onClose: () => void
}

const ViewInviteModal = ({ invite, info, onClose }: ViewInviteModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Invite Details</h3>
        </div>
        <div className="card-content space-y-4">
          <div>
            <label className="label">Prospect Name</label>
            <p className="text-slate-700 dark:text-slate-300">{info?.prospect_name || 'NA'}</p>
          </div>
          <div>
            <label className="label">Mode</label>
            <p className="text-slate-700 dark:text-slate-300">{invite.mode || 'NA'}</p>
          </div>
          <div>
            <label className="label">Meeting Date</label>
            <p className="text-slate-700 dark:text-slate-300">{invite.meeting_date || 'NA'}</p>
          </div>
          <div>
            <label className="label">Meeting Time</label>
            <p className="text-slate-700 dark:text-slate-300">{invite.meeting_time || 'NA'}</p>
          </div>
          <div>
            <label className="label">Status</label>
            <p className="text-slate-700 dark:text-slate-300">{invite.status || 'NA'}</p>
          </div>
          <div>
            <label className="label">Remarks</label>
            <p className="text-slate-700 dark:text-slate-300">{invite.remarks || 'NA'}</p>
          </div>
          <div>
            <label className="label">IR ID</label>
            <p className="text-slate-700 dark:text-slate-300">{invite.ir_id}</p>
          </div>
          {invite.created_at && (
            <div>
              <label className="label">Created</label>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{new Date(invite.created_at).toLocaleString()}</p>
            </div>
          )}
          {invite.updated_at && (
            <div>
              <label className="label">Updated</label>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{new Date(invite.updated_at).toLocaleString()}</p>
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

interface CreateInviteModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  error: string | null
  users: User[]
  infos: Info[]
  currentUser: User | null
}

const CreateInviteModal = ({ onClose, onSubmit, isLoading, error, users, infos, currentUser }: CreateInviteModalProps) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(currentUser?.id || '')
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const [ownerSearchInput, setOwnerSearchInput] = useState('')
  const [useDKD, setUseDKD] = useState(false)
  const ownerDropdownRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState({
    info_id: '',
    prospect_name: '',
    phone: '',
    info_status: '',
    meeting_date: '',
    meeting_time: '',
    mode: 'virtual',
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

  const availableInfos = useMemo(() => {
    if (!isOwnerSelected || !selectedOwnerUser) return []
    return (infos || []).filter((info) => info.ir_id === selectedOwnerUser.ir_id)
  }, [isOwnerSelected, selectedOwnerUser, infos])

  const handleOwnerSelect = (userId: string) => {
    setSelectedOwnerId(userId)
    setForm({ ...form, info_id: '', prospect_name: '', phone: '', info_status: '' })
    setShowOwnerDropdown(false)
    setOwnerSearchInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOwnerUser) return

    if (useDKD) {
      if (!form.prospect_name) return
      const submitData = {
        use_dkd: true,
        ir_id: selectedOwnerUser.ir_id,
        prospect_name: form.prospect_name,
        phone: form.phone || null,
        info_status: '',
        mode: form.mode || 'virtual',
        meeting_date: form.meeting_date || undefined,
        meeting_time: toApiTime(form.meeting_time),
        status: form.status,
        remarks: form.remarks || undefined,
      }
      onSubmit(submitData)
    } else {
      if (!form.info_id) return
      const submitData = {
        use_dkd: false,
        ir_id: selectedOwnerUser.ir_id,
        ...form,
        meeting_date: form.meeting_date || undefined,
        meeting_time: toApiTime(form.meeting_time),
        remarks: form.remarks || undefined,
      }
      onSubmit(submitData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Invite</h3>
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use-dkd"
                    checked={useDKD}
                    onChange={(e) => {
                      setUseDKD(e.target.checked)
                      if (e.target.checked) {
                        setForm({ ...form, info_id: '', prospect_name: '', phone: '', info_status: '' })
                      } else {
                        setForm({ ...form, prospect_name: '', phone: '', info_status: '' })
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <label htmlFor="use-dkd" className="label cursor-pointer">
                    Create with DKD (Info + Invite)
                  </label>
                </div>

                {useDKD ? (
                  <>
                    <div>
                      <label className="label">Prospect Name *</label>
                      <input
                        type="text"
                        required
                        value={form.prospect_name}
                        onChange={(e) => setForm({ ...form, prospect_name: e.target.value })}
                        className="input"
                        placeholder="Prospect name"
                      />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="input"
                        placeholder="Phone number"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="label">Info *</label>
                    <select
                      required
                      value={form.info_id}
                      onChange={(e) => setForm({ ...form, info_id: e.target.value })}
                      className="input"
                    >
                      <option value="">Select Info</option>
                      {availableInfos.map((info) => (
                        <option key={info.id} value={info.id}>
                          {info.prospect_name} ({info.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Mode *</label>
                  <select
                    required
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                    className="input"
                  >
                    <option value="virtual">Virtual</option>
                    <option value="physical">Physical</option>
                  </select>
                </div>
                <div>
                  <label className="label">Meeting Date</label>
                  <input
                    type="date"
                    value={form.meeting_date}
                    onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Meeting Time</label>
                  <input
                    type="time"
                    value={form.meeting_time}
                    onChange={(e) => setForm({ ...form, meeting_time: e.target.value })}
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
                    placeholder="Status"
                  />
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

interface EditInviteModalProps {
  invite: Invite
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  error: string | null
  users: User[]
  infos: Info[]
  currentUser: User | null
}

const EditInviteModal = ({ invite, onClose, onSubmit, isLoading, error, users, infos, currentUser }: EditInviteModalProps) => {
  const [form, setForm] = useState({
    ir_id: invite.ir_id,
    info_id: invite.info_id,
    meeting_date: invite.meeting_date || '',
    meeting_time: invite.meeting_time || '',
    mode: invite.mode || 'virtual',
    status: invite.status,
    remarks: invite.remarks || '',
  })

  const isAdmin = currentUser?.role === 'admin'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...form,
      meeting_date: form.meeting_date || undefined,
      meeting_time: toApiTime(form.meeting_time),
      remarks: form.remarks || undefined,
    }
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Invite</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label className="label">Info *</label>
              <select
                required
                value={form.info_id}
                onChange={(e) => setForm({ ...form, info_id: e.target.value })}
                className="input"
              >
                <option value="">Select Info</option>
                {infos?.map((info) => (
                  <option key={info.id} value={info.id}>
                    {info.prospect_name} ({info.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Mode *</label>
              <select
                required
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="input"
              >
                <option value="virtual">Virtual</option>
                <option value="physical">Physical</option>
              </select>
            </div>
            <div>
              <label className="label">Meeting Date</label>
              <input
                type="date"
                value={form.meeting_date}
                onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Meeting Time</label>
              <input
                type="time"
                value={form.meeting_time}
                onChange={(e) => setForm({ ...form, meeting_time: e.target.value })}
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
              />
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
          <h3 className="text-lg font-semibold text-red-600">Delete Invite</h3>
        </div>
        <div className="card-content space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete invite for <strong>{info?.prospect_name}</strong>? This action cannot be undone.
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
