import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../services/api'
import { Eye, EyeOff } from 'lucide-react'
import { getErrorMessage } from '../services/errors'

interface PasswordChangeModalProps {
  onClose: () => void
  hasPassword: boolean
}

export const PasswordChangeModal = ({ onClose, hasPassword }: PasswordChangeModalProps) => {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [updateError, setUpdateError] = useState<string | null>(null)

  const isSetPassword = !hasPassword
  const endpoint = isSetPassword ? '/profile/set-password' : '/profile/change-password'

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = isSetPassword
        ? {
            new_password: form.new_password,
            confirm_password: form.confirm_password,
          }
        : {
            current_password: form.current_password,
            new_password: form.new_password,
            confirm_password: form.confirm_password,
          }

      const res = await api.post<{ message: string }>(endpoint, payload)
      return res.data
    },
    onSuccess: () => {
      setUpdateError(null)
      onClose()
    },
    onError: (error) => {
      setUpdateError(getErrorMessage(error))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (form.new_password !== form.confirm_password) {
      setValidationError('New password and confirmation do not match')
      return
    }

    if (form.new_password.length < 6) {
      setValidationError('New password must be at least 6 characters')
      return
    }

    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isSetPassword ? 'Set Password' : 'Change Password'}
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {(updateError || validationError) && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 p-3 rounded">
                {validationError || updateError}
              </div>
            )}

            {!isSetPassword && (
              <div>
                <label className="label">Current Password *</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required={!isSetPassword}
                    value={form.current_password}
                    onChange={(e) =>
                      setForm({ ...form, current_password: e.target.value })
                    }
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="label">New Password *</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={form.new_password}
                  onChange={(e) =>
                    setForm({ ...form, new_password: e.target.value })
                  }
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={form.confirm_password}
                  onChange={(e) =>
                    setForm({ ...form, confirm_password: e.target.value })
                  }
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="card-footer flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                onClose()
                setUpdateError(null)
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending
                ? 'Updating...'
                : isSetPassword
                  ? 'Set Password'
                  : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
