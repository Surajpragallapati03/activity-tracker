export interface User {
  id: string
  ir_id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'upline' | 'ir'
  status: string
  upline_id: string | null
  created_at?: string
  updated_at?: string
}

export interface Info {
  id: string
  ir_id: string
  prospect_name: string
  phone?: string | null
  response?: string | null
  status: string
  remarks?: string | null
  created_by: string
  created_at?: string
  updated_at?: string
}

export interface Invite {
  id: string
  info_id: string
  ir_id: string
  meeting_date?: string | null
  meeting_time?: string | null
  mode: string
  status: string
  remarks?: string | null
  created_at?: string
  updated_at?: string
}

export interface Plan {
  id: string
  invite_id: string
  ir_id: string
  ul1: string
  ul2: string
  quoted_amount: string
  expected_uvs: number
  status: string
  remarks?: string | null
  created_at?: string
  updated_at?: string
}

export interface Closing {
  id: string
  plan_id: string
  ir_id: string
  closing_date?: string | null
  status: string
  remarks?: string | null
  created_at?: string
  updated_at?: string
}

export interface FGInvite {
  id: string
  closing_id: string
  ir_id: string
  meeting_date?: string | null
  meeting_time?: string | null
  mode: string
  status: string
  remarks?: string | null
  created_at?: string
  updated_at?: string
}

export interface FeelGood {
  id: string
  fg_invite_id: string
  ir_id: string
  ul1: string
  ul2: string
  status: string
  remarks?: string | null
  created_at?: string
  updated_at?: string
}

export interface Tokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}
