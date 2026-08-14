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
