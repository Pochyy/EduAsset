# PRODUCT.md — EduAsset

## What this is

EduAsset is an institutional property custodianship and predictive inventory system for the WildCat
Innovation Labs (WIL) and the CIT Property Office. It tracks durable equipment and high-turnover
consumables as individual units, enforces 1-to-1 turnover, computes burn-rate/depletion forecasts,
supports BER-based repair-or-retire decisions, verified replacements, reconciliation and an audit
queue, and provides AI-assisted item intake.

The repository holds two front ends. The **static design reference** under `design/` is the
approved 17-screen prototype, exported as HTML using the design-component runtime. The **React +
Tailwind application** at the repository root is the in-progress replacement for it: the shell,
Login, Central Dashboard, Reorder Alerts, Requisition Review, Turnover Approval, Master Ledger,
Reconciliation, Audit Queue and the complete Lab portal are implemented, and the three remaining
asset-decision/intake screens are routed placeholders. The React slice was merged to `main` on 24
November 2026 (`e70eee4`). Production still targets React + Spring Boot + MySQL; neither front end is
the production application. Current port state and next work are tracked in `docs/HANDOFF.md`.

## Who it is for

| User | Portal | What they do |
|---|---|---|
| WIL Lab Manager | Lab | Requisitions, defect reports, lab inventory and work orders |
| WIL Student Lab Assistant | Lab | Day-to-day disbursement, turnover scans, incident reports (often on a phone in the real build) |
| Central Property Custodian | Central | Receives/registers items, approves disbursements and locked requisitions, repairs, replacements, reconciliation, audit queue |
| Second Approver (inventory staff) | Central | Confirms replacements as the second person |
| Campus technician | none | Receives work orders and quotes, outside the portal |

## Surfaces and modes

| Surface | Mode | Why |
|---|---|---|
| 17 app screens | **Operate** | The user completes a task; scanability, consistency and real usage outrank expression |
| Sign-in | **Operate** | A short task with a brand moment; portal choice and validation |
| Launcher (`design/index.html`) | **Operate** | A navigation surface for reviewers, not a marketing page; brand-forward but functional |

## Jobs to be done

1. See what needs action now: reorder alerts, locked requisitions, turnover approvals, BER decisions, audit flags.
2. Requisition supplies with live variance against a historical baseline, and justify or lock abnormal requests.
3. Turn over a spent consumable 1-to-1 before a new unit is released.
4. Keep one record, ID and QR per unit; track inventory status and health state separately.
5. Log repairs, compute BER, approve repair / return to service / condemn.
6. Perform a verified replacement with four rules, photos and a second approver.
7. Reconcile a room on a schedule and review discrepancies/flags with a note.
8. Receive new items from a delivery record or PO, with optional AI name/category and staff-typed quantity.

## Constraints

- SRS: `Draf SRS.pdf` (IEEE structure; FR/UC/NFR). Desktop browser; WCAG AA; 44 px targets.
- Production stack named by the SRS: React front end, Spring Boot REST API, MySQL, vision AI called
  from the backend only; the API key never reaches the client.
- Prototype: no backend, no auth, no persistence. Sample data in memory.
- Phone screens (Figure 3.38) and phone-width layout are out of scope for this pass.
- The app is dense and data-heavy; the design must stay calm across 17 screens and long tables.

## Approved design revision

The owner approved replacing the SRS’s CIT-U maroon/gold branding (SRS §3.3.1) with the WildCat
Innovation Labs palette: butter yellow, amber, burnt orange, ink and warm white. Inter remains the
typeface. Functional requirements are unchanged. The revision is recorded in `DESIGN.md`.

## Success

- A reviewer can open the launcher and reach any screen in two clicks.
- Every SRS blocking/major requirement remains demonstrable.
- The interface reads as one deliberate system, not a generic AI dashboard.
- A backend developer can use `docs/API-CONTRACT.md` and `docs/SEED-DATA.json` without reverse-engineering the HTML.
