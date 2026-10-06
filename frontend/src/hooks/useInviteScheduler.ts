import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '../services/api'
import type { Invite, Info } from '../types/auth'
import type { ScheduledInvite } from '../types/scheduler'

interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export const useInviteScheduler = (fromDate: string, toDate: string) => {

  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ['invites-scheduler'],
    queryFn: async () => {
      const res = await api.get<ListResponse<Invite>>('/invites', {
        params: { page: 1, limit: 1000 },
      })
      return res.data.data || []
    },
  })

  const { data: infosData, isLoading: infosLoading } = useQuery({
    queryKey: ['infos-scheduler'],
    queryFn: async () => {
      const res = await api.get<ListResponse<Info>>('/infos', {
        params: { page: 1, limit: 1000 },
      })
      return res.data.data || []
    },
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-scheduler'],
    queryFn: async () => {
      const res = await api.get<ListResponse<any>>('/users', {
        params: { page: 1, limit: 1000 },
      })
      return res.data.data || []
    },
  })

  const scheduledInvites = useMemo(() => {
    if (!invitesData || !infosData || !usersData) return []

    const fromDateObj = new Date(fromDate)
    const toDateObj = new Date(toDate)

    const infoMap = new Map<string, Info>(infosData.map((info) => [info.id, info]))
    const userMap = new Map<string, any>(usersData.map((user) => [user.ir_id, user]))

    const filtered = invitesData
      .filter((invite) => {
        if (!invite.meeting_date) return false
        const meetingDate = new Date(invite.meeting_date)
        return meetingDate >= fromDateObj && meetingDate <= toDateObj
      })
      .map((invite) => {
        const info = infoMap.get(invite.info_id)
        const user = userMap.get(invite.ir_id)
        const prospectName = info?.prospect_name || 'Unknown'
        const irName = user?.name || invite.ir_id

        return {
          invite,
          prospectName,
          irName,
          selectedUL2s: [],
        } as ScheduledInvite
      })

    filtered.sort((a, b) => {
      const dateA = new Date(a.invite.meeting_date || 0).getTime()
      const dateB = new Date(b.invite.meeting_date || 0).getTime()
      if (dateA !== dateB) return dateA - dateB

      const timeA = a.invite.meeting_time ? a.invite.meeting_time.split(':').join('') : 'zzz'
      const timeB = b.invite.meeting_time ? b.invite.meeting_time.split(':').join('') : 'zzz'
      return timeA.localeCompare(timeB)
    })

    return filtered
  }, [invitesData, infosData, usersData, fromDate, toDate])

  const validInviteIds = useMemo(() => {
    return new Set(scheduledInvites.map((si) => si.invite.id))
  }, [scheduledInvites])

  return {
    scheduledInvites,
    validInviteIds,
    isLoading: invitesLoading || infosLoading,
  }
}
