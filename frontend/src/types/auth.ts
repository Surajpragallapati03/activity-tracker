export interface User {
  id: string
  ir_id: string
  name: string
  email: string
  role: 'admin' | 'upline' | 'ir'
  status: string
  upline_id: string | null
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
