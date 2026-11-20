# EduAsset API Contract (draft)

**Status:** proposed contract derived from `Draf SRS.pdf` and the 17 prototype screens.
**Audience:** backend implementation (Spring Boot + MySQL).
**Base URL:** `/api/v1` — JSON over HTTPS.

This is a **handoff draft**, not an implemented API. It defines the resources, payloads and rules the
prototype implies. Field names are suggestions; keep the semantics and validation rules.

---

## 1. Conventions

- JSON, UTF-8, `Content-Type: application/json` (except photo uploads).
- IDs are strings (`KB-0152`, `RQ-1021`, `WIL-PRN-01`) — never expose auto-increment integers.
- Timestamps are ISO 8601 with timezone (`2026-11-19T10:42:00+08:00`).
- Authentication: `Authorization: Bearer <JWT>`.
- List endpoints support `page`, `size`, `q`, and the filters named per endpoint.
- Errors use one shape:

```json
{
  "timestamp": "2026-11-19T10:42:00+08:00",
  "status": 409,
  "code": "INVALID_STATUS_TRANSITION",
  "message": "RETURNED_EMPTY cannot move to ISSUED_IN_USE.",
  "fieldErrors": [{ "field": "quantity", "message": "Must be between 1 and 500." }]
}
```

- The audit log is append-only. There is no update/delete endpoint for audit entries.
- The AI API key lives only on the backend. No client response may contain it.

---

## 2. Roles

| Role | Portal | Can |
|---|---|---|
| `LAB_ASSISTANT` | WIL Lab | Requisition, turnover scan, report incident, view lab inventory/work orders |
| `LAB_MANAGER` | WIL Lab | Same as Lab Assistant, plus approve lab-side actions if assigned |
| `CENTRAL_CUSTODIAN` | Central | Alerts, forecast settings, PR forms, requisition review, turnover approval, ledger, repairs, replacements, reconciliation, audit queue, intake |
| `SECOND_APPROVER` | Central | Confirm a verified replacement (two-person rule) |
| `TECHNICIAN` | none | Receives work orders/quotes outside the pilot; not an authenticated portal user |

`CENTRAL_CUSTODIAN` cannot act as the second approver on the same replacement; enforce distinct users.

---

## 3. Enums

Store these as canonical tokens. The UI may format them (`ISSUED_IN_USE` → "ISSUED / IN_USE").

| Enum | Values |
|---|---|
| `InventoryStatus` | `IN_STOCK`, `ISSUED_IN_USE`, `RETURNED_EMPTY`, `RETIRED` |
| `HealthState` | `OPERATIONAL`, `NEEDS_MAINTENANCE`, `UNDER_REPAIR`, `CONDEMNED_BER`, `NOT_APPLICABLE` |
| `ItemCategory` | `DURABLE`, `CONSUMABLE` |
| `RequisitionStatus` | `AUTO_PROCESSED`, `PENDING_JUSTIFICATION`, `LOCKED_REVIEW`, `APPROVED`, `REJECTED`, `DECIDED` |
| `TurnoverStatus` | `AWAITING_SPENT_SCAN`, `READY_TO_APPROVE`, `RELEASED` |
| `RepairDecision` | `REPAIR_APPROVED`, `UNDER_REPAIR`, `RETURNED_TO_SERVICE`, `CONDEMNED` |
| `ReplacementStatus` | `DRAFT`, `OLD_UNIT_VERIFIED`, `PENDING_SECOND_APPROVAL`, `COMPLETED`, `REJECTED` |
| `AuditFlagType` | `DUPLICATE_REPLACEMENT`, `RETIRED_RESCAN`, `UNIT_AGE`, `LOCATION_RATE`, `REJECTED_REPLACEMENT`, `DORMANT`, `VARIANCE`, `RECONCILIATION` |
| `IncidentType` | `DEFECT`, `JAM`, `BROKEN` |
| `WorkOrderStatus` | `TICKET_DISPATCHED`, `QUOTE_RECEIVED`, `AWAITING_DECISION`, `CLOSED_REPAIRED`, `CLOSED_REPLACED` |

**Status transitions enforced server-side** (reject anything else):

