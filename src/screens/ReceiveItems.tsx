import { useState } from 'react'
import { Camera, Check, Printer, QrCode, Sparkles } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { qrPath } from '../lib/qr'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import type { SeedItem, SeedUnit } from '../types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'

const deliveryRecords = [
  { id: 'DR-118', label: 'DR-118 · Nov 18 · Peripherals supplier' },
  { id: 'DR-119', label: 'DR-119 · Nov 19 · Toner supplier' },
  { id: 'PO-2026-0031', label: 'PO-2026-0031 · Nov 20 · Bulk consumables order' },
]

const categories = [
  'Durable · Peripheral',
  'Durable · Equipment',
  'Consumable · Toner / drum',
  'Consumable · Filament',
  'Consumable · Paper',
]

const categoriesByStep = [
  { label: 'Delivery record', sub: 'Required' },
  { label: 'Photo & AI', sub: 'Optional AI' },
  { label: 'Confirm & quantity', sub: 'Staff confirms' },
  { label: 'QR sheet', sub: 'One QR per unit' },
]

type AiState = 'idle' | 'loading' | 'ok' | 'error'

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function ReceiveItems() {
  usePageTitle('Central · Receive Items')
  const { data, dispatch } = useAppData()
  const { showToast } = useToast()

  const [step, setStep] = useState(1)
  const [delivery, setDelivery] = useState('')
  const [photo, setPhoto] = useState(false)
  const [ai, setAi] = useState<AiState>('idle')
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [source, setSource] = useState<'ai' | 'manual'>('ai')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [location, setLocation] = useState('Property storeroom')
  const [oneToOne, setOneToOne] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [tried1, setTried1] = useState(false)
  const [tried2, setTried2] = useState(false)
  const [tried3, setTried3] = useState(false)
  const [createdUnits, setCreatedUnits] = useState<SeedUnit[]>([])

  const deliveryError =
    tried1 && !delivery ? 'Select the delivery record these items came with.' : undefined
  const photoError =
    tried2 && !photo ? 'Take or upload a photo first, or register manually.' : undefined
  const quantityNumber = Number(quantity)
  const nameError =
    tried3 && name.trim().length < 2 ? 'Enter the item name.' : undefined
  const categoryError =
    tried3 && !category ? 'Choose a category from the list.' : undefined
  const quantityError =
    tried3 && !(Number.isInteger(quantityNumber) && quantityNumber >= 1 && quantityNumber <= 500)
      ? 'Type a whole number from 1 to 500.'
      : undefined
  const confirmError = tried3 && !confirmed ? 'Confirm the details before saving.' : undefined

  const suggestion =
    delivery === 'DR-119'
      ? { name: 'Laser toner cartridge', category: 'Consumable · Toner / drum' }
      : { name: 'Keyboard', category: 'Durable · Peripheral' }

  const quantityPreview =
    Number.isInteger(quantityNumber) && quantityNumber > 0 ? quantityNumber : 'N'

  function askAi() {
    if (!photo) {
      setTried2(true)
      return
    }
    if (ai === 'loading') return
    setAi('loading')
    window.setTimeout(() => {
      setAi(simulateFailure ? 'error' : 'ok')
    }, 1200)
  }

  function useSuggestion() {
    setStep(3)
    setSource('ai')
    setName(suggestion.name)
    setCategory(suggestion.category)
    setOneToOne(suggestion.category.includes('Toner'))
    setConfirmed(false)
    setTried3(false)
  }

  function manual() {
    setStep(3)
    setSource('manual')
    setName('')
    setCategory('')
    setOneToOne(false)
    setConfirmed(false)
    setTried3(false)
  }

  function save() {
    const number = Number(quantity)
    const valid =
      name.trim().length >= 2 &&
      Boolean(category) &&
      Number.isInteger(number) &&
      number >= 1 &&
      number <= 500 &&
      confirmed
    if (!valid) {
      setTried3(true)
      return
    }

    const prefix = category.includes('Toner')
      ? 'TNR-WIL-2026-'
      : category.includes('Paper')
        ? 'BP-A4-'
        : category.includes('Filament')
          ? 'FIL-WIL-2026-'
          : category.includes('Equipment')
            ? 'WIL-EQ-'
            : 'KB-'
    const pad = prefix === 'KB-' || prefix === 'BP-A4-' ? 4 : 3
    const existingNumbers = data.units
      .filter((unit) => unit.assetId.startsWith(prefix))
      .map((unit) => Number(unit.assetId.slice(prefix.length)))
      .filter((value) => Number.isFinite(value))
    const next = Math.max(0, ...existingNumbers) + 1
    const itemName = name.trim()
    const existingItem = data.items.find(
      (item) => item.name.toLowerCase() === itemName.toLowerCase(),
    )
    const itemId = existingItem?.itemId ?? `ITM-${slug(itemName)}`
    const cost = Number(unitCost)
    const replacementValue =
      unitCost.trim() !== '' && Number.isFinite(cost) && cost > 0 ? cost : null
    const durable = category.startsWith('Durable')

    const item: SeedItem = {
      itemId,
      name: itemName,
      category: durable ? 'DURABLE' : 'CONSUMABLE',
      unit: 'unit',
      leadTimeDays: 21,
      safetyBufferDays: 7,
      replacementValue,
      requireOneToOne: oneToOne,
    }

    const units: SeedUnit[] = Array.from({ length: number }, (_, index) => ({
      assetId: `${prefix}${String(next + index).padStart(pad, '0')}`,
      itemId,
      itemName,
      category: durable ? 'DURABLE' : 'CONSUMABLE',
      location,
      inventoryStatus: 'IN_STOCK',
      healthState: durable ? 'OPERATIONAL' : 'NOT_APPLICABLE',
      deliveryRecordId: delivery,
      deliveryDate: new Date().toISOString().slice(0, 10),
      serialNumber: null,
      linkedMachineId: null,
      pendingDisbursement: false,
    }))

    if (!existingItem) dispatch({ type: 'item/add', item })
    dispatch({ type: 'units/add', units })
    setCreatedUnits(units)
    setStep(4)
    showToast(
      'success',
      `${number} unit record${number === 1 ? '' : 's'} ready`,
      'Asset IDs and QR codes generated in the in-memory prototype store.',
    )
  }

  function reset() {
    setStep(1)
    setDelivery('')
    setPhoto(false)
    setAi('idle')
    setSource('ai')
    setName('')
    setCategory('')
    setQuantity('')
    setUnitCost('')
    setLocation('Property storeroom')
    setOneToOne(false)
    setConfirmed(false)
    setTried1(false)
    setTried2(false)
    setTried3(false)
    setCreatedUnits([])
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Central', href: '/central/dashboard' },
          { label: 'Intake' },
          { label: 'Receive New Items' },
        ]}
        title="Receive new items"
        description="The AI suggests the item name and category from a photo. You confirm it and type the quantity; the system creates one record and QR code per unit."
      />

      <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 xl:grid-cols-4">
        {categoriesByStep.map((entry, index) => {
          const number = index + 1
          const done = step > number
          const current = step === number
          return (
            <li
              key={entry.label}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-card border p-3',
                current
                  ? 'border-amber bg-surface'
                  : done
                    ? 'border-success-line bg-success-bg'
                    : 'border-line bg-surface',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  done
                    ? 'bg-success text-white'
                    : current
                      ? 'bg-amber text-ink'
                      : 'bg-neutral-bg text-neutral-text',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : number}
              </span>
              <span className="flex flex-col">
                <span className="text-[13px] font-semibold text-ink">{entry.label}</span>
                <span className="text-[11px] text-muted">{entry.sub}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {step === 1 ? (
        <Card className="flex max-w-2xl flex-col gap-4 p-5">
          <h2 className="text-[15px] font-bold text-ink">1 · Link the delivery record</h2>
          <p className="text-[13px] leading-relaxed text-muted">
            Units can only enter EduAsset through a receiving record tied to a delivery receipt or
            purchase order.
          </p>
          <Field
            label="Delivery receipt / purchase order (required)"
            htmlFor="receive-delivery"
            error={deliveryError}
          >
            <Select
              id="receive-delivery"
              value={delivery}
              onChange={(event) => setDelivery(event.target.value)}
              aria-invalid={Boolean(deliveryError)}
              className={cn(deliveryError && 'border-danger')}
            >
              <option value="">Select a delivery record…</option>
              {deliveryRecords.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (!delivery) {
                  setTried1(true)
                  return
                }
                setStep(2)
              }}
            >
              Continue
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
          <Card className="flex flex-col gap-4 p-5">
            <h2 className="text-[15px] font-bold text-ink">2 · Photograph one item type</h2>
            <button
              type="button"
              onClick={() => {
                setPhoto(true)
                setAi('idle')
              }}
              className={cn(
                'flex min-h-[200px] items-center justify-center rounded-card border-2 p-6 text-center transition-colors',
                photo
                  ? 'border-success bg-success-bg text-success'
                  : 'border-dashed border-[#B8AFA0] bg-paper text-rust hover:bg-butter-soft',
              )}
            >
              <span className="flex flex-col items-center gap-2">
                {photo ? (
                  <>
                    <Check className="h-8 w-8" aria-hidden="true" />
                    <strong className="text-sm">photo_2026-11-19_1032.jpg</strong>
                    <span className="text-xs text-neutral-text">Tap to retake</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8" aria-hidden="true" />
                    <strong className="text-sm">Take or upload a photo</strong>
                    <span className="text-xs text-muted">
                      One item type per photo · the AI does not count units
                    </span>
                  </>
                )}
              </span>
            </button>
            {photoError ? (
              <span role="alert" className="text-xs font-medium text-danger">
                {photoError}
              </span>
            ) : null}

            <label className="flex min-h-11 items-center gap-2.5 text-[13px] text-neutral-text">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(event) => {
                  setSimulateFailure(event.target.checked)
                  setAi('idle')
                }}
                className="h-[18px] w-[18px] accent-rust"
              />
              Demo: simulate AI service unavailable
            </label>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={manual}>
                  Register manually
                </Button>
                <Button onClick={askAi} disabled={ai === 'loading'}>
                  {ai === 'loading' ? 'Asking AI…' : 'Get AI suggestion'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <h2 className="text-[15px] font-bold text-ink">AI suggestion</h2>
            {ai === 'idle' ? (
              <p className="text-[13px] leading-relaxed text-muted">
                The suggestion appears here. It names the item and picks a category from the fixed
                list; you review it before anything is saved.
              </p>
            ) : null}
            {ai === 'loading' ? (
              <div aria-busy="true" className="flex flex-col gap-3">
                <span className="block h-3.5 w-3/5 animate-pulse rounded-full bg-line-soft motion-reduce:animate-none" />
                <span className="block h-3.5 w-2/5 animate-pulse rounded-full bg-line-soft motion-reduce:animate-none" />
                <span className="text-xs text-muted">
                  Sending the photo from the backend to the vision model…
                </span>
              </div>
            ) : null}
            {ai === 'error' ? (
              <div className="flex items-start gap-3 rounded-control border border-danger-line bg-danger-bg p-4">
                <Sparkles className="mt-0.5 h-[18px] w-[18px] shrink-0 text-danger" aria-hidden="true" />
                <span className="flex flex-col gap-2">
                  <strong className="text-sm font-semibold text-ink">
                    AI suggestion unavailable
                  </strong>
                  <span className="text-[13px] leading-relaxed text-ink">
                    No internet connection or the AI service returned an error. Use the manual
                    registration form; intake still works.
                  </span>
                  <Button variant="secondary" className="self-start" onClick={manual}>
                    Continue manually
                  </Button>
                </span>
              </div>
            ) : null}
            {ai === 'ok' ? (
              <div className="flex items-start gap-3 rounded-control border border-warning-line bg-warning-bg p-4">
                <Sparkles className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warning" aria-hidden="true" />
                <span className="flex flex-col gap-2">
                  <strong className="text-sm font-semibold text-ink">
                    Suggested: {suggestion.name}
                  </strong>
                  <span className="text-[13px] text-ink">
                    Category: {suggestion.category} · needs your confirmation
                  </span>
                  <Button className="self-start" onClick={useSuggestion}>
                    Review suggestion
                  </Button>
                </span>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      {step === 3 ? (
        <Card className="p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              save()
            }}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-bold text-ink">
                3 · Confirm details &amp; quantity
              </h2>
              <Badge tone={source === 'ai' ? 'warning' : 'neutral'}>
                {source === 'ai' ? 'AI SUGGESTION · NEEDS CONFIRMATION' : 'MANUAL REGISTRATION'}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="Item name (edit if wrong)" htmlFor="receive-name" error={nameError}>
                <Input
                  id="receive-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={Boolean(nameError)}
                  className={cn(nameError && 'border-danger')}
                />
              </Field>

              <Field label="Category (fixed list)" htmlFor="receive-category" error={categoryError}>
                <Select
                  id="receive-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  aria-invalid={Boolean(categoryError)}
                  className={cn(categoryError && 'border-danger')}
                >
                  <option value="">Select…</option>
                  {categories.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Quantity (typed by staff)"
                htmlFor="receive-quantity"
                error={quantityError}
              >
                <Input
                  id="receive-quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  aria-invalid={Boolean(quantityError)}
                  className={cn(quantityError && 'border-danger')}
                />
              </Field>

              <Field label="Unit cost (₱, optional)" htmlFor="receive-cost">
                <Input
                  id="receive-cost"
                  type="number"
                  inputMode="decimal"
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                  placeholder="e.g. 650"
                />
              </Field>

              <Field label="Location" htmlFor="receive-location">
                <Select
                  id="receive-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                >
                  {['Property storeroom', 'WIL Lab 1', 'WIL Lab 2', 'WIL Lab 3'].map(
                    (entry) => (
                      <option key={entry}>{entry}</option>
                    ),
                  )}
                </Select>
              </Field>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted">Manufacturer serials</span>
                <span className="text-[13px] leading-relaxed text-neutral-text">
                  Optional. Add serials per unit later in the Master Ledger; the AI never reads
                  serials.
                </span>
              </div>
            </div>

            <label className="flex min-h-11 items-start gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={oneToOne}
                onChange={(event) => setOneToOne(event.target.checked)}
                className="mt-0.5 h-5 w-5 accent-rust"
              />
              <span>
                <strong>Require 1-to-1 Return</strong>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  A new unit is released only after the spent unit is scanned as RETURNED_EMPTY.
                  This applies to every unit of this item.
                </span>
              </span>
            </label>

            <label className="flex min-h-11 items-start gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 h-5 w-5 accent-rust"
              />
              <span>
                I checked the item name, category and quantity against the delivery receipt.
                {confirmError ? (
                  <span role="alert" className="mt-1 block text-xs font-medium text-danger">
                    {confirmError}
                  </span>
                ) : null}
              </span>
            </label>

            <div className="flex items-start gap-3 rounded-control border border-butter-line bg-butter-soft p-4">
              <QrCode className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rust" aria-hidden="true" />
              <span className="text-[13px] leading-relaxed text-ink">
                Saving creates <strong>{quantityPreview}</strong> IN_STOCK record(s) linked to{' '}
                {delivery}, each with its own asset ID and QR code.
                {oneToOne ? ' Each unit is flagged “Require 1-to-1 Return.”' : ''}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="submit">Confirm &amp; save</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-start gap-3 rounded-control border border-success-line bg-success-bg p-4">
            <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-success" aria-hidden="true" />
            <span className="text-[13px] leading-relaxed text-ink">
              <strong>
                {createdUnits.length} unit record{createdUnits.length === 1 ? '' : 's'} ready.
              </strong>{' '}
              {name} · {category} · {delivery}. Created in the in-memory store for this prototype.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold text-ink">4 · Printable QR sheet</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={reset}>
                Receive more items
              </Button>
              <Button
                onClick={() =>
                  showToast(
                    'info',
                    'Print sheet prepared',
                    'Prints on an ordinary printer, sticker or plain paper, with the asset ID under each code.',
                  )
                }
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print all labels
              </Button>
            </div>
          </div>

          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
            {createdUnits.map((unit) => (
              <div
                key={unit.assetId}
                className="flex flex-col items-center gap-2 rounded-control border border-dashed border-[#B8AFA0] bg-surface p-3"
              >
                <svg
                  viewBox="0 0 25 25"
                  role="img"
                  aria-label={`QR code for ${unit.assetId}`}
                  className="h-24 w-24 text-ink"
                >
                  <path d={qrPath(unit.assetId)} fill="currentColor" />
                </svg>
                <strong className="font-mono text-[13px] font-bold">{unit.assetId}</strong>
                <span className="text-[11px] text-muted">
                  IN_STOCK · {unit.deliveryRecordId}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </>
  )
}
