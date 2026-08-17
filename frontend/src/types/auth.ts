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
