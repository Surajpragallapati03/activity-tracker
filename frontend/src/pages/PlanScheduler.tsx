import { useState, useMemo, useEffect } from 'react'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { useInviteScheduler } from '../hooks/useInviteScheduler'
import { useTelegramMessage } from '../hooks/useTelegramMessage'
import { useSchedulerCache } from '../hooks/useSchedulerCache'
import { useAuth } from '../hooks/useAuth'
import { getUL2Options, formatTimeTo12Hour } from '../config/scheduler'
import { Copy, Share2, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react'
import type { ScheduledInvite } from '../types/scheduler'

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTodayString = (): string => formatDateForInput(new Date())

const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = days[date.getUTCDay()]
  const dom = date.getUTCDate()
  const month = months[date.getUTCMonth()]
  return `${day}, ${dom} ${month}`
}

export const PlanScheduler = () => {
  const { user } = useAuth()
  const [fromDate, setFromDate] = useState(getTodayString())
  const [toDate, setToDate] = useState(getTodayString())
  const [customUL2Input, setCustomUL2Input] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [dateError, setDateError] = useState('')
  const [displayUL2s, setDisplayUL2s] = useState<string[]>(getUL2Options())
  const [assignments, setAssignments] = useState<Record<string, string[]>>({})
  const [schedulerInitialized, setSchedulerInitialized] = useState(false)

  const { scheduledInvites, validInviteIds, isLoading } = useInviteScheduler(fromDate, toDate)
  const { isLoaded: cacheLoaded, ul2List: cachedUL2s, assignments: cachedAssignments, updateUL2List, updateAssignments } = useSchedulerCache(user?.id)

  // Initialize from cache on first load
  useEffect(() => {
    if (!cacheLoaded || schedulerInitialized) return

    if (cachedUL2s.length > 0) {
      setDisplayUL2s(cachedUL2s)
    }

    setAssignments(cachedAssignments)

    setSchedulerInitialized(true)
  }, [cacheLoaded, schedulerInitialized, cachedUL2s, cachedAssignments])

  // Persist displayUL2s changes to cache
  useEffect(() => {
    if (!schedulerInitialized || !user?.id) return
    updateUL2List(displayUL2s)
  }, [displayUL2s, schedulerInitialized, user?.id, updateUL2List])

  // Persist assignment changes to cache
  useEffect(() => {
    if (!schedulerInitialized || !user?.id) return
    updateAssignments(assignments)
  }, [assignments, schedulerInitialized, user?.id, updateAssignments])

  // Clean up stale assignments when invites change
  useEffect(() => {
    if (!schedulerInitialized || validInviteIds.size === 0) return

    const cleaned: Record<string, string[]> = {}
    Object.entries(assignments).forEach(([inviteId, ul2s]) => {
      if (validInviteIds.has(inviteId)) {
        cleaned[inviteId] = ul2s
      }
    })

    if (Object.keys(cleaned).length < Object.keys(assignments).length) {
      setAssignments(cleaned)
    }
  }, [validInviteIds, schedulerInitialized, assignments])

  const telegramMessage = useTelegramMessage(scheduledInvites, assignments)

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, ScheduledInvite[]>()
    scheduledInvites.forEach((si) => {
      const dateKey = si.invite.meeting_date || ''
      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey)!.push(si)
    })
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [scheduledInvites])

  const handleAddUL2 = () => {
    if (!customUL2Input.trim()) return
    if (displayUL2s.includes(customUL2Input.trim())) return

    setDisplayUL2s([...displayUL2s, customUL2Input.trim()])
    setCustomUL2Input('')
  }

  const handleRemoveUL2 = (index: number) => {
    setDisplayUL2s(displayUL2s.filter((_, i) => i !== index))
  }

  const handleEditUL2 = (index: number) => {
    setEditingIndex(index)
    setEditingValue(displayUL2s[index])
  }

  const handleSaveEdit = (index: number) => {
    if (!editingValue.trim()) return
    if (editingValue !== displayUL2s[index] && displayUL2s.includes(editingValue.trim())) return

    const updated = [...displayUL2s]
    updated[index] = editingValue.trim()
    setDisplayUL2s(updated)
    setEditingIndex(null)
    setEditingValue('')
  }

  const handleToggleUL2 = (inviteId: string, ul2: string) => {
    setAssignments((prev) => {
      const current = prev[inviteId] || []
      let updated: string[]

      if (current.includes(ul2)) {
        updated = current.filter((u) => u !== ul2)
      } else {
        updated = [...current, ul2]
      }

      if (updated.length === 0) {
        const newAssignments = { ...prev }
        delete newAssignments[inviteId]
        return newAssignments
      } else {
        return {
          ...prev,
          [inviteId]: updated,
        }
      }
    })
  }

  const handleApplyDates = () => {
    if (fromDate > toDate) {
      setDateError('From date must be before or equal to To date')
      return
    }
    setDateError('')
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(telegramMessage)
  }

  const handleShareToTelegram = () => {
    const encodedMessage = encodeURIComponent(telegramMessage)
    const url = `https://t.me/share/url?url=&text=${encodedMessage}`
    window.open(url, '_blank')
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scheduler Section */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Plan Scheduler</h1>

            {/* Date Filter */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {dateError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-3">
                  <AlertCircle size={16} />
                  {dateError}
                </div>
              )}
              <button
                onClick={handleApplyDates}
                disabled={fromDate > toDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Apply Filter
              </button>
            </div>

            {/* UL2 Management */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">UL2 Configuration</h2>

              <div className="space-y-3 mb-4">
                {displayUL2s.map((ul2, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {editingIndex === idx ? (
                      <>
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleSaveEdit(idx)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                          {ul2}
                        </span>
                        <button
                          onClick={() => handleEditUL2(idx)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveUL2(idx)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUL2Input}
                  onChange={(e) => setCustomUL2Input(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUL2()}
                  placeholder="Add custom UL2"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddUL2}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>

            {/* Invites List */}
            <div className="space-y-4">
              {groupedByDate.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    {isLoading ? 'Loading invites...' : 'No invites scheduled for this date range'}
                  </p>
                </div>
              ) : (
                groupedByDate.map(([dateKey, dateInvites]) => (
                  <div
                    key={dateKey}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    <div className="bg-slate-50 dark:bg-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{formatDisplayDate(dateKey)}</h3>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {dateInvites.map((si) => {
                        const selectedUL2s = assignments[si.invite.id] || []
                        const timeStr = formatTimeTo12Hour(si.invite.meeting_time)
                        const virtualEmoji = si.invite.mode === 'virtual' ? ' 👨‍💻' : ''

                        return (
                          <div key={si.invite.id} className="p-6">
                            <div className="mb-3">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {si.irName} → {si.prospectName}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {timeStr}
                                {virtualEmoji}
                              </p>
                            </div>

                            <div className="space-y-2">
                              {displayUL2s.length === 0 ? (
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                                  <AlertCircle size={16} />
                                  Add UL2s to assign
                                </div>
                              ) : (
                                displayUL2s.map((ul2) => (
                                  <label key={ul2} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedUL2s.includes(ul2)}
                                      onChange={() => handleToggleUL2(si.invite.id, ul2)}
                                      className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <span className="text-slate-700 dark:text-slate-300 text-sm">{ul2}</span>
                                  </label>
                                ))
                              )}
                            </div>

                            {selectedUL2s.length === 0 && (
                              <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-950 rounded text-red-700 dark:text-red-400 text-sm">
                                UNASSIGNED
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Telegram Preview - Sticky on Desktop */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Telegram Preview</h2>

            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm text-slate-900 dark:text-white">
              {telegramMessage || 'No scheduled invites'}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyMessage}
                disabled={telegramMessage === 'No scheduled invites'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Copy size={16} /> Copy Message
              </button>
              <button
                onClick={handleShareToTelegram}
                disabled={telegramMessage === 'No scheduled invites'}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Share2 size={16} /> Share to Telegram
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
