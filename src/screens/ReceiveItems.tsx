import { useEffect, useState, type ChangeEvent } from 'react'
import { Camera, Check, Printer, QrCode, Sparkles } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../lib/usePageTitle'
import { cn } from '../lib/utils'
import type { SeedItem, SeedLot, SeedUnit } from '../types'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { QrLabel } from '../components/QrLabel'

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

interface IntakePhoto {
  name: string
  previewUrl: string | null
}

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function ReceiveItems() {
  usePageTitle('Central · Receive Items')
  const { data, dispatch } = useAppData()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [step, setStep] = useState(1)
  const [delivery, setDelivery] = useState('')
  const [photo, setPhoto] = useState<IntakePhoto | null>(null)
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
  const [createdLot, setCreatedLot] = useState<SeedLot | null>(null)

  const existingIntakeItem = data.items.find(
    (item) => item.name.toLowerCase() === name.trim().toLowerCase(),
  )
  const enteredCost = Number(unitCost)
  const effectiveUnitCost =
    Number.isFinite(enteredCost) && enteredCost > 0
      ? enteredCost
      : (existingIntakeItem?.unitCost ?? null)
  const effectiveOneToOne = oneToOne || Boolean(existingIntakeItem?.requireOneToOne)
  const isLot =
    category.startsWith('Consumable') &&
    !effectiveOneToOne &&
    effectiveUnitCost !== null &&
    effectiveUnitCost <= data.policy.lotUnitCostCutoff
  const intakeUnit =
    existingIntakeItem?.unit ??
    (category.includes('Paper')
      ? /roll/i.test(name)
        ? 'roll'
        : 'ream'
      : category.includes('Filament')
        ? 'spool'
        : 'unit')

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

  useEffect(() => {
    return () => {
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl)
    }
  }, [photo])

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setPhoto({ name: file.name, previewUrl: URL.createObjectURL(file) })
    setAi('idle')
  }

  function useSamplePhoto() {
    setPhoto({ name: 'sample-item.jpg', previewUrl: null })
    setAi('idle')
  }

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

  function logAudit(
    action: string,
    entityType: string,
    entityId: string,
    detail: string,
  ) {
    dispatch({
      type: 'audit/log',
      entry: {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        actor: user?.name ?? 'Property Custodian',
        actorId: user?.id ?? 'demo-user',
        account: user?.email ?? 'demo@eduasset.local',
        action,
        entityType,
        entityId,
        detail,
      },
    })
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
    const existingItem = existingIntakeItem
    const resolvedName = existingItem?.name ?? itemName
    const itemId = existingItem?.itemId ?? `ITM-${slug(itemName)}`
    const cost = Number(unitCost)
    const replacementValue =
      unitCost.trim() !== '' && Number.isFinite(cost) && cost > 0 ? cost : null
    const durable = category.startsWith('Durable')

    const item: SeedItem = {
      itemId,
      name: resolvedName,
      category: durable ? 'DURABLE' : 'CONSUMABLE',
      unit: intakeUnit,
      leadTimeDays: 21,
      safetyBufferDays: 7,
      replacementValue: existingItem?.replacementValue ?? replacementValue,
      unitCost: existingItem?.unitCost ?? effectiveUnitCost,
      requireOneToOne: effectiveOneToOne,
    }

    if (isLot) {
      if (!existingItem) dispatch({ type: 'item/add', item })
      const lotPrefix = `LOT-${itemId}-${new Date().getFullYear()}-`
      const lotNumbers = data.lots
        .filter((lot) => lot.lotId.startsWith(lotPrefix))
        .map((lot) => Number(lot.lotId.slice(lotPrefix.length)))
        .filter((value) => Number.isFinite(value))
      const nextLot = Math.max(0, ...lotNumbers) + 1
      const lot: SeedLot = {
        lotId: `${lotPrefix}${String(nextLot).padStart(3, '0')}`,
        itemId,
        deliveryRecordId: delivery,
        qtyReceived: number,
        qtyOnHand: number,
        location,
        receivedAt: new Date().toISOString().slice(0, 10),
      }
      dispatch({ type: 'lot/add', lot })
      if (!data.forecast.some((row) => row.lotItemId === itemId)) {
        dispatch({
          type: 'forecast/add',
          row: {
            id: `lot-${itemId.toLowerCase()}`,
            itemId,
            name: resolvedName,
            code: itemId,
            stock: number,
            issues14: 0,
            issues42: 0,
            lastTermIssues: null,
            lead: 21,
            buffer: 7,
            prNumber: '',
            lotItemId: itemId,
          },
        })
      }
      logAudit(
        'LOT_RECEIVED',
        'LOT',
        lot.lotId,
        `${number} ${intakeUnit}${number === 1 ? '' : 's'} of ${resolvedName} received from ${delivery}; recorded as one lot with no per-unit QR codes.`,
      )
      setCreatedLot(lot)
      setCreatedUnits([])
      setStep(4)
      showToast(
        'success',
        `${number} ${intakeUnit} lot ready`,
        'One lot record created; no per-unit QR codes are generated for this item.',
      )
      return
    }

    if (existingItem && existingItem.requireOneToOne !== effectiveOneToOne) {
      dispatch({
        type: 'item/patch',
        id: existingItem.itemId,
        patch: { requireOneToOne: effectiveOneToOne },
      })
    }
    const units: SeedUnit[] = Array.from({ length: number }, (_, index) => ({
      assetId: `${prefix}${String(next + index).padStart(pad, '0')}`,
      itemId,
      itemName: resolvedName,
      category: durable ? 'DURABLE' : 'CONSUMABLE',
      location,
      inventoryStatus: 'IN_STOCK',
      healthState: durable ? 'OPERATIONAL' : 'NOT_APPLICABLE',
      deliveryRecordId: delivery,
      deliveryDate: new Date().toISOString().slice(0, 10),
      serialNumber: null,
      issuedEver: false,
      linkedMachineId: null,
      pendingDisbursement: false,
    }))

    if (!existingItem) dispatch({ type: 'item/add', item })
    dispatch({ type: 'units/add', units })
    logAudit(
      'INTAKE_RECEIVED',
      'DELIVERY',
      delivery,
      `${number} unit record${number === 1 ? '' : 's'} of ${resolvedName} created from ${delivery}; asset IDs ${units[0].assetId} to ${units[units.length - 1].assetId}.`,
    )
    setCreatedLot(null)
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
    setPhoto(null)
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
    setCreatedLot(null)
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
        description="The AI suggests the item name and category from a photo. You confirm it and type the quantity. Units get one record and QR code each; low-value consumables that are not returned are recorded as a quantity lot."
      />

      <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 xl:grid-cols-4">
        {categoriesByStep.map((entry, index) => {
          const guide =
            index === 3 && isLot
              ? { label: 'Lot record', sub: 'Quantity per delivery' }
              : entry
          const number = index + 1
          const done = step > number
          const current = step === number
          return (
            <li
              key={guide.label}
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
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
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
                <span className="text-[13px] font-semibold text-ink">{guide.label}</span>
                <span className="text-[11px] text-muted">{guide.sub}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {step === 1 ? (
        <Card className="flex max-w-2xl flex-col gap-4 p-5">
          <h2 className="text-[15px] font-semibold text-ink">1 · Link the delivery record</h2>
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
            <h2 className="text-[15px] font-semibold text-ink">2 · Photograph one item type</h2>
            <label
              className={cn(
                'flex min-h-[200px] cursor-pointer items-center justify-center rounded-card border-2 p-6 text-center transition-colors focus-within:ring-2 focus-within:ring-rust/50',
                photo
                  ? 'border-success bg-success-bg text-success'
                  : 'border-dashed border-[#B8AFA0] bg-paper text-rust hover:bg-butter-soft',
              )}
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={choosePhoto}
                className="sr-only"
              />
              <span className="flex flex-col items-center gap-2">
                {photo ? (
                  <>
                    {photo.previewUrl ? (
                      <img
                        src={photo.previewUrl}
                        alt={`Preview of ${photo.name}`}
                        className="h-24 w-32 rounded-control object-cover"
                      />
                    ) : (
                      <Check className="h-8 w-8" aria-hidden="true" />
                    )}
                    <strong className="max-w-full break-all text-sm">{photo.name}</strong>
                    <span className="text-xs text-neutral-text">Choose another photo</span>
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
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted">
                The photo stays in this browser; nothing is uploaded in the prototype.
              </span>
              <button
                type="button"
                onClick={useSamplePhoto}
                className="min-h-11 rounded-control px-1 text-xs font-semibold text-rust underline underline-offset-2 transition-colors hover:text-amber-press"
              >
                Use sample photo
              </button>
            </div>
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
            <h2 className="text-[15px] font-semibold text-ink">AI suggestion</h2>
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
              <h2 className="text-[15px] font-semibold text-ink">
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
                <span className="text-xs font-medium text-muted">
                  {isLot ? 'Lot tracking' : 'Manufacturer serials'}
                </span>
                <span className="text-[13px] leading-relaxed text-neutral-text">
                  {isLot
                    ? 'Lots have no serials and no per-unit QR codes. Staff issue them by quantity.'
                    : 'Optional. Add serials per unit later in the Master Ledger; the AI never reads serials.'}
                </span>
              </div>
            </div>

            <label className="flex min-h-11 items-start gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={effectiveOneToOne}
                disabled={Boolean(existingIntakeItem?.requireOneToOne)}
                onChange={(event) => setOneToOne(event.target.checked)}
                className="mt-0.5 h-5 w-5 accent-rust disabled:opacity-60"
              />
              <span>
                <strong>Require 1-to-1 Return</strong>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  A new unit is released only after the spent unit is scanned as RETURNED_EMPTY.
                  This applies to every unit of this item and keeps individual records and QR
                  codes, even below the lot cut-off.
                  {existingIntakeItem?.requireOneToOne
                    ? ' This item is already flagged 1-to-1 and the flag cannot be removed during intake.'
                    : ''}
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
              {isLot ? (
                <span
                  className="mt-0.5 rounded bg-rust px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                  aria-hidden="true"
                >
                  Lot
                </span>
              ) : (
                <QrCode
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rust"
                  aria-hidden="true"
                />
              )}
              <span className="text-[13px] leading-relaxed text-ink">
                {isLot ? (
                  <>
                    Saving creates <strong>one lot record</strong> for{' '}
                    <strong>
                      {quantityPreview} {intakeUnit}
                      {quantityNumber === 1 ? '' : 's'}
                    </strong>{' '}
                    linked to {delivery}. This item is at or below the{' '}
                    {`₱${data.policy.lotUnitCostCutoff.toLocaleString()}`} lot cut-off and is not
                    flagged 1-to-1, so it is issued by quantity with no per-unit QR codes.
                  </>
                ) : (
                  <>
                    Saving creates <strong>{quantityPreview}</strong> IN_STOCK record(s) linked to{' '}
                    {delivery}, each with its own asset ID and QR code.
                    {effectiveOneToOne ? ' Each unit is flagged “Require 1-to-1 Return.”' : ''}
                  </>
                )}
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
                {createdLot
                  ? `${createdLot.qtyReceived} ${intakeUnit}${createdLot.qtyReceived === 1 ? '' : 's'} in one lot ready.`
                  : `${createdUnits.length} unit record${createdUnits.length === 1 ? '' : 's'} ready.`}
              </strong>{' '}
              {name} · {category} · {delivery}. Created in the in-memory store for this prototype.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-ink">
              {createdLot ? '4 · Lot record' : '4 · Printable QR sheet'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={reset}>
                Receive more items
              </Button>
              {createdLot ? null : (
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  Print all labels
                </Button>
              )}
            </div>
          </div>

          {createdLot ? (
            <>
              <dl className="grid gap-3 rounded-control border border-line bg-paper p-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ['Lot ID', createdLot.lotId],
                  ['Item', name],
                  [
                    'Quantity on hand',
                    `${createdLot.qtyOnHand} ${intakeUnit}${createdLot.qtyOnHand === 1 ? '' : 's'}`,
                  ],
                  ['Delivery record', createdLot.deliveryRecordId],
                  ['Location', createdLot.location],
                  ['Received', createdLot.receivedAt],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <dt className="text-xs font-medium text-muted">{label}</dt>
                    <dd className="m-0 font-mono text-[13px] font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="m-0 text-[13px] leading-relaxed text-neutral-text">
                This lot has no asset IDs or QR codes. Lab staff issue it by quantity from Lab
                Inventory → Lots; each issue reduces the quantity on hand and the forecast stock.
              </p>
            </>
          ) : (
            <div className="ea-print-area ea-qr-sheet flex flex-col gap-3">
              <div className="ea-print-only flex-wrap items-end justify-between gap-2">
                <strong className="text-sm text-ink">EduAsset · QR label sheet</strong>
                <span className="text-xs text-neutral-text">
                  {createdUnits.length} label{createdUnits.length === 1 ? '' : 's'} · {delivery} ·{' '}
                  {name}
                </span>
              </div>
              <div className="ea-qr-grid grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                {createdUnits.map((unit) => (
                  <div
                    key={unit.assetId}
                    className="ea-qr-label flex flex-col items-center gap-2 rounded-control border border-dashed border-[#B8AFA0] bg-surface p-3"
                  >
                    <QrLabel assetId={unit.assetId} className="h-24 w-24 text-ink" />
                    <strong className="font-mono text-[13px] font-bold">{unit.assetId}</strong>
                    <span className="text-[11px] text-muted">
                      IN_STOCK · {unit.deliveryRecordId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </>
  )
}
