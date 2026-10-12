export type DatePreset = 'all' | 'today' | 'week' | 'month' | 'custom'

export interface DateRange {
  startDate: string
  endDate: string
}

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const getDateRangeForPreset = (preset: DatePreset): DateRange | null => {
  if (preset === 'all') {
    return null
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today': {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return {
        startDate: formatDate(today),
        endDate: formatDate(new Date(tomorrow.getTime() - 1)),
      }
    }

    case 'week': {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return {
        startDate: formatDate(weekStart),
        endDate: formatDate(weekEnd),
      }
    }

    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return {
        startDate: formatDate(monthStart),
        endDate: formatDate(monthEnd),
      }
    }

    default:
      return null
  }
}
