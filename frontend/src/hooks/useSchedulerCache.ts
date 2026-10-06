import { useState, useEffect, useCallback } from 'react'
import type { SchedulerCache } from '../types/scheduler'
import { getSchedulerCacheKey } from '../config/scheduler'

export const useSchedulerCache = (userId: string | undefined) => {
  const [cache, setCache] = useState<SchedulerCache>({ ul2List: [], assignments: {} })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!userId) {
      setIsLoaded(true)
      return
    }

    const key = getSchedulerCacheKey(userId)
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        setCache(JSON.parse(stored))
      } catch {
        setCache({ ul2List: [], assignments: {} })
      }
    }
    setIsLoaded(true)
  }, [userId])

  const updateUL2List = useCallback(
    (ul2List: string[]) => {
      setCache((prevCache) => {
        const newCache = { ...prevCache, ul2List }
        if (!userId) return prevCache
        const key = getSchedulerCacheKey(userId)
        localStorage.setItem(key, JSON.stringify(newCache))
        return newCache
      })
    },
    [userId]
  )

  const updateAssignments = useCallback(
    (assignments: Record<string, string[]>) => {
      setCache((prevCache) => {
        const newCache = { ...prevCache, assignments }
        if (!userId) return prevCache
        const key = getSchedulerCacheKey(userId)
        localStorage.setItem(key, JSON.stringify(newCache))
        return newCache
      })
    },
    [userId]
  )

  const cleanupStaleAssignments = useCallback(
    (validInviteIds: Set<string>) => {
      const cleaned = Object.entries(cache.assignments)
        .filter(([inviteId]) => validInviteIds.has(inviteId))
        .reduce((acc, [inviteId, ul2s]) => {
          acc[inviteId] = ul2s
          return acc
        }, {} as Record<string, string[]>)
      updateAssignments(cleaned)
    },
    [cache.assignments, updateAssignments]
  )

  return {
    isLoaded,
    ul2List: cache.ul2List,
    assignments: cache.assignments,
    updateUL2List,
    updateAssignments,
    cleanupStaleAssignments,
  }
}
