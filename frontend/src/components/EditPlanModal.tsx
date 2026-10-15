import { useState } from 'react'
import type { Plan, User, Info, Invite } from '../types/auth'

export interface EditPlanModalProps {
  plan: Plan
  invite?: Invite
  info?: Info
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
  error: string | null
  users: User[]
  currentUser: User | null
}

export const EditPlanModal = ({ plan, invite: _invite, info: _info, onClose, onSubmit, isLoading, error, users, currentUser }: EditPlanModalProps) => {
  const [form, setForm] = useState({
    ir_id: plan.ir_id,
    ul1: plan.ul1,
    ul2: plan.ul2,
    quoted_amount: plan.quoted_amount || '',
    expected_uvs: plan.expected_uvs?.toString() || '',
    status: plan.status,
    remarks: plan.remarks || '',
    pipeline_status: plan.pipeline_status || 'tentative',
  })

  const isAdmin = currentUser?.role === 'admin'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ul1: form.ul1,
      ul2: form.ul2,
      quoted_amount: form.quoted_amount || undefined,
      expected_uvs: form.expected_uvs ? parseFloat(form.expected_uvs) : undefined,
      status: form.status,
      remarks: form.remarks || undefined,
      pipeline_status: form.pipeline_status,
    }
    onSubmit(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Plan</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-content space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label className="label">UL1 *</label>
              <input
                type="text"
                required
                value={form.ul1}
                onChange={(e) => setForm({ ...form, ul1: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">UL2 *</label>
              <input
                type="text"
                required
                value={form.ul2}
                onChange={(e) => setForm({ ...form, ul2: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Quoted Amount</label>
              <input
                type="text"
                value={form.quoted_amount}
                onChange={(e) => setForm({ ...form, quoted_amount: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Expected UV</label>
              <input
                type="number"
                step="0.01"
                value={form.expected_uvs}
                onChange={(e) => setForm({ ...form, expected_uvs: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Status</label>
              <input
                type="text"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Pipeline Status</label>
              <select
                value={form.pipeline_status}
                onChange={(e) => setForm({ ...form, pipeline_status: e.target.value })}
                className="input"
              >
                <option value="tentative">Tentative</option>
                <option value="strong">Strong</option>
                <option value="sureshot">Sureshot</option>
                <option value="done">Done</option>
                <option value="kiv">KIV</option>
              </select>
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
            {isAdmin && (
              <div>
                <label className="label">IR ID</label>
                <select
                  value={form.ir_id}
                  onChange={(e) => setForm({ ...form, ir_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select IR</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.ir_id}>
                      {u.name} ({u.ir_id})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="card-footer flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