- `IN_STOCK → ISSUED_IN_USE → RETURNED_EMPTY | RETIRED`
- `CONDEMNED_BER → RETIRED` (terminal; can never be issued)
- `AWAITING_SPENT_SCAN → READY_TO_APPROVE → RELEASED`
- `DRAFT → OLD_UNIT_VERIFIED → PENDING_SECOND_APPROVAL → COMPLETED | REJECTED`
- Repair: `NEEDS_MAINTENANCE → UNDER_REPAIR → OPERATIONAL | CONDEMNED_BER`

---

## 4. Auth

### `POST /auth/login`

```json
{ "email": "custodian@cit.edu", "password": "…", "portal": "CENTRAL" }
```

`portal`: `CENTRAL` | `LAB`. Returns the user, role and token. Reject a lab user selecting the Central
portal (and vice versa) with `403 WRONG_PORTAL`.

```json
{
  "token": "…",
  "user": { "id": "usr_01", "name": "Property Custodian", "role": "CENTRAL_CUSTODIAN", "portal": "CENTRAL" }
}
```

### `GET /auth/me`
Returns the authenticated user and role. Every audit entry must carry this user.

---

## 5. Module 1 — Demand, alerts and requisitions

### `GET /items/{itemId}/forecast`

```json
{
  "itemId": "TNR",
  "name": "HP LaserJet Toner W9004MC",
  "stock": 2,
  "burnRate14d": 0.21,
  "daysToDepletion": 9.3,
  "leadTimeDays": 21,
  "safetyBufferDays": 7,
  "triggerDays": 28,
  "status": "ALERT_PR_DRAFTED",
  "projectedDemand": 6
}
```

Computation: `burnRate14d = units consumed in the last 14 days / 14`;
`daysToDepletion = stock / burnRate14d`; alert when `daysToDepletion <= leadTimeDays + safetyBufferDays`.

### `PUT /items/{itemId}/forecast-settings`
`CENTRAL_CUSTODIAN`. Body: `{ "leadTimeDays": 21, "safetyBufferDays": 7 }`.
Validate `leadTimeDays` 14–21 and `safetyBufferDays` 0–30 (integers).

### `GET /reorder-alerts`
Query: `tab=ALL|ALERT|OK`. Returns the forecast rows plus `purchaseRequisitionId` when an alert exists.

### `POST /reorder-alerts/recalculate`
Recomputes forecasts; returns the updated list. This is the dashboard's **Recalculate** action.

### `GET /items/{itemId}/purchase-requisition`
Returns the pre-generated PR: `prNumber`, item, requesting unit, current stock, burn rate, days to
depletion, trigger, projected demand, requested quantity, status.

### `GET /requisitions?status=`
### `POST /requisitions`
`LAB_ASSISTANT` / `LAB_MANAGER`.

```json
{ "itemId": "A4", "quantity": 4, "labId": "WIL-LAB-3" }
```

Server computes variance `V = ((currentTermVolume - H_base) / H_base) * 100` and returns one of:

| Condition | Result |
|---|---|
| `V <= 25` | `AUTO_PROCESSED` |
| `25 < V < 50` | `PENDING_JUSTIFICATION` — require `justification` |
| `V >= 50` | `LOCKED_REVIEW` — write `VARIANCE` audit flag |

Response: the requisition with `baselineVolume`, `currentTermVolume`, `variancePercent`, `status`.

### `GET /requisitions/{id}`
### `POST /requisitions/{id}/approve` / `POST /requisitions/{id}/reject`
`CENTRAL_CUSTODIAN`. Reject requires `reason` of **at least 10 characters**; both write an audit entry.

---

## 6. Module 2 — 1-to-1 turnover

### `GET /turnovers?status=`
### `POST /turnovers/{machineId}/scan-spent`

```json
{ "assetId": "TNR-WIL-2026-001" }
```

- If `assetId` matches the unit active on the machine: mark it `RETURNED_EMPTY`, set the turnover to
  `READY_TO_APPROVE`, unlock the new unit, return `{ "match": true, "auditEntryId": "…" }`.
