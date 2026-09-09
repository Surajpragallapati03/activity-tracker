import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../layouts/DashboardLayout'
import api from '../services/api'
import type { Info, Invite, Plan, Closing, FGInvite, FeelGood } from '../types/auth'
import { Plus, Save, Loader2, AlertCircle, ChevronDown, Edit2, Trash2, Check, X } from 'lucide-react'

interface DailyUpdateResponse {
  date: string
  infos: Info[]
  invites: Invite[]
  plans: Plan[]
  closings: Closing[]
  fg_invites: FGInvite[]
  feel_goods: FeelGood[]
}

interface ActivityUpdate {
  id: string
  type: string
  action: 'create' | 'update' | 'delete'
  data: Record<string, any>
}

interface DailyUpdateRequest {
  date: string
  infos: ActivityUpdate[]
  invites: ActivityUpdate[]
  plans: ActivityUpdate[]
  closings: ActivityUpdate[]
  fg_invites: ActivityUpdate[]
  feel_goods: ActivityUpdate[]
}

const toApiTime = (time: string) => {
  if (!time) return undefined
  return time.length === 5 ? `${time}:00` : time
}

const fromApiTime = (time: string) => {
  if (!time) return ''
  return time.substring(0, 5)
}

export const DailyUpdates = () => {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [changes, setChanges] = useState<Map<string, ActivityUpdate>>(new Map())
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['infos', 'invites', 'plans', 'closings', 'fg_invites', 'feel_goods']))

  const { data: dailyUpdate, isLoading, error } = useQuery({
    queryKey: ['daily-updates', selectedDate],
    queryFn: async () => {
      const res = await api.get<DailyUpdateResponse>('/daily-updates', {
        params: { date: selectedDate },
      })
      return res.data
    },
  })

  const { data: allInfosRaw } = useQuery({
    queryKey: ['infos-for-selector'],
    queryFn: async () => {
      const res = await api.get<any>('/infos', { params: { limit: 1000 } })
      return res.data.data
    },
  })

  const { data: allInvitesRaw } = useQuery({
    queryKey: ['invites-for-selector'],
    queryFn: async () => {
      const res = await api.get<any>('/invites', { params: { limit: 1000 } })
      return res.data.data
    },
  })

  const { data: allPlansRaw } = useQuery({
    queryKey: ['plans-for-selector'],
    queryFn: async () => {
      const res = await api.get<any>('/plans', { params: { limit: 1000 } })
      return res.data.data
    },
  })

  const { data: allClosingsRaw } = useQuery({
    queryKey: ['closings-for-selector'],
    queryFn: async () => {
      const res = await api.get<any>('/closings', { params: { limit: 1000 } })
      return res.data.data
    },
  })

  const { data: allFGInvitesRaw } = useQuery({
    queryKey: ['fg-invites-for-selector'],
    queryFn: async () => {
      const res = await api.get<any>('/fg-invites', { params: { limit: 1000 } })
      return res.data.data
    },
  })

  const allInfos = allInfosRaw?.filter((i: any) => i.ir_id === currentUser?.ir_id) || []
  const allInvites = allInvitesRaw?.filter((i: any) => i.ir_id === currentUser?.ir_id) || []
  const allPlans = allPlansRaw?.filter((i: any) => i.ir_id === currentUser?.ir_id) || []
  const allClosings = allClosingsRaw?.filter((i: any) => i.ir_id === currentUser?.ir_id) || []
  const allFGInvites = allFGInvitesRaw?.filter((i: any) => i.ir_id === currentUser?.ir_id) || []


  const saveMutation = useMutation({
    mutationFn: async () => {
      const typeToRequestKey: Record<string, keyof DailyUpdateRequest> = {
        'info': 'infos',
        'invite': 'invites',
        'plan': 'plans',
        'closing': 'closings',
        'fg_invite': 'fg_invites',
        'feel_good': 'feel_goods',
      }

      const request: DailyUpdateRequest = {
        date: selectedDate,
        infos: [],
        invites: [],
        plans: [],
        closings: [],
        fg_invites: [],
        feel_goods: [],
      }

      changes.forEach((change) => {
        const typeKey = typeToRequestKey[change.type]
        if (typeKey) {
          ;(request[typeKey] as ActivityUpdate[]).push(change)
        }
      })

      const res = await api.post<DailyUpdateResponse>('/daily-updates', request)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-updates', selectedDate] })
      setChanges(new Map())
      setDeletedIds(new Set())
    },
  })

  const handleActivityChange = (type: string, activityId: string, field: string, value: any) => {
    let key = `${type}-${activityId}`
    let existing = changes.get(key)

    if (!activityId && !existing) {
      for (const [k, v] of changes.entries()) {
        if (v.type === type && !v.id && v.action === 'create') {
          key = k
          existing = v
          break
        }
      }
    }

    if (!existing) {
      existing = {
        id: activityId,
        type,
        action: activityId ? 'update' : 'create',
        data: {},
      }
    }

    existing.data[field] = value
    setChanges(new Map(changes.set(key, existing)))
  }

  const handleDeleteActivity = (type: string, activityId: string) => {
    const key = `${type}-${activityId}`
    const activity = changes.get(key) || {
      id: activityId,
      type,
      action: 'delete' as const,
      data: {},
    }
    activity.action = 'delete'
    const newChanges = new Map(changes)
    newChanges.set(key, activity)
    setChanges(newChanges)

    const newDeleted = new Set(deletedIds)
    newDeleted.add(key)
    setDeletedIds(newDeleted)
  }

  const handleAddActivity = (type: string) => {
    const newId = `new-${type}-${Date.now()}`
    const key = `${type}-${newId}`
    setChanges(new Map(changes.set(key, {
      id: '',
      type,
      action: 'create',
      data: {},
    })))
  }

  const toggleSection = (type: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedSections(newExpanded)
  }

  const getFieldValue = (changeKey: string, field: string, fallback: any = '') => {
    const change = changes.get(changeKey)
    if (change && change.data[field] !== undefined) {
      return change.data[field]
    }
    return fallback
  }

  const renderTable = (
    type: string,
    title: string,
    activities: any[],
    columns: Array<{ key: string; label: string }>,
    renderRow: (activity: any, isEditing: boolean, changeKey: string) => React.ReactNode
  ) => {
    const filteredActivities = activities.filter((a) => {
      const key = `${type}-${a.id}`
      const change = changes.get(key)
      return !change || change.action !== 'delete'
    })
    const newActivityKeys = Array.from(changes.entries()).filter(([, v]) => v.type === type && !v.id && v.action !== 'delete').map(([k]) => k)

    return (
      <section className="mb-6 border rounded-lg dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection(type)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">({filteredActivities.length + newActivityKeys.length})</span>
          </div>
          <ChevronDown size={20} className={`transform transition ${expandedSections.has(type) ? '' : '-rotate-90'}`} />
        </button>

        {expandedSections.has(type) && (
          <div className="border-t dark:border-gray-700">
            {filteredActivities.length === 0 && newActivityKeys.length === 0 ? (
              <div className="p-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No {title.toLowerCase()} for this date</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      {columns.map((col) => (
                        <th key={col.key} className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{col.label}</th>
                      ))}
                      <th className="px-4 py-2 text-center font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((activity) =>
                      renderRow(activity, editingId === `${type}-${activity.id}`, `${type}-${activity.id}`)
                    )}
                    {newActivityKeys.map((key) =>
                      renderRow({}, true, key)
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t dark:border-gray-700 p-3">
              <button
                onClick={() => handleAddActivity(type)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 text-sm rounded"
              >
                <Plus size={16} />
                Add {title.slice(0, -1)}
              </button>
            </div>
          </div>
        )}
      </section>
    )
  }

  if (!currentUser) {
    return <DashboardLayout>Loading...</DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Daily Updates</h1>

        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700 dark:text-red-200">{error instanceof Error ? error.message : 'Error loading data'}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : dailyUpdate ? (
          <>
            {renderTable('infos', 'Infos', dailyUpdate.infos, [
              { key: 'prospect_name', label: 'Prospect Name' },
              { key: 'response', label: 'Response' },
              { key: 'status', label: 'Status' },
              { key: 'phone', label: 'Phone' },
              { key: 'remarks', label: 'Remarks' },
            ], (activity, isEditing, changeKey) => (
              <InfoTableRow
                key={changeKey}
                info={activity}
                isEditing={isEditing}
                onEdit={() => setEditingId(changeKey)}
                onCancel={() => setEditingId(null)}
                onSave={() => setEditingId(null)}
                getFieldValue={(field, fallback) => getFieldValue(changeKey, field, fallback)}
                onFieldChange={(field, value) => handleActivityChange('infos', activity.id, field, value)}
                onDelete={() => handleDeleteActivity('infos', activity.id)}
              />
            ))}
            {renderTable('invites', 'Invites', dailyUpdate.invites, [
              { key: 'prospect', label: 'Prospect' },
              { key: 'mode', label: 'Mode' },
              { key: 'meeting_date', label: 'Meeting Date' },
              { key: 'meeting_time', label: 'Time' },
              { key: 'status', label: 'Status' },
              { key: 'remarks', label: 'Remarks' },
            ], (activity, isEditing, changeKey) => (
              <InviteTableRow
                key={changeKey}
                invite={activity}
                prospects={allInfos}
                isEditing={isEditing}
                defaultMeetingDate={selectedDate}
                getFieldValue={(field, fallback) => getFieldValue(changeKey, field, fallback)}
                onEdit={() => setEditingId(changeKey)}
                onCancel={() => setEditingId(null)}
                onSave={() => setEditingId(null)}
                onFieldChange={(field, value) => handleActivityChange('invites', activity.id, field, value)}
                onDelete={() => handleDeleteActivity('invites', activity.id)}
              />
            ))}
            {renderTable('plans', 'Plans', dailyUpdate.plans, [
              { key: 'prospect', label: 'Prospect' },
              { key: 'ul1', label: 'UL1' },
              { key: 'ul2', label: 'UL2' },
              { key: 'expected_uvs', label: 'UVs' },
              { key: 'status', label: 'Status' },
              { key: 'pipeline_status', label: 'Pipeline' },
            ], (activity, isEditing, changeKey) => (
              <PlanTableRow
                key={changeKey}
                plan={activity}
                invites={allInvites}
                prospects={allInfos}
                isEditing={isEditing}
                getFieldValue={(field, fallback) => getFieldValue(changeKey, field, fallback)}
                onEdit={() => setEditingId(changeKey)}
                onCancel={() => setEditingId(null)}
                onSave={() => setEditingId(null)}
                onFieldChange={(field, value) => handleActivityChange('plans', activity.id, field, value)}
                onDelete={() => handleDeleteActivity('plans', activity.id)}
              />
            ))}
            {renderTable('closings', 'Closings', dailyUpdate.closings, [
              { key: 'prospect', label: 'Prospect' },
              { key: 'closing_date', label: 'Closing Date' },
              { key: 'status', label: 'Status' },
              { key: 'remarks', label: 'Remarks' },
            ], (activity, isEditing, changeKey) => (
              <ClosingTableRow
                key={changeKey}
                closing={activity}
                plans={allPlans}
                invites={allInvites}
                prospects={allInfos}
                isEditing={isEditing}
                defaultClosingDate={selectedDate}
                getFieldValue={(field, fallback) => getFieldValue(changeKey, field, fallback)}
                onEdit={() => setEditingId(changeKey)}
                onCancel={() => setEditingId(null)}
                onSave={() => setEditingId(null)}
                onFieldChange={(field, value) => handleActivityChange('closings', activity.id, field, value)}
                onDelete={() => handleDeleteActivity('closings', activity.id)}
              />
            ))}
            {renderTable('fg_invites', 'FG Invites', dailyUpdate.fg_invites, [
              { key: 'prospect', label: 'Prospect' },
              { key: 'mode', label: 'Mode' },
              { key: 'meeting_date', label: 'Meeting Date' },
              { key: 'meeting_time', label: 'Time' },
              { key: 'status', label: 'Status' },
            ], (activity, isEditing, changeKey) => (
              <FGInviteTableRow
                key={changeKey}
                fgInvite={activity}
                closings={allClosings}
                plans={allPlans}
                invites={allInvites}
                prospects={allInfos}
                isEditing={isEditing}
                defaultMeetingDate={selectedDate}
                getFieldValue={(field, fallback) => getFieldValue(changeKey, field, fallback)}
                onEdit={() => setEditingId(changeKey)}
                onCancel={() => setEditingId(null)}
                onSave={() => setEditingId(null)}
                onFieldChange={(field, value) => handleActivityChange('fg_invites', activity.id, field, value)}
                onDelete={() => handleDeleteActivity('fg_invites', activity.id)}
              />
            ))}
            {renderTable('feel_goods', 'Feel Goods', dailyUpdate.feel_goods, [
              { key: 'prospect', label: 'Prospect' },
              { key: 'ul1', label: 'UL1' },
              { key: 'ul2', label: 'UL2' },
              { key: 'status', label: 'Status' },
              { key: 'remarks', label: 'Remarks' },
            ], (activity, isEditing, changeKey) => (
              <FeelGoodTableRow
                key={changeKey}
                feelGood={activity}
                fgInvites={allFGInvites}
                closings={allClosings}
                plans={allPlans}
                invites={allInvites}
                prospects={allInfos}
                isEditing={isEditing}
                getFieldValue={(field, fallback) => getFieldValue(changeKey, field, fallback)}
                onEdit={() => setEditingId(changeKey)}
                onCancel={() => setEditingId(null)}
                onSave={() => setEditingId(null)}
                onFieldChange={(field, value) => handleActivityChange('feel_goods', activity.id, field, value)}
                onDelete={() => handleDeleteActivity('feel_goods', activity.id)}
              />
            ))}

            {(changes.size > 0 || deletedIds.size > 0) && (
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setChanges(new Map())
                    setDeletedIds(new Set())
                    queryClient.invalidateQueries({ queryKey: ['daily-updates', selectedDate] })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
                >
                  {saveMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Save Daily Updates
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

// Table Row Components

interface InfoTableRowProps {
  info: Info
  isEditing: boolean
  getFieldValue: (field: string, fallback?: any) => any
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onFieldChange: (field: string, value: any) => void
  onDelete: () => void
}

const InfoTableRow = ({ info, isEditing, getFieldValue, onEdit, onCancel, onSave, onFieldChange, onDelete }: InfoTableRowProps) => {
  if (isEditing) {
    return (
      <tr className="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('prospect_name', '')}
            onChange={(e) => onFieldChange('prospect_name', e.target.value)}
            placeholder="Prospect Name *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={getFieldValue('response', '')}
            onChange={(e) => onFieldChange('response', e.target.value || null)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="">—</option>
            <option value="A">A</option>
            <option value="AB">AB</option>
            <option value="B">B</option>
            <option value="BC">BC</option>
            <option value="C">C</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('status', '')}
            onChange={(e) => onFieldChange('status', e.target.value)}
            placeholder="Status *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('phone', '')}
            onChange={(e) => onFieldChange('phone', e.target.value || null)}
            placeholder="Phone"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('remarks', '')}
            onChange={(e) => onFieldChange('remarks', e.target.value || null)}
            placeholder="Remarks"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onSave}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm">{info.prospect_name}</td>
      <td className="px-4 py-3 text-sm">{info.response || '—'}</td>
      <td className="px-4 py-3 text-sm">{info.status}</td>
      <td className="px-4 py-3 text-sm">{info.phone || '—'}</td>
      <td className="px-4 py-3 text-sm">{info.remarks || '—'}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface InviteTableRowProps {
  invite: Invite
  prospects: Info[]
  isEditing: boolean
  defaultMeetingDate?: string
  getFieldValue: (field: string, fallback?: any) => any
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onFieldChange: (field: string, value: any) => void
  onDelete: () => void
}

const InviteTableRow = ({ invite, prospects, isEditing, defaultMeetingDate, getFieldValue, onEdit, onCancel, onSave, onFieldChange, onDelete }: InviteTableRowProps) => {
  const prospectName = prospects.find((p) => p.id === invite.info_id)?.prospect_name || '—'

  if (isEditing) {
    return (
      <tr className="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
        <td className="px-4 py-3">
          <select
            value={getFieldValue('info_id', '')}
            onChange={(e) => onFieldChange('info_id', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="">Select Prospect *</option>
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.prospect_name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <select
            value={getFieldValue('mode', 'virtual')}
            onChange={(e) => onFieldChange('mode', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="virtual">Virtual</option>
            <option value="physical">Physical</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="date"
            value={getFieldValue('meeting_date', defaultMeetingDate || '')}
            onChange={(e) => onFieldChange('meeting_date', e.target.value || null)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="time"
            value={fromApiTime(getFieldValue('meeting_time', ''))}
            onChange={(e) => onFieldChange('meeting_time', toApiTime(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('status', '')}
            onChange={(e) => onFieldChange('status', e.target.value)}
            placeholder="Status *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('remarks', '')}
            onChange={(e) => onFieldChange('remarks', e.target.value || null)}
            placeholder="Remarks"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onSave}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm">{prospectName}</td>
      <td className="px-4 py-3 text-sm">{invite.mode || '—'}</td>
      <td className="px-4 py-3 text-sm">{invite.meeting_date || '—'}</td>
      <td className="px-4 py-3 text-sm">{fromApiTime(invite.meeting_time || '') || '—'}</td>
      <td className="px-4 py-3 text-sm">{invite.status}</td>
      <td className="px-4 py-3 text-sm">{invite.remarks || '—'}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface PlanTableRowProps {
  plan: Plan
  invites: Invite[]
  prospects: Info[]
  isEditing: boolean
  getFieldValue: (field: string, fallback?: any) => any
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onFieldChange: (field: string, value: any) => void
  onDelete: () => void
}

const PlanTableRow = ({ plan, invites, prospects, isEditing, getFieldValue, onEdit, onCancel, onSave, onFieldChange, onDelete }: PlanTableRowProps) => {
  const prospectName = prospects.find((p) =>
    invites.find((i) => i.id === plan.invite_id)?.info_id === p.id
  )?.prospect_name || '—'

  if (isEditing) {
    return (
      <tr className="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
        <td className="px-4 py-3">
          <select
            value={getFieldValue('invite_id', '')}
            onChange={(e) => onFieldChange('invite_id', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="">Select Invite *</option>
            {invites.map((inv) => {
              const prospect = prospects.find((p) => p.id === inv.info_id)
              return (
                <option key={inv.id} value={inv.id}>
                  {prospect?.prospect_name}
                </option>
              )
            })}
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('ul1', '')}
            onChange={(e) => onFieldChange('ul1', e.target.value)}
            placeholder="UL1 *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('ul2', '')}
            onChange={(e) => onFieldChange('ul2', e.target.value)}
            placeholder="UL2 *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            value={getFieldValue('expected_uvs', '')}
            onChange={(e) => onFieldChange('expected_uvs', parseFloat(e.target.value))}
            placeholder="UVs *"
            step="0.01"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('status', '')}
            onChange={(e) => onFieldChange('status', e.target.value)}
            placeholder="Status *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={getFieldValue('pipeline_status', 'tentative')}
            onChange={(e) => onFieldChange('pipeline_status', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="tentative">Tentative</option>
            <option value="strong">Strong</option>
            <option value="sureshot">Sureshot</option>
            <option value="done">Done</option>
            <option value="kiv">KIV</option>
          </select>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onSave}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm">{prospectName}</td>
      <td className="px-4 py-3 text-sm">{plan.ul1}</td>
      <td className="px-4 py-3 text-sm">{plan.ul2}</td>
      <td className="px-4 py-3 text-sm">{plan.expected_uvs}</td>
      <td className="px-4 py-3 text-sm">{plan.status}</td>
      <td className="px-4 py-3 text-sm">{plan.pipeline_status}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface ClosingTableRowProps {
  closing: Closing
  plans: Plan[]
  invites: Invite[]
  prospects: Info[]
  isEditing: boolean
  defaultClosingDate?: string
  getFieldValue: (field: string, fallback?: any) => any
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onFieldChange: (field: string, value: any) => void
  onDelete: () => void
}

const ClosingTableRow = ({ closing, plans, invites, prospects, isEditing, defaultClosingDate, getFieldValue, onEdit, onCancel, onSave, onFieldChange, onDelete }: ClosingTableRowProps) => {
  const plan = plans.find((p) => p.id === closing.plan_id)
  const invite = plan ? invites.find((i) => i.id === plan.invite_id) : null
  const prospectName = invite ? prospects.find((p) => p.id === invite.info_id)?.prospect_name || '—' : '—'

  if (isEditing) {
    return (
      <tr className="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
        <td className="px-4 py-3">
          <select
            value={getFieldValue('plan_id', '')}
            onChange={(e) => onFieldChange('plan_id', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="">Select Plan *</option>
            {plans.map((p) => {
              const inv = invites.find((i) => i.id === p.invite_id)
              const prospect = prospects.find((pr) => pr.id === inv?.info_id)
              return (
                <option key={p.id} value={p.id}>
                  {prospect?.prospect_name}
                </option>
              )
            })}
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="date"
            value={getFieldValue('closing_date', defaultClosingDate || '')}
            onChange={(e) => onFieldChange('closing_date', e.target.value || null)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={getFieldValue('status', '')}
            onChange={(e) => onFieldChange('status', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="">Select Status *</option>
            <option value="done">Done</option>
            <option value="pending">Pending</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('remarks', '')}
            onChange={(e) => onFieldChange('remarks', e.target.value || null)}
            placeholder="Remarks"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onSave}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm">{prospectName}</td>
      <td className="px-4 py-3 text-sm">{closing.closing_date || '—'}</td>
      <td className="px-4 py-3 text-sm">{closing.status}</td>
      <td className="px-4 py-3 text-sm">{closing.remarks || '—'}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface FGInviteTableRowProps {
  fgInvite: FGInvite
  closings: Closing[]
  plans: Plan[]
  invites: Invite[]
  prospects: Info[]
  isEditing: boolean
  defaultMeetingDate?: string
  getFieldValue: (field: string, fallback?: any) => any
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onFieldChange: (field: string, value: any) => void
  onDelete: () => void
}

const FGInviteTableRow = ({ fgInvite, closings, plans, invites, prospects, isEditing, defaultMeetingDate, getFieldValue, onEdit, onCancel, onSave, onFieldChange, onDelete }: FGInviteTableRowProps) => {
  const closing = closings.find((c) => c.id === fgInvite.closing_id)
  const plan = closing ? plans.find((p) => p.id === closing.plan_id) : null
  const invite = plan ? invites.find((i) => i.id === plan.invite_id) : null
  const prospectName = invite ? prospects.find((p) => p.id === invite.info_id)?.prospect_name || '—' : '—'

  if (isEditing) {
    return (
      <tr className="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
        <td className="px-4 py-3">
          <select
            value={getFieldValue('closing_id', '')}
            onChange={(e) => onFieldChange('closing_id', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="">Select Closing *</option>
            {closings.map((c) => {
              const p = plans.find((pl) => pl.id === c.plan_id)
              const inv = invites.find((i) => i.id === p?.invite_id)
              const prospect = prospects.find((pr) => pr.id === inv?.info_id)
              return (
                <option key={c.id} value={c.id}>
                  {prospect?.prospect_name}
                </option>
              )
            })}
          </select>
        </td>
        <td className="px-4 py-3">
          <select
            value={getFieldValue('mode', 'virtual')}
            onChange={(e) => onFieldChange('mode', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="virtual">Virtual</option>
            <option value="physical">Physical</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="date"
            value={getFieldValue('meeting_date', fgInvite.meeting_date || defaultMeetingDate || '')}
            onChange={(e) => onFieldChange('meeting_date', e.target.value || null)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="time"
            value={fromApiTime(getFieldValue('meeting_time', ''))}
            onChange={(e) => onFieldChange('meeting_time', toApiTime(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('status', '')}
            onChange={(e) => onFieldChange('status', e.target.value)}
            placeholder="Status *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onSave}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm">{prospectName}</td>
      <td className="px-4 py-3 text-sm">{fgInvite.mode || '—'}</td>
      <td className="px-4 py-3 text-sm">{fgInvite.meeting_date || '—'}</td>
      <td className="px-4 py-3 text-sm">{fromApiTime(fgInvite.meeting_time || '') || '—'}</td>
      <td className="px-4 py-3 text-sm">{fgInvite.status}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface FeelGoodTableRowProps {
  feelGood: FeelGood
  fgInvites: FGInvite[]
  closings: Closing[]
  plans: Plan[]
  invites: Invite[]
  prospects: Info[]
  isEditing: boolean
  getFieldValue: (field: string, fallback?: any) => any
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onFieldChange: (field: string, value: any) => void
  onDelete: () => void
}

const FeelGoodTableRow = ({ feelGood, fgInvites, closings, plans, invites, prospects, isEditing, getFieldValue, onEdit, onCancel, onSave, onFieldChange, onDelete }: FeelGoodTableRowProps) => {
  const fgInvite = fgInvites.find((f) => f.id === feelGood.fg_invite_id)
  const closing = fgInvite ? closings.find((c) => c.id === fgInvite.closing_id) : null
  const plan = closing ? plans.find((p) => p.id === closing.plan_id) : null
  const invite = plan ? invites.find((i) => i.id === plan.invite_id) : null
  const prospectName = invite ? prospects.find((p) => p.id === invite.info_id)?.prospect_name || '—' : '—'

  if (isEditing) {
    return (
      <tr className="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
        <td className="px-4 py-3">
          <select
            value={getFieldValue('fg_invite_id', '')}
            onChange={(e) => onFieldChange('fg_invite_id', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          >
            <option value="">Select FG Invite *</option>
            {fgInvites.map((f) => {
              const c = closings.find((cl) => cl.id === f.closing_id)
              const p = plans.find((pl) => pl.id === c?.plan_id)
              const inv = invites.find((i) => i.id === p?.invite_id)
              const prospect = prospects.find((pr) => pr.id === inv?.info_id)
              return (
                <option key={f.id} value={f.id}>
                  {prospect?.prospect_name}
                </option>
              )
            })}
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('ul1', '')}
            onChange={(e) => onFieldChange('ul1', e.target.value)}
            placeholder="UL1 *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('ul2', '')}
            onChange={(e) => onFieldChange('ul2', e.target.value)}
            placeholder="UL2 *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('status', '')}
            onChange={(e) => onFieldChange('status', e.target.value)}
            placeholder="Status *"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={getFieldValue('remarks', '')}
            onChange={(e) => onFieldChange('remarks', e.target.value || null)}
            placeholder="Remarks"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm dark:bg-gray-600 dark:text-white"
          />
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onSave}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-4 py-3 text-sm">{prospectName}</td>
      <td className="px-4 py-3 text-sm">{feelGood.ul1}</td>
      <td className="px-4 py-3 text-sm">{feelGood.ul2}</td>
      <td className="px-4 py-3 text-sm">{feelGood.status}</td>
      <td className="px-4 py-3 text-sm">{feelGood.remarks || '—'}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
