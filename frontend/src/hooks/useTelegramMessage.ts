import { useMemo } from 'react'
import type { ScheduledInvite } from '../types/scheduler'
import { formatTimeTo12Hour } from '../config/scheduler'

interface GroupedEntry {
  date: string
  ul2Group: string
  entry: string
  hasTime: boolean
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const months = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
  ]
  const day = days[date.getUTCDay()]
  const dom = date.getUTCDate()
  const month = months[date.getUTCMonth()]
  return `${day}, ${dom} ${month}`
}


export const useTelegramMessage = (
  scheduledInvites: ScheduledInvite[],
  assignments: Record<string, string[]>
): string => {
  return useMemo(() => {
    if (scheduledInvites.length === 0) {
      return 'No scheduled invites'
    }

    const grouped = scheduledInvites
      .filter((si) => {
        const ul2s = assignments[si.invite.id] || []
        return ul2s.length > 0
      })
      .map((si) => {
        const ul2s = assignments[si.invite.id] || []
        const ul2Group = ul2s.sort().join('/')
        const timeDisplay = formatTimeTo12Hour(si.invite.meeting_time)
        const virtualEmoji = si.invite.mode === 'virtual' ? ' 👨‍💻' : ''
        const entry = `${si.irName} → ${si.prospectName} → ${timeDisplay}${virtualEmoji}`

        return {
          date: formatDate(si.invite.meeting_date as string),
          ul2Group,
          entry,
          hasTime: !!si.invite.meeting_time,
        }
      })

    const dateGroups = new Map<string, Map<string, GroupedEntry[]>>()

    grouped.forEach((item) => {
      if (!dateGroups.has(item.date)) {
        dateGroups.set(item.date, new Map())
      }

      const ul2Map = dateGroups.get(item.date)!
      if (!ul2Map.has(item.ul2Group)) {
        ul2Map.set(item.ul2Group, [])
      }

      ul2Map.get(item.ul2Group)!.push(item)
    })

    const lines: string[] = []
    const sortedDates = Array.from(dateGroups.keys()).sort()

    sortedDates.forEach((date) => {
      lines.push('')
      lines.push(date)

      const ul2Map = dateGroups.get(date)!
      const sortedUL2s = Array.from(ul2Map.keys()).sort()

      sortedUL2s.forEach((ul2Group) => {
        const entries = ul2Map.get(ul2Group)!

        const withTime = entries.filter((e) => e.hasTime)
        const withoutTime = entries.filter((e) => !e.hasTime)

        withTime.sort((a, b) => a.entry.localeCompare(b.entry))
        withoutTime.sort((a, b) => a.entry.localeCompare(b.entry))

        const sortedEntries = [...withTime, ...withoutTime]

        lines.push('')
        lines.push(ul2Group)

        sortedEntries.forEach((entry) => {
          lines.push(entry.entry)
        })
      })
    })

    return lines.join('\n').trim()
  }, [scheduledInvites, assignments])
}