- Otherwise: keep issuance locked, write a `MISMATCH` audit entry with actor + timestamp, and return
  `409 SPENT_UNIT_MISMATCH` with `{ "match": false }`.

### `POST /turnovers/{turnoverId}/approve`
`CENTRAL_CUSTODIAN`. Re-checks the old unit is `RETURNED_EMPTY`, sets the new unit `ISSUED_IN_USE`,
links it to the machine, writes the audit entry, returns `RELEASED`.

### `GET /machines/{machineId}/active-unit`
Used by Lab Inventory / Turnover Scan. Returns the installed unit and its status (which may be
`RETURNED_EMPTY` while awaiting release — see the "installed" note in the UI).

---

## 7. Module 3 — Units, repairs, replacements, integrity

### `GET /units?q=&category=&inventoryStatus=&page=&size=`
### `GET /units/{assetId}`
Returns the unit record + history. History entries are `{ event, actor, at }`, append-only.

### `PATCH /units/{assetId}`
`CENTRAL_CUSTODIAN`. `{ "serialNumber": "CR3V3P-88120", "requireOneToOne": true }`.
`serialNumber` is optional and may be cleared. Writes a history entry.

### `POST /units/{assetId}/reprint-qr`
Returns/queues a printable label. QR payload must contain **only** the asset ID (or item URL); status is
never encoded.

### `POST /incidents`
`LAB_ASSISTANT` / `LAB_MANAGER`. Multipart: `assetId`, `type` (`DEFECT|JAM|BROKEN`), `recurring`,
`description`, `photo` (required).
If `recurring = true`: set `NEEDS_MAINTENANCE` and create a work order (`TICKET_DISPATCHED`), per FR-3.11.

### `GET /work-orders?status=`
### `POST /repairs/{assetId}/quotes`
Body: `{ "quoteAmount": 5000, "repairable": true }`. Stores the pending quote and computes
`BER = ((cumulativeRepairCost + pendingQuote) / replacementValue) * 100`.

### `POST /repairs/{assetId}/approve`
Allowed only when `BER < 50` and `repairable = true`. Sets `UNDER_REPAIR`, appends the invoice to the
repair history.

### `POST /repairs/{assetId}/return-to-service`
Allowed only when `UNDER_REPAIR` and no pending quote at/above 50% BER. Sets `OPERATIONAL`, keeps the
same asset ID/QR/history.

### `POST /repairs/{assetId}/condemn`
Allowed when `BER >= 50` or `repairable = false`. Sets `CONDEMNED_BER` and `RETIRED`, blocks future
issue, creates the PAR/ICS form payload.

### `GET /condemnation-forms/{assetId}`
Returns the pre-filled fields: property tag, description, serial (if any), location/custodian,
replacement value, BER %, maintenance expense ledger.

### `GET /replacements/candidates?requestId=`
Only `IN_STOCK` units with no issue/usage history and a delivery record dated after the request.

### `POST /replacements`
`{ "oldAssetId": "KB-0007", "reason": "Broken keyboard at WIL workstation 5", "requesterId": "…" }`

### `POST /replacements/{id}/scan-old`
`{ "assetId": "KB-0007" }` — must match the old unit; otherwise `409 OLD_UNIT_MISMATCH`.

### `POST /replacements/{id}/verify-new`
`{ "newAssetId": "KB-0152" }` — runs the four rules:
old retired/repair, new `IN_STOCK` never issued, delivery after request, IDs differ.
Returns `{ "valid": true, "rules": [{ "code": "OLD_RETIRED", "passed": true, "note": "…" }] }`.

### `POST /replacements/{id}/submit`
Multipart: old photo, new photo, `secondApproverId`. Moves to `PENDING_SECOND_APPROVAL`;
both photos are mandatory.

### `POST /replacements/{id}/confirm`
`SECOND_APPROVER`, must be a different user. Sets old `RETIRED`, new `ISSUED_IN_USE` at the location,
stores the old→new link, verifier and timestamps.

### `POST /replacements/{id}/reject`
`{ "reason": "Previously issued unit" }`. Logs the attempt and creates a `REJECTED_REPLACEMENT`
audit flag.

