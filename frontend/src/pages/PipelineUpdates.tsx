import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import type { User, Info, Plan, Invite } from '../types/auth'
import { ChevronDown, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface ListResponse {
  data: Plan[]
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

interface InviteListResponse {
  data: Invite[]
  total: number
  page: number
  limit: number
}


type DateRange = 'today' | 'week' | 'month' | 'custom'

export const PipelineUpdates = () => {
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const [selectedOwnerIrId, setSelectedOwnerIrId] = useState<string>('')
  const [ownerSearchInput, setOwnerSearchInput] = useState('')
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

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

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (dateRange) {
      case 'today':
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
        }
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(weekStart.getDate() - today.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        return {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
        }
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        return {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: monthEnd.toISOString().split('T')[0],
        }
      case 'custom':
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        }
      default:
        return { startDate: '', endDate: '' }
    }
  }

  const dateParams = getDateRange()

  const { data: allUsers } = useQuery({
    queryKey: ['users-for-pipeline'],
    queryFn: async () => {
      const res = await api.get<UserListResponse>('/users', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const { data: allInfos } = useQuery({
    queryKey: ['infos-for-pipeline'],
    queryFn: async () => {
      const res = await api.get<InfoListResponse>('/infos', {
        params: { limit: 1000 },
      })
      return res.data.data
    },
  })

  const { data: allInvites } = useQuery({
    queryKey: ['invites-for-pipeline'],
    queryFn: async () => {
      const res = await api.get<InviteListResponse>('/invites', {
        params: { limit: 1000 },
      })
      return res.data.data
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

  const getOwnersForSelector = useMemo(() => {
    if (!allUsers || !currentUser) return []
    if (currentUser.role === 'admin') return allUsers
    return allUsers.filter((u) => u.id === currentUser.id || isDownline(u))
  }, [allUsers, currentUser])

  const filteredOwners = useMemo(() => {
    if (!ownerSearchInput) return getOwnersForSelector
    return getOwnersForSelector.filter(
      (u) => u.name.toLowerCase().includes(ownerSearchInput.toLowerCase()) || u.ir_id.includes(ownerSearchInput)
    )
  }, [getOwnersForSelector, ownerSearchInput])

  const selectedOwner = useMemo(() => {
    if (!selectedOwnerIrId) return null
    return getOwnersForSelector.find((u) => u.ir_id === selectedOwnerIrId)
  }, [selectedOwnerIrId, getOwnersForSelector])

  const handleOwnerSelect = (irId: string) => {
    setSelectedOwnerIrId(irId)
    setPage(1)
    setShowOwnerDropdown(false)
    setOwnerSearchInput('')
  }

  const getAccessibleHierarchy = useMemo(() => {
    if (!selectedOwnerIrId || !allUsers) return new Set<string>()
    const result = new Set<string>()
    result.add(selectedOwnerIrId)

    const addDownlines = (userId: string) => {
      allUsers.forEach((u) => {
        if (u.upline_id === userId && u.id !== currentUser?.id) {
          const userIrId = u.ir_id
          result.add(userIrId)
          addDownlines(u.id)
        }
      })
    }

    const rootUser = allUsers.find((u) => u.ir_id === selectedOwnerIrId)
    if (rootUser) {
      addDownlines(rootUser.id)
    }

    return result
  }, [selectedOwnerIrId, allUsers, currentUser])

  const { data: tentativePlans, isLoading: tentativeLoading } = useQuery({
    queryKey: ['plans-tentative', selectedOwnerIrId, dateParams],
    queryFn: async () => {
      if (!selectedOwnerIrId) return { data: [] }
      const params: any = {
        page: 1,
        limit: 1000,
        pipeline_status: 'tentative',
      }
      if (dateParams.startDate) params.start_date = dateParams.startDate
      if (dateParams.endDate) params.end_date = dateParams.endDate

      const res = await api.get<ListResponse>('/plans', { params })
      return res.data
    },
    enabled: !!selectedOwnerIrId,
  })

  const { data: strongPlans, isLoading: strongLoading } = useQuery({
    queryKey: ['plans-strong', selectedOwnerIrId, dateParams],
    queryFn: async () => {
      if (!selectedOwnerIrId) return { data: [] }
      const params: any = {
        page: 1,
        limit: 1000,
        pipeline_status: 'strong',
      }
      if (dateParams.startDate) params.start_date = dateParams.startDate
      if (dateParams.endDate) params.end_date = dateParams.endDate

      const res = await api.get<ListResponse>('/plans', { params })
      return res.data
    },
    enabled: !!selectedOwnerIrId,
  })

  const { data: sureshottPlans, isLoading: sureshottLoading } = useQuery({
    queryKey: ['plans-sureshot', selectedOwnerIrId, dateParams],
    queryFn: async () => {
      if (!selectedOwnerIrId) return { data: [] }
      const params: any = {
        page: 1,
        limit: 1000,
        pipeline_status: 'sureshot',
      }
      if (dateParams.startDate) params.start_date = dateParams.startDate
      if (dateParams.endDate) params.end_date = dateParams.endDate

      const res = await api.get<ListResponse>('/plans', { params })
      return res.data
    },
    enabled: !!selectedOwnerIrId,
  })

  const summarizeHierarchyPlans = (plans: Plan[]) => {
    if (!selectedOwner || !allUsers) return { plans: [], totalUV: 0, count: 0 }

    const hierarchyIRs = getAccessibleHierarchy
    const filtered = plans.filter((p) => hierarchyIRs.has(p.ir_id))
    const totalUV = filtered.reduce((sum, p) => sum + (p.expected_uvs || 0), 0)

    return { plans: filtered, totalUV, count: filtered.length }
  }

  const tentativeData = summarizeHierarchyPlans(tentativePlans?.data || [])
  const strongData = summarizeHierarchyPlans(strongPlans?.data || [])
  const sureshottData = summarizeHierarchyPlans(sureshottPlans?.data || [])

  const isLoading = tentativeLoading || strongLoading || sureshottLoading

  const paginatedPlans = useMemo(() => {
    const allPlans = [...tentativeData.plans, ...strongData.plans, ...sureshottData.plans]
    const offset = (page - 1) * limit
    return allPlans.slice(offset, offset + limit)
  }, [tentativeData.plans, strongData.plans, sureshottData.plans, page, limit])

  const totalPlans = tentativeData.plans.length + strongData.plans.length + sureshottData.plans.length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Pipeline Updates</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">View pipeline metrics and details</p>
        </div>

        <div className="card">
          <div className="card-content border-b border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="label text-sm">Select User</label>
              <div className="relative" ref={ownerDropdownRef}>
                <button
                  onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-left flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="text-slate-900 dark:text-white">
                    {selectedOwner ? `${selectedOwner.name} (${selectedOwner.ir_id})` : 'Select user'}
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
                    {filteredOwners.map((owner) => (
                      <button
                        key={owner.ir_id}
                        onClick={() => handleOwnerSelect(owner.ir_id)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-t border-slate-100 ${selectedOwnerIrId === owner.ir_id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-900 dark:text-white'}`}
                      >
                        <div className="font-medium">
                          {owner.name}
                          {owner.id === currentUser?.id && ' (Me)'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">{owner.ir_id}</div>
                      </button>
                    ))}
                    {filteredOwners.length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-500 text-center">No users found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="label text-sm">Date Range</label>
              <div className="flex flex-wrap gap-2">
                {['today', 'week', 'month', 'custom'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range as DateRange)}
                    className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                      dateRange === range
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label text-sm">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            )}
          </div>

          {!selectedOwner ? (
            <div className="card-content text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">Select a user to view pipeline data</p>
            </div>
          ) : isLoading ? (
            <div className="card-content flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Tentative</h3>
                  <div className="text-3xl font-bold text-blue-600">{tentativeData.totalUV}</div>
                  <div className="text-xs text-blue-700 mt-2">{tentativeData.count} Plans</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-amber-900 mb-1">Strong</h3>
                  <div className="text-3xl font-bold text-amber-600">{strongData.totalUV}</div>
                  <div className="text-xs text-amber-700 mt-2">{strongData.count} Plans</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-green-900 mb-1">Sureshot</h3>
                  <div className="text-3xl font-bold text-green-600">{sureshottData.totalUV}</div>
                  <div className="text-xs text-green-700 mt-2">{sureshottData.count} Plans</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Sl. No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">IR Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Prospect Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Expected UVs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedPlans.map((plan, idx) => {
                      const invite = allInvites?.find((i) => i.id === plan.invite_id)
                      const info = allInfos?.find((i) => i.id === invite?.info_id)
                      const owner = allUsers?.find((u) => u.ir_id === plan.ir_id)
                      return (
                        <tr key={plan.id} className="hover:bg-slate-50 dark:bg-slate-800">
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{(page - 1) * limit + idx + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{owner?.name || plan.ir_id}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{info?.prospect_name || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.expected_uvs || 'NA'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.pipeline_status}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.remarks || 'NA'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPlans > limit && (
                <div className="card-footer flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalPlans)} of {totalPlans}
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
                      onClick={() => setPage((p) => (p * limit < totalPlans ? p + 1 : p))}
                      disabled={page * limit >= totalPlans}
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
    </DashboardLayout>
  )
}
