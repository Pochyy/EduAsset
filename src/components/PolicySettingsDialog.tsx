import { useEffect, useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'
import { Field, Input } from './ui/Field'

interface PolicySettingsDialogProps {
  open: boolean
  onClose: () => void
}

interface Drafts {
  varianceNormal: string
  varianceLock: string
  forecastWindow: string
  lowVolumeWindow: string
  lowVolumeThreshold: string
}

const draftsFrom = (policy: {
  varianceNormalPct: number
  varianceLockPct: number
  forecastWindowDays: number
  lowVolumeWindowDays: number
  lowVolumeIssueThreshold: number
}): Drafts => ({
  varianceNormal: String(policy.varianceNormalPct),
  varianceLock: String(policy.varianceLockPct),
  forecastWindow: String(policy.forecastWindowDays),
  lowVolumeWindow: String(policy.lowVolumeWindowDays),
  lowVolumeThreshold: String(policy.lowVolumeIssueThreshold),
})

export function PolicySettingsDialog({ open, onClose }: PolicySettingsDialogProps) {
  const { data, dispatch } = useAppData()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [drafts, setDrafts] = useState<Drafts>(() => draftsFrom(data.policy))
  const [tried, setTried] = useState(false)

  useEffect(() => {
    if (open) {
      setDrafts(draftsFrom(data.policy))
      setTried(false)
    }
  }, [open, data.policy])

  const normal = Number(drafts.varianceNormal)
  const lock = Number(drafts.varianceLock)
  const forecastWindow = Number(drafts.forecastWindow)
  const lowVolumeWindow = Number(drafts.lowVolumeWindow)
  const lowVolumeThreshold = Number(drafts.lowVolumeThreshold)

  const normalValid = Number.isInteger(normal) && normal >= 0 && normal < lock
  const lockValid = Number.isInteger(lock) && lock > normal && lock <= 100
  const forecastValid =
    Number.isInteger(forecastWindow) && forecastWindow >= 1 && forecastWindow <= 90
  const lowVolumeValid =
    Number.isInteger(lowVolumeWindow) &&
    lowVolumeWindow > forecastWindow &&
    lowVolumeWindow <= 180
  const thresholdValid =
    Number.isInteger(lowVolumeThreshold) &&
    lowVolumeThreshold >= 1 &&
    lowVolumeThreshold <= 20

  const normalError = tried && !normalValid
    ? 'Enter a whole number from 0 up to, but not including, the lock band.'
    : undefined
  const lockError = tried && !lockValid
    ? 'The lock band must be a whole number above the normal band, up to 100.'
    : undefined
  const forecastError = tried && !forecastValid
    ? 'Enter a whole number from 1 to 90.'
    : undefined
  const lowVolumeError = tried && !lowVolumeValid
    ? 'Enter a whole number above the standard window, up to 180.'
    : undefined
  const thresholdError = tried && !thresholdValid
    ? 'Enter a whole number from 1 to 20.'
    : undefined

  const valid =
    normalValid && lockValid && forecastValid && lowVolumeValid && thresholdValid

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTried(true)
    if (!valid) return

    dispatch({
      type: 'policy/update',
      patch: {
        varianceNormalPct: normal,
        varianceLockPct: lock,
        forecastWindowDays: forecastWindow,
        lowVolumeWindowDays: lowVolumeWindow,
        lowVolumeIssueThreshold: lowVolumeThreshold,
      },
    })
    dispatch({
      type: 'audit/log',
      entry: {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        actor: user?.name ?? 'Property Custodian',
        action: 'POLICY_UPDATED',
        entityType: 'POLICY',
        entityId: 'POLICY',
        detail: `Policy updated: variance ${normal}% / ${lock}%, forecast ${forecastWindow}/${lowVolumeWindow} days, low-volume threshold ${lowVolumeThreshold} issues.`,
      },
    })
    showToast(
      'success',
      'Policy settings updated',
      `Variance bands ${normal}% / ${lock}%; forecast windows ${forecastWindow}/${lowVolumeWindow} days.`,
    )
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Policy settings"
      eyebrow="Custodian-only · FR-1.05, FR-1.16"
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="policy-settings">
            Save policy
          </Button>
        </>
      }
    >
      <form id="policy-settings" onSubmit={save} noValidate className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-muted">
          These are the Property Office policy values used by forecasting and requisition review.
          Changes apply immediately to new calculations; existing decisions keep the values stored
          when they were made.
        </p>

        <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
          <legend className="text-[13px] font-semibold text-ink">Requisition variance</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Normal band (%)"
              htmlFor="policy-variance-normal"
              error={normalError}
              hint="At or below this value, process automatically."
            >
              <Input
                id="policy-variance-normal"
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                step={1}
                value={drafts.varianceNormal}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, varianceNormal: event.target.value }))
                }
                aria-invalid={Boolean(normalError)}
              />
            </Field>

            <Field
              label="Lock band (%)"
              htmlFor="policy-variance-lock"
              error={lockError}
              hint="At or above this value, lock for Custodian review."
            >
              <Input
                id="policy-variance-lock"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                step={1}
                value={drafts.varianceLock}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, varianceLock: event.target.value }))
                }
                aria-invalid={Boolean(lockError)}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
          <legend className="text-[13px] font-semibold text-ink">Depletion forecast</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Standard window (days)"
              htmlFor="policy-forecast-window"
              error={forecastError}
              hint="Default SRS value: 14 days."
            >
              <Input
                id="policy-forecast-window"
                type="number"
                inputMode="numeric"
                min={1}
                max={90}
                step={1}
                value={drafts.forecastWindow}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, forecastWindow: event.target.value }))
                }
                aria-invalid={Boolean(forecastError)}
              />
            </Field>

            <Field
              label="Low-volume window (days)"
              htmlFor="policy-low-volume-window"
              error={lowVolumeError}
              hint="Default SRS value: 42 days."
            >
              <Input
                id="policy-low-volume-window"
                type="number"
                inputMode="numeric"
                min={1}
                max={180}
                step={1}
                value={drafts.lowVolumeWindow}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, lowVolumeWindow: event.target.value }))
                }
                aria-invalid={Boolean(lowVolumeError)}
              />
            </Field>
          </div>

          <Field
            label="Low-volume threshold (issues)"
            htmlFor="policy-low-volume-threshold"
            error={thresholdError}
            hint="Use the low-volume window when fewer than this many issues were recorded."
          >
            <Input
              id="policy-low-volume-threshold"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              step={1}
              value={drafts.lowVolumeThreshold}
              onChange={(event) =>
                setDrafts((current) => ({ ...current, lowVolumeThreshold: event.target.value }))
              }
              aria-invalid={Boolean(thresholdError)}
            />
          </Field>
        </fieldset>

        <div className="flex items-start gap-3 rounded-control border border-butter-line bg-butter-soft p-4">
          <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rust" aria-hidden="true" />
          <span className="text-[13px] leading-relaxed text-ink">
            The SRS gives 25%, 50%, 14 days, 42 days and 3 issues as defaults. The Property Office
            can change these policy values; each change belongs in the audit trail when the backend
            is connected.
          </span>
        </div>
      </form>
    </Dialog>
  )
}
