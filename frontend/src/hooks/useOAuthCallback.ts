import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './useAuth'
import type { User } from '../types/auth'

export const useOAuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const userParam = searchParams.get('user')

    if (accessToken && refreshToken && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam)) as User
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        login(user)
        window.history.replaceState({}, '', '/')
        navigate('/dashboard', { replace: true })
      } catch {
        console.error('Failed to process OAuth callback')
      }
    }
  }, [searchParams, login, navigate, isLoading])
}
