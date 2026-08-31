import { useState, useEffect, useMemo } from 'react'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { User, Download } from 'lucide-react'
import type { User as UserType } from '../types/auth'

interface ActivityCounts {
  infos: number
  invites: number
  plans: number
  closings: number
  fg_invites: number
  feel_goods: number
  done: number
  kiv: number
}

interface PipelineSummary {
  tentative_uv: number
  strong_uv: number
  sureshot_uv: number
  total_uv: number
}

interface PipelineDetail {
  sl_no: number
  ir_name: string
  prospect_name: string
  expected_uvs: number
  remarks: string
}

interface IndividualReport {
  user_id: string
  user_name: string
  activity_counts: ActivityCounts
  pipeline_summary: PipelineSummary
  tentative_details: PipelineDetail[]
  strong_details: PipelineDetail[]
  sureshot_details: PipelineDetail[]
}

interface VerticalSummary {
  vertical_root: string
  user_name: string
  activity_counts: ActivityCounts
  pipeline_summary: PipelineSummary
}

interface VerticalPipeline {
  vertical_root: string
  tentative_details: PipelineDetail[]
  strong_details: PipelineDetail[]
  sureshot_details: PipelineDetail[]
}

interface TeamReport {
  start_date: string
  end_date: string
  verticals: VerticalSummary[]
  pipeline_details: VerticalPipeline[]
}

