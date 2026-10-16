import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import { getErrorMessage } from '../services/errors'
import type { User, Info, Plan, Invite } from '../types/auth'
import { ChevronDown, Loader2, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { EditPlanModal } from '../components/EditPlanModal'

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
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'individual' | 'team'>('individual')
  const [page, setPage] = useState(1)
  const [selectedOwnerIrId, setSelectedOwnerIrId] = useState<string>('')
  const [ownerSearchInput, setOwnerSearchInput] = useState('')
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

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

  const accessibleUsers = getOwnersForSelector

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

  const toggleVertical = (irID: string) => {
    setSelectedVerticals((prev) =>
      prev.includes(irID) ? prev.filter((id) => id !== irID) : [...prev, irID]
    )
    setPage(1)
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

  const buildHierarchyForVertical = (verticalIrId: string): Set<string> => {
    if (!allUsers) return new Set()
    const result = new Set<string>()
    result.add(verticalIrId)

    const addDownlines = (userId: string) => {
      allUsers.forEach((u) => {
        if (u.upline_id === userId) {
          const userIrId = u.ir_id
          result.add(userIrId)
          addDownlines(u.id)
        }
      })
    }

    const rootUser = allUsers.find((u) => u.ir_id === verticalIrId)
    if (rootUser) {
      addDownlines(rootUser.id)
    }

    return result
  }

  const allTeamHierarchies = useMemo(() => {
    const hierarchies = new Map<string, Set<string>>()
    selectedVerticals.forEach((verticalIrId) => {
      hierarchies.set(verticalIrId, buildHierarchyForVertical(verticalIrId))
    })
    return hierarchies
  }, [selectedVerticals, allUsers])

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
    enabled: !!selectedOwnerIrId && mode === 'individual',
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
    enabled: !!selectedOwnerIrId && mode === 'individual',
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
    enabled: !!selectedOwnerIrId && mode === 'individual',
  })

  const { data: teamTentativePlans, isLoading: teamTentativeLoading } = useQuery({
    queryKey: ['plans-team-tentative', selectedVerticals, dateParams],
    queryFn: async () => {
      if (selectedVerticals.length === 0) return { data: [] }
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
    enabled: selectedVerticals.length > 0 && mode === 'team',
  })

  const { data: teamStrongPlans, isLoading: teamStrongLoading } = useQuery({
    queryKey: ['plans-team-strong', selectedVerticals, dateParams],
    queryFn: async () => {
      if (selectedVerticals.length === 0) return { data: [] }
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
    enabled: selectedVerticals.length > 0 && mode === 'team',
  })

  const { data: teamSureshottPlans, isLoading: teamSureshottLoading } = useQuery({
    queryKey: ['plans-team-sureshot', selectedVerticals, dateParams],
    queryFn: async () => {
      if (selectedVerticals.length === 0) return { data: [] }
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
    enabled: selectedVerticals.length > 0 && mode === 'team',
  })

  const updateMutation = useMutation({
    mutationFn: async (req: any) => {
      const res = await api.put<Plan>(`/plans/${editingPlan!.id}`, req)
      return res.data
    },
    onSuccess: (updatedPlan) => {
      const updateStatusCache = (status: string) => (oldData: ListResponse | undefined) => {
        if (!oldData) return oldData
        const filtered = oldData.data.filter(p => p.id !== updatedPlan.id)
        if (updatedPlan.pipeline_status === status) {
          return { ...oldData, data: [updatedPlan, ...filtered] }
        }
        return { ...oldData, data: filtered, total: Math.max(0, oldData.total - 1) }
      }

      if (mode === 'individual') {
        ;['tentative', 'strong', 'sureshot'].forEach(status => {
          queryClient.setQueryData(
            [`plans-${status}`, selectedOwnerIrId, dateParams],
            updateStatusCache(status)
          )
        })
      } else {
        ;['tentative', 'strong', 'sureshot'].forEach(status => {
          queryClient.setQueryData(
            [`plans-team-${status}`, selectedVerticals, dateParams],
            updateStatusCache(status)
          )
        })
      }

      setEditingPlan(null)
      setUpdateError(null)
    },
    onError: (error) => {
      setUpdateError(getErrorMessage(error))
    },
  })

  const summarizeHierarchyPlans = (plans: Plan[]) => {
    if (!selectedOwner || !allUsers) return { plans: [], totalUV: 0, count: 0 }

    const hierarchyIRs = getAccessibleHierarchy
    const filtered = plans.filter((p) => hierarchyIRs.has(p.ir_id))
    const totalUV = filtered.reduce((sum, p) => sum + (p.expected_uvs || 0), 0)

    return { plans: filtered, totalUV, count: filtered.length }
  }

  interface TeamVerticalData {
    vertical: User
    plans: Plan[]
    tentativeUV: number
    tentativeCount: number
    strongUV: number
    strongCount: number
    sureshottUV: number
    sureshottCount: number
  }

  const getTeamVerticalData = (): TeamVerticalData[] => {
    const results: TeamVerticalData[] = []

    selectedVerticals.forEach((verticalIrId) => {
      const verticalUser = allUsers?.find((u) => u.ir_id === verticalIrId)
      if (!verticalUser) return

      const hierarchy = allTeamHierarchies.get(verticalIrId) || new Set()

      const tentativePlansFiltered = (teamTentativePlans?.data || []).filter((p) =>
        hierarchy.has(p.ir_id)
      )
      const strongPlansFiltered = (teamStrongPlans?.data || []).filter((p) =>
        hierarchy.has(p.ir_id)
      )
      const sureshottPlansFiltered = (teamSureshottPlans?.data || []).filter((p) =>
        hierarchy.has(p.ir_id)
      )

      results.push({
        vertical: verticalUser,
        plans: [...tentativePlansFiltered, ...strongPlansFiltered, ...sureshottPlansFiltered],
        tentativeUV: tentativePlansFiltered.reduce((sum, p) => sum + (p.expected_uvs || 0), 0),
        tentativeCount: tentativePlansFiltered.length,
        strongUV: strongPlansFiltered.reduce((sum, p) => sum + (p.expected_uvs || 0), 0),
        strongCount: strongPlansFiltered.length,
        sureshottUV: sureshottPlansFiltered.reduce((sum, p) => sum + (p.expected_uvs || 0), 0),
        sureshottCount: sureshottPlansFiltered.length,
      })
    })

    return results
  }

  const tentativeData = summarizeHierarchyPlans(tentativePlans?.data || [])
  const strongData = summarizeHierarchyPlans(strongPlans?.data || [])
  const sureshottData = summarizeHierarchyPlans(sureshottPlans?.data || [])

  const isLoading = tentativeLoading || strongLoading || sureshottLoading
  const isTeamLoading = teamTentativeLoading || teamStrongLoading || teamSureshottLoading
  const teamVerticalData = getTeamVerticalData()

  const paginatedPlans = useMemo(() => {
    const allPlans = [...tentativeData.plans, ...strongData.plans, ...sureshottData.plans]
    const offset = (page - 1) * limit
    return allPlans.slice(offset, offset + limit)
  }, [tentativeData.plans, strongData.plans, sureshottData.plans, page, limit])

  const totalPlans = tentativeData.plans.length + strongData.plans.length + sureshottData.plans.length

  const canEditPlan = (plan: Plan) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin') return true
    const owner = allUsers?.find((u) => u.ir_id === plan.ir_id)
    if (!owner) return false
    return owner.id === currentUser.id || downlines.has(owner.id)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Pipeline Updates</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">View pipeline metrics and details</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('individual')
              setPage(1)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'individual'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => {
              setMode('team')
              setPage(1)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'team'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Team
          </button>
        </div>

        <div className="card">
          <div className="card-content border-b border-slate-200 dark:border-slate-700 space-y-4">
            {mode === 'individual' ? (
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
                          className="input text-sm py-1"
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
            ) : (
              <div>
                <label className="label text-sm">Select Verticals</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg p-3">
                  {accessibleUsers.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No users available</p>
                  ) : (
                    accessibleUsers.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVerticals.includes(user.ir_id)}
                          onChange={() => toggleVertical(user.ir_id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-500 accent-blue-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{user.name} ({user.ir_id})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

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

          {mode === 'individual' ? (
            <>
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
                          <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {paginatedPlans.map((plan, idx) => {
                          const invite = allInvites?.find((i) => i.id === plan.invite_id)
                          const info = allInfos?.find((i) => i.id === invite?.info_id)
                          const owner = allUsers?.find((u) => u.ir_id === plan.ir_id)
                          const canEdit = canEditPlan(plan)
                          return (
                            <tr key={plan.id} className="hover:bg-slate-50 dark:bg-slate-800">
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{(page - 1) * limit + idx + 1}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{owner?.name || plan.ir_id}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{info?.prospect_name || 'NA'}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.expected_uvs || 'NA'}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.pipeline_status}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.remarks || 'NA'}</td>
                              <td className="px-6 py-4 text-center">
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setEditingPlan(plan)
                                      setUpdateError(null)
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition"
                                    title="Edit plan"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                )}
                              </td>
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
            </>
          ) : (
            <>
              {selectedVerticals.length === 0 ? (
                <div className="card-content text-center py-12">
                  <p className="text-slate-600 dark:text-slate-400">Select one or more verticals to view pipeline data</p>
                </div>
              ) : isTeamLoading ? (
                <div className="card-content flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  {teamVerticalData.map((verticalData) => (
                    <div key={verticalData.vertical.id}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg col-span-1 md:col-span-3 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {verticalData.vertical.name} ({verticalData.vertical.ir_id})
                          </h3>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                          <h3 className="text-sm font-medium text-blue-900 mb-1">Tentative</h3>
                          <div className="text-3xl font-bold text-blue-600">{verticalData.tentativeUV}</div>
                          <div className="text-xs text-blue-700 mt-2">{verticalData.tentativeCount} Plans</div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg">
                          <h3 className="text-sm font-medium text-amber-900 mb-1">Strong</h3>
                          <div className="text-3xl font-bold text-amber-600">{verticalData.strongUV}</div>
                          <div className="text-xs text-amber-700 mt-2">{verticalData.strongCount} Plans</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                          <h3 className="text-sm font-medium text-green-900 mb-1">Sureshot</h3>
                          <div className="text-3xl font-bold text-green-600">{verticalData.sureshottUV}</div>
                          <div className="text-xs text-green-700 mt-2">{verticalData.sureshottCount} Plans</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Sl. No.</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Vertical</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">IR Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Prospect Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Expected UVs</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Remarks</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          const allTeamPlans: Array<{ plan: Plan; vertical: User }> = []
                          teamVerticalData.forEach((vd) => {
                            vd.plans.forEach((p) => {
                              allTeamPlans.push({ plan: p, vertical: vd.vertical })
                            })
                          })

                          const offset = (page - 1) * limit
                          const paginatedTeamPlans = allTeamPlans.slice(offset, offset + limit)

                          return paginatedTeamPlans.map((item, idx) => {
                            const plan = item.plan
                            const vertical = item.vertical
                            const invite = allInvites?.find((i) => i.id === plan.invite_id)
                            const info = allInfos?.find((i) => i.id === invite?.info_id)
                            const owner = allUsers?.find((u) => u.ir_id === plan.ir_id)
                            const canEdit = canEditPlan(plan)

                            return (
                              <tr key={plan.id} className="hover:bg-slate-50 dark:bg-slate-800">
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{offset + idx + 1}</td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{vertical.name}</td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{owner?.name || plan.ir_id}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{info?.prospect_name || 'NA'}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.expected_uvs || 'NA'}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.pipeline_status}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.remarks || 'NA'}</td>
                                <td className="px-6 py-4 text-center">
                                  {canEdit && (
                                    <button
                                      onClick={() => {
                                        setEditingPlan(plan)
                                        setUpdateError(null)
                                      }}
                                      className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition"
                                      title="Edit plan"
                                    >
                                      <Edit2 size={18} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {(() => {
                    const totalTeamPlans = teamVerticalData.reduce((sum, vd) => sum + vd.plans.length, 0)
                    return totalTeamPlans > limit ? (
                      <div className="card-footer flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalTeamPlans)} of {totalTeamPlans}
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
                            onClick={() => setPage((p) => (p * limit < totalTeamPlans ? p + 1 : p))}
                            disabled={page * limit >= totalTeamPlans}
                            className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    ) : null
                  })()}
                </>
              )}
            </>
          )}
        </div>

        {editingPlan && (
          <EditPlanModal
            plan={editingPlan}
            onClose={() => {
              setEditingPlan(null)
              setUpdateError(null)
            }}
            onSubmit={(data) => updateMutation.mutate(data)}
            isLoading={updateMutation.isPending}
            error={updateError}
            users={allUsers || []}
            currentUser={currentUser}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