### `GET /reconciliation-sessions`
### `POST /reconciliation-sessions`
`{ "roomId": "WIL-LAB-3", "frequency": "WEEKLY" }` — scheduled scan (FR-3.26). `frequency`:
`ONCE|WEEKLY|MONTHLY`; returns `nextScanAt`.

### `POST /reconciliation-sessions/{id}/scans`
`{ "assetId": "WS-0301" }` — idempotent per session; duplicates rejected.

### `POST /reconciliation-sessions/{id}/finish`
Compares scans with the room's expected units; returns `matched`, `missing`, `unexpected`, and creates
one `RECONCILIATION` audit flag per discrepancy.

### `GET /audit-flags?type=&reviewed=`
### `POST /audit-flags/{id}/review`
`{ "note": "Checked the replacement request and confirmed the duplicate." }`
Note is **required and at least 10 characters**; stores reviewer + timestamp and moves the flag to
reviewed. Flag types: duplicate replacement, retired re-scan, unit age, location rate, rejected
replacement, dormant, variance, reconciliation.

---

## 8. Module 4 — AI-assisted intake

### `GET /delivery-records?type=DR|PO`
Returns `DR-118`, `DR-119`, `PO-2026-0031` etc. A unit may only enter through one of these (FR-3.07/4.01).

### `POST /intake`
`{ "deliveryRecordId": "DR-118" }` — starts an intake and returns `intakeId`.

### `POST /intake/{id}/photo`
Multipart image. Backend forwards it to the vision AI and returns **only**:

```json
{ "suggestedName": "Keyboard", "suggestedCategory": "DURABLE_PERIPHERAL", "confidence": 0.92 }
```

Never return quantity, serial, age or "newness" from the AI (FR-4.04/4.10). API key stays server-side.
On timeout/error return `503 AI_UNAVAILABLE`; the client offers manual registration (FR-4.09).

### `POST /intake/{id}/manual`
`{ "name": "Keyboard", "category": "DURABLE_PERIPHERAL" }` — manual fallback.

### `POST /intake/{id}/confirm`
`CENTRAL_CUSTODIAN`.

```json
{
  "name": "Keyboard",
  "category": "DURABLE_PERIPHERAL",
  "quantity": 5,
  "location": "Property storeroom",
  "unitCost": 650,
  "requireOneToOne": false,
  "serials": ["", "", "", "", ""]
}
```

`quantity` 1–500 and must be staff-typed (never AI-derived). On save: create one `IN_STOCK` unit per
quantity, generate asset IDs + QR values, link each to the delivery record, return the printable label
sheet. `serials` are optional and per unit (FR-3.02/4.08).

### `GET /intake/{id}/labels`
Returns `[{ "assetId": "KB-0155", "qrPayload": "KB-0155", "deliveryRecordId": "DR-118" }]` for printing.

---

## 9. Cross-cutting rules

- **Audit:** every scan and transaction writes `{ actorId, account, action, entity, at, detail }`.
  No mutation endpoints; the UI shows the history read-only.
- **Status:** invalid transitions return `409 INVALID_STATUS_TRANSITION` and are never stored
  (NFR-R3).
- **AI:** the backend alone talks to the vision service; timeout ≤ 10 s then fallback (NFR-P3/S4).
- **QR:** payload is the asset ID only; the database decides status (FR-3.03).
- **Photos:** incident and replacement photos are required; store a URL/reference, not a blob.
- **Two-person replacement:** the second approver must be a different authenticated user.
- **Validation:** rejection/review notes ≥ 10 chars; requisition quantity 1–100; intake quantity 1–500;
  lead time 14–21; safety buffer 0–30; BER threshold 50%.

---

## 10. Suggested tables

`users`, `roles`, `items`, `units`, `unit_history`, `delivery_records`, `requisitions`,
`requisition_events`, `turnovers`, `turnover_scans`, `incidents`, `work_orders`, `repair_quotes`,
`repair_invoices`, `replacements`, `replacement_evidence`, `reconciliation_sessions`,
`reconciliation_scans`, `audit_flags`, `audit_log`, `intake_sessions`.

Keep `audit_log` append-only (no UPDATE/DELETE grants for the application role), and store money as
`DECIMAL(12,2)`.
