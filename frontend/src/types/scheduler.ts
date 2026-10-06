import type { Invite } from './auth'

export interface ScheduledInvite {
  invite: Invite
  prospectName: string
  irName: string
  selectedUL2s: string[]
}

export interface SchedulerCache {
  ul2List: string[]
  assignments: Record<string, string[]>
}

export interface TelegramEntry {
  irName: string
  prospectName: string
  time: string | null
  isVirtual: boolean
  ul2Assignment: string
}

export interface TelegramGroup {
  date: string
  ul2Entries: Record<string, TelegramEntry[]>
}