export const Reports = () => {
  const { user: currentUser } = useAuth()
  const [mode, setMode] = useState<'individual' | 'team'>('individual')
  const [allUsers, setAllUsers] = useState<UserType[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [datePreset, setDatePreset] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string>('')
  const [individualReport, setIndividualReport] = useState<IndividualReport | null>(null)
  const [teamReport, setTeamReport] = useState<TeamReport | null>(null)

  useEffect(() => {
    loadUsers()
    setDefaultDates()
  }, [])

  useEffect(() => {
    updateDatesFromPreset(datePreset)
  }, [datePreset])

  const loadUsers = async () => {
    try {
      const response = await api.get<{ data: UserType[]; total: number; page: number; limit: number }>('/users?limit=1000')
      setAllUsers(response.data.data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  // Build list of downlines for the current user
  const downlines = useMemo(() => {
    if (!allUsers || !currentUser) return new Set<string>()
    const result = new Set<string>()
    const buildMap = (userId: string) => {
      allUsers.forEach((u: UserType) => {
        if (u.upline_id === userId) {
          result.add(u.id)
          buildMap(u.id)
        }
      })
    }
    buildMap(currentUser.id)
    return result
  }, [allUsers, currentUser])

  // Filter users based on current user's authorization
  const accessibleUsers = useMemo(() => {
    if (!allUsers || !currentUser) return []

    if (currentUser.role === 'admin') {
      // Admin can access all users
      return allUsers
    }

    // Non-admin can access self + downlines
    return allUsers.filter((u) => u.id === currentUser.id || downlines.has(u.id))
  }, [allUsers, currentUser, downlines])

  const setDefaultDates = () => {
    const today = new Date()
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    setStartDate(formatDate(monthAgo))
    setEndDate(formatDate(today))
  }

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const updateDatesFromPreset = (preset: string) => {
    const today = new Date()
    let start = new Date()

    if (preset === 'today') {
      start = new Date(today)
    } else if (preset === 'week') {
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (preset === 'month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    }

    setStartDate(formatDate(start))
    setEndDate(formatDate(today))
  }

  const handleFetchIndividual = async () => {
    if (!selectedUser || !startDate || !endDate) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post<IndividualReport>('/reports/individual', {
        user_id: selectedUser,
        start_date: startDate,
        end_date: endDate,
      })
      setIndividualReport(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch report')
      setIndividualReport(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchTeam = async () => {
    if (selectedVerticals.length === 0 || !startDate || !endDate) {
      setError('Please select at least one vertical and fill in dates')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post<TeamReport>('/reports/team', {
        vertical_roots: selectedVerticals,
        start_date: startDate,
        end_date: endDate,
      })
      setTeamReport(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch report')
      setTeamReport(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleVertical = (irID: string) => {
    setSelectedVerticals(prev =>
      prev.includes(irID)
        ? prev.filter(id => id !== irID)
        : [...prev, irID]
    )
  }

  const downloadFile = (data: Blob, filename: string) => {
    const url = window.URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const generateDateString = () => {
    return new Date().toISOString().split('T')[0]
  }

  const handleExportIndividual = async (format: 'excel' | 'csv' | 'pdf') => {
    if (!individualReport) return

    setExportLoading(format)
    setExportError('')

    try {
      const response = await api.post(
        `/reports/individual/export/${format}`,
        {
          user_id: selectedUser,
          start_date: startDate,
          end_date: endDate,
        },
        { responseType: 'blob' }
      )

      const filename = `individual-report-${generateDateString()}.${format === 'excel' ? 'xlsx' : format}`
      downloadFile(response.data, filename)
    } catch (err: any) {
      setExportError(err.response?.data?.error || `Failed to export ${format}`)
    } finally {
      setExportLoading(null)
    }
  }

  const handleExportTeam = async (format: 'excel' | 'csv' | 'pdf') => {
    if (!teamReport) return

    setExportLoading(format)
    setExportError('')

    try {
      const response = await api.post(
        `/reports/team/export/${format}`,
        {
          vertical_roots: selectedVerticals,
          start_date: startDate,
          end_date: endDate,
        },
        { responseType: 'blob' }
      )

      const filename = `team-report-${generateDateString()}.${format === 'excel' ? 'xlsx' : format}`
      downloadFile(response.data, filename)
    } catch (err: any) {
      setExportError(err.response?.data?.error || `Failed to export ${format}`)
    } finally {
      setExportLoading(null)
    }
  }

  const SummaryCard = ({ label, value }: { label: string; value: number | string }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )

  const ExportButtons = ({ onExport }: { onExport: (format: 'excel' | 'csv' | 'pdf') => void }) => (
    <div className="flex gap-2 flex-wrap">
      {(['excel', 'csv', 'pdf'] as const).map(format => (
        <button
          key={format}
          onClick={() => onExport(format)}
          disabled={exportLoading !== null}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors text-sm flex items-center gap-2"
        >
          <Download size={16} />
          {exportLoading === format ? 'Exporting...' : `${format.toUpperCase()}`}
        </button>
      ))}
    </div>
  )

  const PipelineTable = ({ details, title }: { details: PipelineDetail[]; title: string }) => (
    <div className="mt-6">
      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-2 text-left font-semibold">Sl. No.</th>
              <th className="px-4 py-2 text-left font-semibold">IR Name</th>
              <th className="px-4 py-2 text-left font-semibold">Prospect Name</th>
              <th className="px-4 py-2 text-right font-semibold">Expected UVs</th>
              <th className="px-4 py-2 text-left font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {details.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center text-slate-500 dark:text-slate-500">
                  No data
                </td>
              </tr>
            ) : (
              details.map((detail, idx) => (
                <tr key={idx} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800">
                  <td className="px-4 py-2">{detail.sl_no}</td>
                  <td className="px-4 py-2">{detail.ir_name}</td>
                  <td className="px-4 py-2">{detail.prospect_name}</td>
                  <td className="px-4 py-2 text-right font-medium">{detail.expected_uvs}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{detail.remarks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {details.length > 0 && (
        <div className="mt-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
          Total UV: {details.reduce((sum, d) => sum + d.expected_uvs, 0).toFixed(2)}
        </div>
      )}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Reports</h1>
          <p className="text-slate-600 dark:text-slate-400">View activity and pipeline reports</p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('individual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'individual'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setMode('team')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'team'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800'
            }`}
          >
            Team
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Date Preset */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date Range</label>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* User/Vertical Selector */}
            {mode === 'individual' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a user...</option>
                  {accessibleUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.ir_id})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Verticals</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg p-3">
                  {accessibleUsers.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-500">No users available</p>
                  ) : (
                    accessibleUsers.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVerticals.includes(user.ir_id)}
                          onChange={() => toggleVertical(user.ir_id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{user.name} ({user.ir_id})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Fetch Button */}
          <button
            onClick={mode === 'individual' ? handleFetchIndividual : handleFetchTeam}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>

        {/* Individual Report */}
        {mode === 'individual' && individualReport && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User size={24} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{individualReport.user_name}</h2>
                </div>
                <ExportButtons onExport={handleExportIndividual} />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {startDate} to {endDate}
              </p>
              {exportError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {exportError}
                </div>
              )}
            </div>

            {/* Activity Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Activity Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Infos" value={individualReport.activity_counts.infos} />
                <SummaryCard label="Invites" value={individualReport.activity_counts.invites} />
                <SummaryCard label="Plans" value={individualReport.activity_counts.plans} />
                <SummaryCard label="Closings" value={individualReport.activity_counts.closings} />
                <SummaryCard label="FG Invites" value={individualReport.activity_counts.fg_invites} />
                <SummaryCard label="Feel Goods" value={individualReport.activity_counts.feel_goods} />
                <SummaryCard label="Done" value={individualReport.activity_counts.done} />
                <SummaryCard label="KIV" value={individualReport.activity_counts.kiv} />
              </div>
            </div>

            {/* Pipeline Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pipeline Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                  label="Tentative UV"
                  value={individualReport.pipeline_summary.tentative_uv.toFixed(2)}
                />
                <SummaryCard
                  label="Strong UV"
                  value={individualReport.pipeline_summary.strong_uv.toFixed(2)}
                />
                <SummaryCard
                  label="Sureshot UV"
                  value={individualReport.pipeline_summary.sureshot_uv.toFixed(2)}
                />
                <SummaryCard
                  label="Total Pipeline UV"
                  value={individualReport.pipeline_summary.total_uv.toFixed(2)}
                />
              </div>
            </div>

            {/* Pipeline Details */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pipeline Details</h3>
              <PipelineTable details={individualReport.tentative_details} title="Tentative" />
              <PipelineTable details={individualReport.strong_details} title="Strong" />
              <PipelineTable details={individualReport.sureshot_details} title="Sureshot" />
            </div>
          </div>
        )}

        {/* Team Report */}
        {mode === 'team' && teamReport && (
          <div className="space-y-6">
            {/* Team Report Export */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Export Team Report</h3>
              <div className="flex items-center justify-between">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {teamReport.start_date} to {teamReport.end_date}
                </p>
                <ExportButtons onExport={handleExportTeam} />
              </div>
              {exportError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {exportError}
                </div>
              )}
            </div>

            {teamReport.verticals.map((vertical, idx) => (
              <div key={idx}>
                {/* Vertical Header */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User size={24} className="text-blue-600" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Vertical: {vertical.user_name}
                    </h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {teamReport.start_date} to {teamReport.end_date}
                  </p>
                </div>

                {/* Activity Summary */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Activity Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard label="Infos" value={vertical.activity_counts.infos} />
                    <SummaryCard label="Invites" value={vertical.activity_counts.invites} />
                    <SummaryCard label="Plans" value={vertical.activity_counts.plans} />
                    <SummaryCard label="Closings" value={vertical.activity_counts.closings} />
                    <SummaryCard label="FG Invites" value={vertical.activity_counts.fg_invites} />
                    <SummaryCard label="Feel Goods" value={vertical.activity_counts.feel_goods} />
                    <SummaryCard label="Done" value={vertical.activity_counts.done} />
                    <SummaryCard label="KIV" value={vertical.activity_counts.kiv} />
                  </div>
                </div>

                {/* Pipeline Summary */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pipeline Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard
                      label="Tentative UV"
                      value={vertical.pipeline_summary.tentative_uv.toFixed(2)}
                    />
                    <SummaryCard
                      label="Strong UV"
                      value={vertical.pipeline_summary.strong_uv.toFixed(2)}
                    />
                    <SummaryCard
                      label="Sureshot UV"
                      value={vertical.pipeline_summary.sureshot_uv.toFixed(2)}
                    />
                    <SummaryCard
                      label="Total Pipeline UV"
                      value={vertical.pipeline_summary.total_uv.toFixed(2)}
                    />
                  </div>
                </div>

                {/* Pipeline Details */}
                {teamReport.pipeline_details[idx] && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pipeline Details</h3>
                    <PipelineTable
                      details={teamReport.pipeline_details[idx].tentative_details}
                      title="Tentative"
                    />
                    <PipelineTable
                      details={teamReport.pipeline_details[idx].strong_details}
                      title="Strong"
                    />
                    <PipelineTable
                      details={teamReport.pipeline_details[idx].sureshot_details}
                      title="Sureshot"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
