import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import { getErrorMessage } from '../services/errors'
import type { User, Info } from '../types/auth'
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, Eye, ChevronDown } from 'lucide-react'

interface ListResponse {
  data: Info[]
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

export const Infos = () => {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedOwnerIrId, setSelectedOwnerIrId] = useState<string | 'all'>('all')
  const [ownerSearchInput, setOwnerSearchInput] = useState('')
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingInfo, setEditingInfo] = useState<Info | null>(null)
  const [viewingInfo, setViewingInfo] = useState<Info | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Info | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
    queryKey: ['infos', page, search, selectedOwnerIrId],
    queryFn: async () => {
      const params: any = { page, limit, search: search || undefined }
      if (selectedOwnerIrId !== 'all') {
        params.ir_id = selectedOwnerIrId
      }
      const res = await api.get<ListResponse>('/infos', { params })
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

  const createMutation = useMutation({
    mutationFn: async (req: any) => {
      const res = await api.post<Info>('/infos', req)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infos'] })
      setIsCreateOpen(false)
      setCreateError(null)
    },
    onError: (error) => {
      setCreateError(getErrorMessage(error))
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (req: any) => {
      const res = await api.put<Info>(`/infos/${editingInfo!.id}`, req)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infos'] })
      setEditingInfo(null)
      setUpdateError(null)
    },
    onError: (error) => {
      setUpdateError(getErrorMessage(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/infos/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infos'] })
      setDeleteConfirm(null)
      setDeleteError(null)
    },
    onError: (error) => {
      setDeleteError(getErrorMessage(error))
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

  const getUsersForIRSelector = useMemo(() => {
    if (!allUsers || !currentUser) return []
    if (currentUser.role === 'admin') return allUsers
    return allUsers.filter((u) => u.id === currentUser.id || isDownline(u))
  }, [allUsers, currentUser])

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

  const canCreateInfo = !!currentUser
  const canEditInfo = (info: Info) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true
    const owner = allUsers?.find((u) => u.ir_id === info.ir_id)
    if (!owner) return false
    return owner.id === currentUser.id || downlines.has(owner.id)
  }
  const canDeleteInfo = (info: Info) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true
    const owner = allUsers?.find((u) => u.ir_id === info.ir_id)
    if (!owner) return false
    return owner.id === currentUser.id || downlines.has(owner.id)
  }

  const visibleInfos = useMemo(() => {
    if (!data || !currentUser || !allUsers) return data?.data || []
    if (currentUser.role === 'admin') return data.data
    const accessibleIRs = new Set<string>()
    accessibleIRs.add(currentUser.ir_id)
    downlines.forEach((userId) => {
      const user = allUsers.find((u) => u.id === userId)
      if (user) accessibleIRs.add(user.ir_id)
    })
    return data.data.filter((info) => accessibleIRs.has(info.ir_id))
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
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Infos</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Manage prospect information</p>
          </div>
          {canCreateInfo && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary gap-2"
            >
              <Plus size={20} />
              <span>Add Info</span>
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
              <span>Failed to load infos</span>
            </div>
          )}

          {isLoading ? (
            <div className="card-content flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : visibleInfos.length === 0 ? (
            <div className="card-content text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No infos found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Prospect Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Response</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">IR ID</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleInfos.map((info) => (
                      <tr key={info.id} className="hover:bg-slate-50 dark:bg-slate-800">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{info.prospect_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{info.phone || 'NA'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{info.response || 'NA'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{info.status || 'NA'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{info.ir_id}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setViewingInfo(info)}
                              className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                              title="View info"
                            >
                              <Eye size={18} />
                            </button>
                            {canEditInfo(info) && (
                              <button
                                onClick={() => setEditingInfo(info)}
                                className="p-2 hover:bg-blue-50 rounded text-blue-600"
                                title="Edit info"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {canDeleteInfo(info) && (
                              <button
                                onClick={() => setDeleteConfirm(info)}
                                className="p-2 hover:bg-red-50 rounded text-red-600"
                                title="Delete info"
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
        <CreateInfoModal
          onClose={() => {
            setIsCreateOpen(false)
            setCreateError(null)
          }}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createError}
          users={getUsersForIRSelector}
          currentUser={currentUser}
        />
      )}

      {viewingInfo && (
        <ViewInfoModal
          info={viewingInfo}
          onClose={() => setViewingInfo(null)}
        />
      )}

      {editingInfo && (
        <EditInfoModal
          info={editingInfo}
          onClose={() => {
            setEditingInfo(null)
            setUpdateError(null)
          }}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
          error={updateError}
          users={getUsersForIRSelector}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          info={deleteConfirm}
          onCancel={() => {
            setDeleteConfirm(null)
            setDeleteError(null)
          }}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          isLoading={deleteMutation.isPending}
          error={deleteError}
        />
      )}
    </DashboardLayout>
  )
}

interface ViewInfoModalProps {
  info: Info
  onClose: () => void
}

const ViewInfoModal = ({ info, onClose }: ViewInfoModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Info Details</h3>
        </div>
        <div className="card-content space-y-4">
          <div>
            <label className="label">Prospect Name</label>
            <p className="text-slate-700 dark:text-slate-300">{info.prospect_name}</p>
          </div>
          <div>
            <label className="label">Phone</label>
            <p className="text-slate-700 dark:text-slate-300">{info.phone || 'NA'}</p>
          </div>
          <div>
            <label className="label">Response</label>
            <p className="text-slate-700 dark:text-slate-300">{info.response || 'NA'}</p>
          </div>
          <div>
            <label className="label">Status</label>
            <p className="text-slate-700 dark:text-slate-300">{info.status || 'NA'}</p>
          </div>
          <div>
            <label className="label">Remarks</label>
            <p className="text-slate-700 dark:text-slate-300">{info.remarks || 'NA'}</p>
          </div>
          <div>
            <label className="label">IR ID</label>
            <p className="text-slate-700 dark:text-slate-300">{info.ir_id}</p>
          </div>
          {info.created_at && (
            <div>
              <label className="label">Created</label>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{new Date(info.created_at).toLocaleString()}</p>
            </div>
          )}
          {info.updated_at && (
            <div>
              <label className="label">Updated</label>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{new Date(info.updated_at).toLocaleString()}</p>
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

interface CreateInfoModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  error: string | null
  users: User[]
  currentUser: User | null
}

const CreateInfoModal = ({ onClose, onSubmit, isLoading, error, users, currentUser }: CreateInfoModalProps) => {
  const [form, setForm] = useState({
    ir_id: currentUser?.ir_id || '',
    prospect_name: '',
    phone: '',
    response: '',
    status: '',
    remarks: '',
    created_by: currentUser?.id || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...form,
      phone: form.phone || undefined,
      response: form.response || undefined,
      status: form.status || undefined,
      remarks: form.remarks || undefined,
    }
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Info</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
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
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="label">Response</label>
              <select
                value={form.response}
                onChange={(e) => setForm({ ...form, response: e.target.value })}
                className="input"
              >
                <option value="">Select response</option>
                <option value="A">A</option>
                <option value="AB">AB</option>
                <option value="B">B</option>
                <option value="BC">BC</option>
                <option value="C">C</option>
              </select>
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
            <div>
              <label className="label">IR ID *</label>
              <select
                required
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

interface EditInfoModalProps {
  info: Info
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  error: string | null
  users: User[]
}

const EditInfoModal = ({ info, onClose, onSubmit, isLoading, error, users }: EditInfoModalProps) => {
  const [form, setForm] = useState({
    ir_id: info.ir_id,
    prospect_name: info.prospect_name,
    phone: info.phone || '',
    response: info.response || '',
    status: info.status,
    remarks: info.remarks || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...form,
      phone: form.phone || undefined,
      response: form.response || undefined,
      remarks: form.remarks || undefined,
    }
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Info</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label className="label">Prospect Name *</label>
              <input
                type="text"
                required
                value={form.prospect_name}
                onChange={(e) => setForm({ ...form, prospect_name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Response</label>
              <select
                value={form.response}
                onChange={(e) => setForm({ ...form, response: e.target.value })}
                className="input"
              >
                <option value="">Select response</option>
                <option value="A">A</option>
                <option value="AB">AB</option>
                <option value="B">B</option>
                <option value="BC">BC</option>
                <option value="C">C</option>
              </select>
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
  info: Info
  onCancel: () => void
  onConfirm: () => void
  isLoading: boolean
  error: string | null
}

const DeleteConfirmModal = ({ info, onCancel, onConfirm, isLoading, error }: DeleteConfirmModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-red-600">Delete Info</h3>
        </div>
        <div className="card-content space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete info for <strong>{info.prospect_name}</strong>? This action cannot be undone.
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
