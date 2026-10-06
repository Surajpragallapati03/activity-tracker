export const parseUL2Options = (envString: string | undefined): string[] => {
  if (!envString || envString.trim() === '') {
    return []
  }
  return envString.split(',').map((item) => item.trim()).filter((item) => item !== '')
}

export const getSchedulerCacheKey = (userId: string): string => {
  return `activity_tracker_scheduler_${userId}`
}

export const getUL2Options = (): string[] => {
  const envString = import.meta.env.VITE_UL2_OPTIONS
  return parseUL2Options(envString)
}

export const formatTimeTo12Hour = (timeStr: string | null | undefined): string => {
  if (!timeStr) return 'TYTC'

  const parts = timeStr.split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parts[1]

  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12

  return `${hour12}:${minutes} ${period}`
}
