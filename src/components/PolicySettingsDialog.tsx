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
  berThreshold: string
  dormantDays: string
  lotCutoff: string
}

const draftsFrom = (policy: {
  varianceNormalPct: number
  varianceLockPct: number
  forecastWindowDays: number
  lowVolumeWindowDays: number
  lowVolumeIssueThreshold: number
  berThresholdPct: number
  dormantDays: number
  lotUnitCostCutoff: number
}): Drafts => ({
  varianceNormal: String(policy.varianceNormalPct),
  varianceLock: String(policy.varianceLockPct),
  forecastWindow: String(policy.forecastWindowDays),
  lowVolumeWindow: String(policy.lowVolumeWindowDays),
  lowVolumeThreshold: String(policy.lowVolumeIssueThreshold),
  berThreshold: String(policy.berThresholdPct),
  dormantDays: String(policy.dormantDays),
  lotCutoff: String(policy.lotUnitCostCutoff),
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
  const berThreshold = Number(drafts.berThreshold)
  const dormantDays = Number(drafts.dormantDays)
  const lotCutoff = Number(drafts.lotCutoff)

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
  const berValid =
    Number.isInteger(berThreshold) && berThreshold >= 1 && berThreshold <= 100
  const dormantValid =
    Number.isInteger(dormantDays) && dormantDays >= 1 && dormantDays <= 365
  const lotCutoffValid =
    Number.isFinite(lotCutoff) && lotCutoff > 0 && lotCutoff <= 1000000

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
  const berError = tried && !berValid
    ? 'Enter a whole number from 1 to 100.'
    : undefined
  const dormantError = tried && !dormantValid
    ? 'Enter a whole number from 1 to 365.'
    : undefined
  const lotCutoffError = tried && !lotCutoffValid
    ? 'Enter an amount above ₱0.'
    : undefined

  const valid =
    normalValid &&
    lockValid &&
    forecastValid &&
    lowVolumeValid &&
    thresholdValid &&
    berValid &&
    dormantValid &&
    lotCutoffValid

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
        berThresholdPct: berThreshold,
        dormantDays,
        lotUnitCostCutoff: lotCutoff,
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
        detail: `Policy updated: variance ${normal}% / ${lock}%, forecast ${forecastWindow}/${lowVolumeWindow} days, threshold ${lowVolumeThreshold} issues, BER ${berThreshold}%, dormancy ${dormantDays} days, lot cut-off ${lotCutoff}.`,
      },
    })
    showToast(
      'success',
      'Policy settings updated',
      `Variance ${normal}%/${lock}%, forecast ${forecastWindow}/${lowVolumeWindow} days, BER ${berThreshold}%, dormancy ${dormantDays} days.`,
    )
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Policy settings"
      eyebrow="Custodian-only · FR-1.05, 1.16, 3.14, 3.27, 3.28"
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
          These are the Property Office policy values used by forecasting, requisition review,
          repair decisions, dormancy monitoring and lot tracking. Changes apply immediately to new
          calculations; existing decisions keep the values stored when they were made.
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

        <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
          <legend className="text-[13px] font-semibold text-ink">Repair and integrity</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="BER threshold (%)"
              htmlFor="policy-ber-threshold"
              error={berError}
              hint="Default SRS value: 50%."
            >
              <Input
                id="policy-ber-threshold"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                step={1}
                value={drafts.berThreshold}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, berThreshold: event.target.value }))
                }
                aria-invalid={Boolean(berError)}
              />
            </Field>

            <Field
              label="Dormancy threshold (days)"
              htmlFor="policy-dormant-days"
              error={dormantError}
              hint="Default SRS value: 60 days."
            >
              <Input
                id="policy-dormant-days"
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                step={1}
                value={drafts.dormantDays}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, dormantDays: event.target.value }))
                }
                aria-invalid={Boolean(dormantError)}
              />
            </Field>
          </div>

          <Field
            label="Lot unit-cost cut-off (₱)"
            htmlFor="policy-lot-cutoff"
            error={lotCutoffError}
            hint="SRS placeholder is still bracketed; 500 is a sample value until the Property Office supplies the actual cut-off."
          >
            <Input
              id="policy-lot-cutoff"
              type="number"
              inputMode="decimal"
              min={1}
              step={1}
              value={drafts.lotCutoff}
              onChange={(event) =>
                setDrafts((current) => ({ ...current, lotCutoff: event.target.value }))
              }
              aria-invalid={Boolean(lotCutoffError)}
            />
          </Field>
        </fieldset>

        <div className="flex items-start gap-3 rounded-control border border-butter-line bg-butter-soft p-4">
          <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rust" aria-hidden="true" />
          <span className="text-[13px] leading-relaxed text-ink">
            The SRS gives 25%, 50%, 14 days, 42 days, 3 issues, 50% BER and 60 days as defaults.
            The lot cut-off is still bracketed in the SRS; 500 is a clearly marked sample value. The
            Property Office can change these values, and each change is written to the audit log.
          </span>
        </div>
      </form>
    </Dialog>
  )
}
